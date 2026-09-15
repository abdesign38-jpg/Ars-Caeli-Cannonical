# AEON Phase D.1 — Observation Runtime Foundation · Implementation Spec v0.1

## 0. Baseline

**Repository:** `abdesign38-jpg/Ars-Caeli-Cannonical`  
**D.0 closure authority:** `b8b1a4eea2e9e5fc8e254b20340c8b3a66d367a2`  
**New module:** `08_ENGINE/observation-runtime-v0.1/`

D.1 consumes the D.0 measurement contracts. It does not rewrite them.

D.1 is the layer that turns those contracts into an observable, resumable browser session.

---

## 1. Design intent

D.1 must be strict about **identity, timing, persistence and provenance** while remaining open to **unexpected observations**.

The runtime therefore has two simultaneous duties:

```text
planned measurement path
    -> participant observation / behavioral record
    -> RESPONSE_SERIES v0.2

unexpected context path
    -> CONTEXT_MARKER
    -> append-only journal only
```

The second path is intentional.

Unknown or unusual observations are not discarded simply because the experiment did not predict them.

They are also not promoted automatically into:
- behavioral evidence;
- derived metrics;
- symbolic proof;
- diagnosis;
- causal explanation.

This is the operational balance for D.1:
**wide aperture, narrow claims.**

---

## 2. Hard phase boundary

D.1 OWNS:

- session lifecycle;
- monotonic timing capture;
- input capture;
- participant-reported observation append;
- behavioral-record construction;
- integrity flags;
- append-only journal;
- runtime recovery;
- response-series projection;
- artifact snapshots/fingerprints;
- IndexedDB persistence;
- session export/import verification;
- context markers;
- concurrency protection.

D.1 DOES NOT OWN:

- geometric stimulus generation;
- perceptual rendering;
- adaptive psychophysical algorithms;
- QUEST+;
- audio synthesis;
- Sound Field scheduling;
- experimental scoring/accuracy as raw evidence;
- symbolic interpretation;
- wound inference;
- diagnostic or therapeutic conclusions.

D.2 will later provide a presentation adapter.

D.3+ may converge streams only after D.1 and D.2 are independently stable.

---

## 3. Module shape

Implement:

```text
08_ENGINE/observation-runtime-v0.1/
  README.md
  package.json
  package-lock.json

  contracts/
    runtime-event.schema.json
    session-state.schema.json
    context-marker.schema.json
    artifact-snapshot.schema.json
    session-export.schema.json

  src/
    observation-runtime.mjs
    state-machine.mjs
    clock.mjs
    ids.mjs
    canonical-json.mjs
    artifact-provider.mjs
    d0-runtime-guards.mjs
    behavioral-record-builder.mjs
    response-series-projector.mjs
    journal.mjs
    errors.mjs

    storage/
      observation-store.mjs
      memory-store.mjs
      indexeddb-store.mjs

    adapters/
      browser-input-adapter.mjs
      participant-observation-adapter.mjs
      context-marker-adapter.mjs

    export/
      session-export.mjs
      session-import.mjs

  tools/
    validate-contracts.py

  tests/
    state-machine.test.mjs
    journal.test.mjs
    projector.test.mjs
    record-builder.test.mjs
    recovery.test.mjs
    export-integrity.test.mjs
    concurrency.test.mjs
    indexeddb-store.test.mjs
    d0-conformance.test.mjs
    context-markers.test.mjs

  harness/
    browser-smoke.html
    browser-smoke.mjs

  examples/
    ...
```

The implementation may split files differently if responsibility boundaries remain equivalent.

Do not place D.1 inside `sound-field-v0.3`.

---

## 4. Runtime language and dependency policy

Use browser-native **ES modules** (`.mjs`).

Target:
- modern browsers;
- Node 24 for tests.

Production dependency:

```json
"canonicalize": "5.0.0"
```

It is the RFC 8785/JCS implementation used for all content-addressed hashing.

Dev dependency:

```json
"fake-indexeddb": "6.2.5"
```

Python contract tooling additionally pins:

```text
rfc8785==0.1.4
```

Pin exact versions and commit `package-lock.json`. Do not maintain a hand-written second canonicalization algorithm.

It is test infrastructure only.

---

## 5. D.0 contract dependency

D.1 consumes these D.0 resources without copying them:

```text
experimental-protocol-model/v0.1/
  contracts/draft-v0.2/
    perceptual-stimulus.schema.json
    behavioral-probe.schema.json
    behavioral-trial.schema.json
    behavioral-record.schema.json
    response-series.schema.json

  contracts/response-series.schema.json
```

Supported measurement schema:

```text
0.2-draft
```

Runtime must reject an artifact version it does not explicitly support.

D.0 Python schemas remain canonical contract validation in CI.

D.1 JavaScript runtime guards exist to fail early in-browser for the fields D.1 actually consumes.

The two layers must be checked with a shared conformance corpus.

---

## 6. Session state machine

Persisted states:

```text
CREATED
READY
ARMED
OBSERVING
RESOLVED
FINALIZED
ABORTED
```

Nominal path:

```text
CREATED
  -> READY
  -> ARMED
  -> OBSERVING
  -> RESOLVED
  -> READY
  -> ...
  -> FINALIZED
```

Abort before stimulus:

```text
READY
 -> ARMED
 -> RESOLVED
 -> READY
```

because an aborted Behavioral Record is still committed.

Session abort:

```text
CREATED|READY -> ABORTED
```

No trial may be silently discarded.

See `docs/STATE_MACHINE.md`.

---

## 7. Runtime epochs and time

Every page/runtime initialization creates:

```text
runtime_epoch_id = crypto.randomUUID()
performance_time_origin_ms = performance.timeOrigin
```

Every event stores:
- RFC3339 wall time;
- runtime epoch ID;
- `performance.timeOrigin`;
- `performance.now()`.

Use:

```text
performance.now()
```

for within-attempt intervals.

Use wall time only for chronology/export.

Never compute RT from `Date.now()`.

### 7.1 Epoch boundary rule

Stimulus onset and participant response for one valid RT must belong to the same runtime epoch.

If the page reloads while an attempt is active:

```text
runtime_epoch changes
```

so D.1 performs recovery instead of pretending timing continuity.

---

## 8. Journal-first architecture

The append-only runtime journal is the **source of truth**.

`RESPONSE_SERIES v0.2` is a projection.

A committed journal event is never mutated.

Relevant event types:

```text
session_created
session_started

trial_armed
stimulus_onset
response_captured
response_timeout
attempt_aborted
integrity_flagged

behavioral_record_committed
participant_observation_committed
context_marker_recorded

recovery_detected

session_finalized
session_aborted
```

The runtime event schema in this package is normative for D.1.

### 8.1 Why journal-first

It preserves:
- what occurred;
- in what order;
- recovery history;
- unexpected events;
- integrity degradation;
- retries;
- the difference between capture and projection.

It also lets the Response Series be rebuilt rather than trusted blindly.

---

## 9. RESPONSE_SERIES projection

Projection rules:

```text
behavioral_record_committed
 -> response_series.behavioral_records append

participant_observation_committed
 -> response_series.observations append

context_marker_recorded
 -> NO response-series projection

integrity_flagged
 -> modifies the active attempt draft only;
    final values appear in the committed Behavioral Record
```

No D.1 event automatically appends:
- `derived_metrics`;
- correctness;
- accuracy;
- threshold;
- PSE;
- symbolic interpretation.

`engine_records` remain outside D.1 ownership.

---

## 10. Behavioral record construction

The runtime constructs records from journal/state.

Callers do not pass arbitrary final Behavioral Record JSON to storage.

### Answered

Requires:
- Probe/Trial loaded;
- stimulus onset;
- response event;
- choice allowed by Probe;
- same runtime epoch;
- display context;
- integrity state.

Then:

```text
reaction_time_ms =
response.monotonic_ms - onset.monotonic_ms
```

Input modality comes from the actual capture adapter.

### Timeout

Requires a real stimulus onset.

Produces:
- `response_status = timeout`;
- choice null;
- RT null;
- response timestamp null.

### Abort

May occur before onset.

Produces:
- `response_status = aborted`;
- choice null;
- RT null;
- onset nullable;
- response null.

Never invent missing timing events.

---

## 11. Attempt identity and retry

Every arm operation creates a new:

```text
attempt_id = UUIDv4
```

and explicit:

```text
attempt_ordinal >= 1
```

Retrying a Trial does not delete or overwrite the earlier attempt.

The earlier Behavioral Record remains.

The retry creates:
- new attempt ID;
- new journal path;
- new Behavioral Record ID.

This lets exploratory protocols retain failure/retry structure instead of laundering it away.

---

## 12. Artifact snapshots and fingerprints

When a Trial is armed, resolve:

- Probe;
- Trial;
- every referenced Stimulus.

For every artifact:
1. verify D.0 runtime guard;
2. canonicalize;
3. SHA-256 hash;
4. persist immutable artifact snapshot;
5. record `{artifact_id, sha256}` in `trial_armed`.

Snapshots are keyed by hash, so repeated use is deduplicated.

The session export therefore retains the exact measurement definitions used during capture even if the repository evolves later.

A hash mismatch is execution-blocking.

---

## 13. Canonical JSON and hashing

Use **RFC 8785 JSON Canonicalization Scheme (JCS)** for every content-addressed hash.

Canonicalization identifier:

```text
RFC8785-JCS
```

JavaScript uses pinned `canonicalize@5.0.0`.
Python validation uses pinned `rfc8785==0.1.4`.

Then:
- UTF-8 encode canonical bytes;
- SHA-256.

Do not reuse `aeon.sorted-json.v0.1` for D.1 hashes. Sound Field's current sorted-key JSON is sufficient inside its JS-only fingerprint path, but D.1 verifies hashes across JavaScript and Python and therefore requires a cross-language canonicalization contract.

Add RFC 8785 golden vectors to both JS and Python tests, including:
- `1` vs `1.0`;
- exponent notation;
- `-0` rejection/normalization policy;
- nested objects;
- Unicode strings.

Hashes provide **tamper evidence**, not authorship authentication.

They are not digital signatures.

---

## 14. Persistence model — IndexedDB

Database:

```text
aeon-observation-runtime-v0.1
```

Version:

```text
1
```

Object stores:

```text
sessions
  key: session_id

events
  key: [session_id, seq]
  unique index: event_id

artifacts
  key: sha256

projections
  key: session_id
```

### 14.1 Atomic command commit

Every state-changing command runs in one `readwrite` transaction spanning only the stores it needs.

**Critical transaction-lifetime rule:** perform all WebCrypto hashing, schema/runtime validation, canonicalization and other non-IndexedDB asynchronous work **before opening the transaction**. Once a transaction is open, do not `await` arbitrary external promises; IndexedDB transactions can auto-commit/become inactive when control returns to the event loop without pending IDB requests.

For critical journal/state commits, request:

```text
durability = strict
```

when supported. If the browser cannot honor the durability hint, fall back explicitly and record that capability as runtime context; do not pretend strict durability was achieved.

At Session creation, check `navigator.storage.persisted()` and, when available, request `navigator.storage.persist()`. Record whether storage is `persistent`, `best_effort`, or `unavailable`. Persistence denial does not invalidate the experiment, but it must remain observable.

Every state-changing command runs in one `readwrite` transaction spanning only the stores it needs.

Within the transaction:

1. read current Session;
2. compare `revision`;
3. validate transition;
4. append event(s);
5. update artifact snapshots if needed;
6. update projection if needed;
7. update Session state/revision;
8. commit.

If any step fails, the transaction aborts.

Do not simulate transactions with separate writes.

### 14.2 No unload persistence

Never rely on:
- `unload`;
- `beforeunload`;
- `pagehide`;

to perform the primary persistence operation.

Persist every meaningful command as it happens.

A later reload invokes recovery.

---

## 15. Concurrency

Multiple browser tabs must not be able to silently drive the same Session.

Every command carries:

```text
expected_revision
```

The IndexedDB transaction reads the current revision inside the transaction.

Mismatch:

```text
SESSION_CONFLICT
```

No state/event/projection change occurs.

The caller must reload/replay before trying another command.

---

## 16. Crash/reload recovery

On runtime startup:

1. load Session snapshot;
2. load Journal;
3. replay Journal;
4. compare derived state/projection with persisted caches;
5. create new `runtime_epoch_id`;
6. handle unfinished attempt.

Recovery dispositions:

### Prior state ARMED

No onset exists.

Create:

```text
recovery_detected
attempt_aborted
behavioral_record_committed
```

Record:
- aborted;
- onset null;
- timing integrity UNKNOWN;
- reason includes runtime restart before onset.

### Prior state OBSERVING

Onset exists but response does not.

Create recovery event and an aborted record.

Keep the onset.

Timing integrity:
`UNKNOWN`.

### Prior state RESOLVED

The response/timeout/abort event exists but the record was not committed.

Reconstruct the record from the journal and commit it.

Do not discard a captured response merely because the browser died before projection.

---

## 17. Open observation channel

D.1 deliberately includes `CONTEXT_MARKER`.

Sources:

```text
participant
operator
runtime
```

Kinds:

```text
technical
environmental
phenomenological
procedural
unexpected
```

A marker may contain open JSON data and an optional note.

Example:

```text
participant spontaneously reports unusual visual salience
```

D.1 records:
- what was said;
- when;
- by whom;
- any structured values supplied.

It does **not** decide:
- why it happened;
- whether it is causal;
- whether it is symbolic;
- whether it belongs to a future metric.

Markers have:

```text
interpretation_policy = none_at_capture
projection_policy = journal_only
```

This channel exists specifically so exploratory data is not thrown away merely because it was not anticipated.

---

## 18. Participant-reported observations

D.1 may append a stable-v0.1 participant observation through:

```text
participant_observation_committed
```

The payload must satisfy:

```text
response-series.schema.json#/properties/observations/items
```

This stream remains distinct from:
- behavioral measurements;
- context markers;
- engine records.

---

## 19. Input adapter

Implement a browser input adapter that can arm:
- keyboard choices;
- pointer/click choices;
- touch choices.

The adapter:
- accepts the current Probe choice mapping;
- ignores invalid choices;
- commits only the **first valid response**;
- detaches listeners immediately after resolution;
- reports actual input modality;
- never computes correctness.

It must support AbortSignal or equivalent deterministic cleanup.

---

## 20. Presentation boundary

D.1 has no perceptual renderer.

Expose:

```text
markStimulusOnset(...)
```

or an equivalent Presentation Adapter port.

For now:
- a development harness may call it;
- D.2 will later call it after stimulus presentation.

This boundary is intentional.

The observation runtime knows that presentation occurred.

It does not know how the visual stimulus was generated.

---

## 21. Page visibility and unusual runtime events

D.1 may observe browser/runtime conditions such as:
- document becomes hidden;
- input adapter disconnects;
- runtime epoch changes;
- persistence failure.

Do not automatically invent causal effects.

Instead:
- add context marker and/or integrity flag;
- preserve the attempt;
- continue or abort according to explicit runtime policy.

For a hidden document during an active timing interval, default:

```text
timing_integrity = UNKNOWN
reason = page_visibility_hidden_during_observation
```

unless future calibration establishes a stronger rule.

---

## 22. Export

Export contains:

```text
Session State
RESPONSE_SERIES v0.2
full Journal
Artifact Snapshots
Manifest
```

Manifest SHA-256 covers each component separately.

On export:
1. replay journal;
2. reconstruct Response Series;
3. assert equality with persisted projection;
4. validate final D.0 records;
5. calculate hashes;
6. serialize export.

If replay and projection differ:

```text
EXPORT_INTEGRITY_FAILED
```

No “best effort” export labeled valid.

---

## 23. Import verification

Import is verification-first.

Before exposing an imported Session:
1. validate D.1 export schema;
2. verify hashes;
3. validate artifact snapshots;
4. validate journal event sequence;
5. replay state machine;
6. rebuild response series;
7. compare rebuilt vs embedded projection;
8. verify session terminal/nonterminal state.

Tampered export:
reject.

Unknown runtime version:
reject until explicitly migrated.

---

## 24. Error model

Use a typed error:

```text
ObservationRuntimeError
  code
  message
  details
  recoverable
```

Minimum codes:

```text
STATE_TRANSITION_INVALID
SESSION_NOT_FOUND
SESSION_FINALIZED
SESSION_CONFLICT

ARTIFACT_NOT_FOUND
ARTIFACT_HASH_MISMATCH
ARTIFACT_UNSUPPORTED_VERSION

CHOICE_NOT_ALLOWED
RUNTIME_EPOCH_MISMATCH
DUPLICATE_RECORD_COMMIT

STORE_TRANSACTION_FAILED
PROJECTION_DIVERGENCE

EXPORT_SCHEMA_INVALID
EXPORT_HASH_MISMATCH
EXPORT_REPLAY_MISMATCH

RECOVERY_FAILED
```

Do not encode control flow by parsing error-message strings.

---

## 25. Resource and payload limits

Exploratory capture is open, not unbounded.

Runtime defaults:

```text
MAX_CONTEXT_MARKER_CANONICAL_BYTES = 65536
MAX_CONTEXT_MARKER_NOTE_CHARS = 4096
MAX_CONTEXT_MARKER_LABEL_CHARS = 128
MAX_SINGLE_EVENT_CANONICAL_BYTES = 131072
```

Reject oversize payloads with a typed `PAYLOAD_LIMIT_EXCEEDED` error. Never truncate silently.

Journal/event-count and storage-quota warnings should be based on `navigator.storage.estimate()` rather than a tiny arbitrary session cap. When quota pressure is detected, emit a runtime Context Marker and refuse further capture only if safe persistence can no longer be guaranteed.

## 26. Privacy boundary

D.1 expects pseudonymous:

```text
participant_id
```

Do not introduce:
- name;
- email;
- exact address;
- medical-record number;
- account credentials.

The open marker channel is intentionally flexible, so documentation must warn operators not to put direct identifiers into notes.

No automatic PII classifier is required in D.1.

---

## 27. Testing architecture

Use:
- Node built-in test runner;
- `fake-indexeddb@6.2.5` for IndexedDB tests;
- Python/jsonschema for D.1 contract/schema validation.

### Required test groups

#### State machine
Every valid transition.
Every invalid transition.
No state mutation on failure.

#### Behavioral flows
Answered.
Timeout.
Abort before onset.
Abort after onset.
Retry same Trial with distinct attempts.

#### Timing
RT comes only from monotonic interval.
Wall clock never drives RT.
Epoch mismatch prevents valid RT.
Page restart recovery.

#### Persistence
Atomic event + state + projection.
Injected transaction failure leaves no partial commit.
Revision conflict fails closed.
Duplicate event ID rejected.

#### Projection
Journal replay deterministically reproduces Response Series.
Context markers are journal-only.
Participant observation goes to observations.
Behavioral record goes to behavioral_records.
No correctness in raw record.

#### Artifacts
Hash each artifact.
Deduplicate same hash.
Reject changed document with stale hash.
Session export includes exact snapshots.

#### Recovery
ARMED recovery.
OBSERVING recovery.
RESOLVED recovery.
Projection-cache corruption repaired from journal.
Unrecoverable journal corruption blocks.

#### Export/import
Untampered round trip.
Each component tamper rejected.
Unknown export version rejected.
Journal sequence gap rejected.

#### D.0 conformance
Valid D.0 examples accepted.
Mutation corpus rejected consistently by Python and JS guard.

#### Open markers
Can record unexpected free-form data.
Never projects automatically.
Survives export/import.

---

## 28. Development browser harness

A minimal non-production harness is allowed.

Purpose:
- create pseudonymous session;
- arm one existing PG01 Trial;
- manually mark onset;
- capture left/right;
- add context marker;
- simulate reload/recovery;
- export and re-import;
- display journal/state/projection for debugging.

It must be clearly labeled:

```text
DEVELOPMENT HARNESS — NOT EXPERIMENT UI
```

Do not style it as a finished participant interface.

---

## 29. CI

Create:

```text
.github/workflows/aeon-observation-runtime-integrity.yml
```

Watch:
- `08_ENGINE/observation-runtime-v0.1/**`;
- D.0 contracts/examples/measurement semantic code;
- the workflow itself.

Required CI:

```text
python 3.12
pip install -r 08_ENGINE/experimental-protocol-model/v0.1/requirements-dev.txt
python 08_ENGINE/observation-runtime-v0.1/tools/validate-contracts.py
python 08_ENGINE/experimental-protocol-model/v0.1/validator.py --examples
python -m pytest -q 08_ENGINE/experimental-protocol-model/v0.1/tests

node 24
npm ci --prefix 08_ENGINE/observation-runtime-v0.1
npm test --prefix 08_ENGINE/observation-runtime-v0.1
```

D.1 CI must fail if a later D.0 change breaks D.1 compatibility.

Do not modify D.0 tests merely to make D.1 green.

---

## 30. Implementation order

### D.1-A — Pure core
- errors;
- IDs;
- clock;
- canonical JSON;
- state machine;
- journal replay;
- response projector;
- MemoryStore.

### D.1-B — Measurement construction
- artifact provider;
- D.0 runtime guards;
- record builder;
- participant observations;
- context markers.

### D.1-C — Durable browser runtime
- IndexedDBStore;
- optimistic revision guard;
- recovery.

### D.1-D — Export/import
- artifact snapshots;
- manifest hashes;
- replay verification.

### D.1-E — Browser proof
- input adapter;
- dev harness;
- recovery demonstration.

Do not start D.2 implementation inside D.1-E.

---

## 31. D.1 closure gates

D.1 may close when all are true:

1. A normal answered trial survives export/import.
2. A timeout survives export/import without invented response time.
3. Abort-before-onset survives without invented onset.
4. Reload during OBSERVING produces explicit recovery and no false RT.
5. Reload after response but before record commit reconstructs the record.
6. Multiple-tab revision conflict cannot overwrite data.
7. Journal replay exactly regenerates Response Series.
8. Context markers survive but never project automatically.
9. Participant observations stay participant-reported.
10. Behavioral records stay behavioral-measured.
11. No correctness is persisted in raw behavioral records.
12. Artifact fingerprints identify the exact Probe/Trial/Stimulus used.
13. Tampering with export data is detected.
14. D.0 full suite remains green.
15. D.1 Node + contract suites remain green.
16. Sound Field source and compiled Pilot remain untouched.

Only then:

```text
AEON PHASE D.1 — OBSERVATION RUNTIME FOUNDATION: CLOSED
```
