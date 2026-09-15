# Persistence & Recovery — D.1

## IndexedDB stores

Database:
`aeon-observation-runtime-v0.1`

Version:
`1`

Stores:

```text
sessions
events
artifacts
projections
```

### sessions
Key:
`session_id`

Contains the current materialized Session State.

### events
Composite key:
`[session_id, seq]`

Unique index:
`event_id`

Events are immutable after commit.

### artifacts
Key:
`sha256`

Contains immutable artifact snapshots.

### projections
Key:
`session_id`

Contains the materialized `RESPONSE_SERIES v0.2`.

## Transaction rule

A runtime command is persisted atomically.

Before opening the IndexedDB transaction:
- resolve/validate D.0 artifacts;
- canonicalize/hash with RFC 8785/JCS;
- construct the candidate event/record/projection delta;
- perform any WebCrypto work.

After opening the transaction:
- do not await unrelated promises;
- perform only IndexedDB requests and synchronous request chaining;
- request `{ durability: "strict" }` where supported for critical observation commits;
- fall back explicitly if unsupported and record the capability.

This matters because IndexedDB transactions are event-loop sensitive and can become inactive/auto-commit when no requests remain pending.

For example `commitBehavioralRecord`:

```text
BEGIN IndexedDB readwrite transaction

read session
assert expected_revision
assert state == RESOLVED
build + validate Behavioral Record
assert attempt not previously committed

append behavioral_record_committed event
append record to response-series projection
update state -> READY
clear current_attempt_id
increment revision
update last_event_seq

COMMIT
```

If one operation fails:
the entire transaction is aborted.

## Storage persistence capability

At first Session creation:

```text
navigator.storage.persisted()
navigator.storage.persist()
navigator.storage.estimate()
```

when available.

Record:
- persistent;
- best_effort;
- unavailable.

Do not block capture merely because persistence permission is denied, but surface the risk in runtime context.

## Crash model

D.1 assumes the browser can stop at arbitrary moments.

Therefore no important state exists only in:
- DOM state;
- an unload handler;
- a delayed save queue.

Every meaningful command persists when it happens.

## Projection recovery

On startup:

```text
journal -> replay -> expected session state
journal -> projection -> expected response series
```

Compare against cached Session/Projection.

If cache differs but Journal is valid:
rebuild cache from Journal.

If Journal itself is invalid:
block the Session with `RECOVERY_FAILED`.

## Runtime epoch

Every browser initialization has:
- `runtime_epoch_id`;
- `performance.timeOrigin`.

An attempt may not produce a valid RT across epochs.

A restart is recovered explicitly.

## Multi-tab conflict

Each command receives `expected_revision`.

Inside the IndexedDB transaction:

```text
if stored_revision != expected_revision:
    throw SESSION_CONFLICT
```

Never resolve conflict by "last writer wins".

## IndexedDB shutdown rule

Do not defer primary writes to unload or beforeunload.

A browser may terminate before asynchronous work completes.

Persist continuously; recover on the next startup.

## Test requirement

The IndexedDB implementation must pass the same behavioral storage contract suite as MemoryStore, using pinned `fake-indexeddb`.

Inject failures before transaction completion and prove:
- no event appears;
- revision does not advance;
- projection does not advance.
