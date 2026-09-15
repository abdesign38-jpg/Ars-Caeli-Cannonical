# Test Plan — AEON Phase D.1 Observation Runtime Foundation

## 1. Testing philosophy

D.1 tests must prove behavior, not merely exercise functions.

Every important invariant should have:
- positive fixture;
- mutation or invalid-transition test;
- persistence assertion;
- replay assertion where relevant.

A failed command must be checked for **absence of side effects**.

---

## 2. Contract tests

Python/jsonschema:

- every D.1 schema self-validates under Draft 2020-12;
- canonical `$id` values unique;
- every example validates;
- external D.0 refs are registered locally, never fetched over network during CI;
- `date-time` format uses a FormatChecker in D.1 contract validation;
- export examples validate against pinned D.0 dependencies.

Negative:
- invalid UUID event ID;
- seq < 0;
- invalid SHA-256;
- non-RFC3339 wall time;
- context marker projection policy changed;
- unknown event type;
- mismatched event payload.

---


## 2A. Canonicalization cross-language vectors

Run `reference/CANONICALIZATION_VECTORS.json` in:
- JavaScript `canonicalize@5.0.0`;
- Python `rfc8785==0.1.4`.

Assert canonical bytes and SHA-256 are identical.

Negative:
- reject or explicitly handle negative zero per project policy;
- reject non-finite numbers;
- no BigInt/non-JSON values.


## 3. State-machine matrix

Generate tests from an explicit transition table.

For every valid transition:
- next state correct;
- emitted event type correct.

For every invalid state/command pair:
- `STATE_TRANSITION_INVALID`;
- no event;
- no revision change;
- no projection change.

Terminal states:
- FINALIZED immutable;
- ABORTED immutable.

---

## 4. Event sequencing

Prove:
- first seq = 0;
- next seq = previous + 1;
- gaps rejected on import/replay;
- duplicates rejected;
- duplicate event IDs rejected;
- session_id constant across one journal;
- wall times may repeat;
- monotonic time never used across runtime epochs.

Do not require wall clock monotonicity as a scientific timing rule.

---

## 5. Answered behavioral flow

Fixture:
- Session start;
- Trial arm;
- stimulus onset;
- response captured;
- record committed.

Assert:
- allowed choice only;
- first valid response wins;
- input modality preserved;
- RT = response monotonic - onset monotonic;
- D.0 record valid;
- evidence role behavioral_measured;
- no correctness field;
- state returns READY;
- journal contains original capture event and committed record;
- projection contains exactly one behavioral record.

---

## 6. Timeout flow

Assert:
- onset exists;
- timeout event resolution;
- record choice null;
- RT null;
- timing trace response null;
- state returns READY after record commit.

Timeout before onset:
reject as invalid runtime command.

---

## 7. Abort flows

### Abort before onset
Allowed.

Record:
- aborted;
- onset null;
- response null;
- choice null;
- RT null.

### Abort after onset
Allowed.

Record:
- aborted;
- onset preserved;
- response null;
- choice null;
- RT null.

---

## 8. Retry lineage

Run the same Trial twice.

First:
aborted.

Second:
answered.

Assert:
- two attempt IDs;
- ordinals 1 and 2;
- two immutable records;
- no overwrite;
- both survive export/import.

---

## 9. Runtime epoch tests

Create Attempt in epoch A.

### Restart before onset
Replay under epoch B:
- recovery event;
- aborted record;
- timing integrity UNKNOWN.

### Restart after onset
- onset preserved;
- no fabricated response;
- timing integrity UNKNOWN.

### Restart after response capture but before record commit
- response event already persisted;
- record reconstructed from journal;
- no second participant response requested;
- RT calculated only from epoch-A onset/response.

### Cross-epoch response
Explicit response under new epoch for old onset:
reject or recover, never treat as valid RT.

---

## 10. Integrity flags

During active Attempt:
flag:
- perceptual stimulus;
- response input;
- timing.

Assert:
- flags persist in committed record;
- INVALID/UNKNOWN reasons retained;
- record is not silently dropped;
- context marker may coexist.

Integrity flag after record commit:
reject modification of immutable record; new annotation must be separate.

---

## 11. Participant observation stream

Commit a valid participant observation.

Assert:
- journal event created;
- Response Series observations append;
- status remains `participant_reported`;
- not copied to behavioral_records;
- not copied to context markers.

Invalid stable-v0.1 observation:
reject.

---

## 12. Open marker stream

Record markers from:
- participant;
- operator;
- runtime.

For each kind.

Assert:
- journal append;
- state unchanged;
- no response-series append;
- marker survives export/import byte-equivalent after canonical serialization.

A marker with rich nested JSON data is allowed.

---

## 13. Artifact integrity

Resolve Probe, Trial and Stimuli.

Assert:
- D.0 version supported;
- content hash stored;
- identical document deduplicated by hash;
- changed content yields changed hash;
- supplied stale expected hash blocks;
- export includes exact snapshots used.

Do not use artifact filename as identity proof.

---

## 14. Projection replay

For a completed Session:

```text
replay(journal)
```

must regenerate:
- Session State;
- Response Series.

Compare using canonical JSON.

Mutate cached projection:
replay repairs cache.

Mutate Journal:
recovery/export blocks.

---

## 15. IndexedDB transaction tests

Also prove the implementation does not perform external async work inside the transaction callback. Hash/validation inputs must be prepared first.

Test persistent-storage capability handling:
- already persistent;
- persist granted;
- persist denied;
- StorageManager unavailable.

Test payload limits:
- marker just below limit;
- marker just above limit;
- no silent truncation.


Use pinned `fake-indexeddb`.

Execute common store contract against:
- MemoryStore;
- IndexedDBStore.

Inject failures:
- after event put;
- before projection put;
- before session update.

Assert no partial transaction state.

---

## 16. Concurrency

Two runtime instances load revision N.

Instance A commits.

Instance B attempts write using N.

Assert:
`SESSION_CONFLICT`.

Instance B reloads state and may then retry intentionally.

No last-writer-wins.

---

## 17. Export integrity

Round trip:
Session -> export -> import -> replay.

Assert canonical equality.

Tamper separately:
- Session State;
- Response Series;
- Journal;
- artifact snapshots.

Each:
`EXPORT_HASH_MISMATCH` or `EXPORT_REPLAY_MISMATCH`.

Also assert:
hashes are described as tamper evidence, not signatures.

---

## 18. D.0 JS/Python conformance corpus

Create shared JSON fixtures:

```text
valid/
invalid/
```

Examples of invalid mutations:
- wrong Probe schema version;
- undeclared choice;
- wrong Trial probe_id;
- missing stimulus;
- wrong family;
- duplicate target slot;
- behavioral Record RT mismatch;
- timeout with choice;
- behavioral record with correctness field.

Python:
D.0 validator/semantic layer determines canonical expected outcome.

JavaScript:
D.1 runtime guards must match expected outcome for fields it consumes.

CI fails on divergence.

---

## 19. Browser harness acceptance

Manual browser proof before D.1 closure:

1. create Session;
2. arm PG01;
3. mark onset;
4. choose left;
5. inspect committed record;
6. add unexpected participant marker;
7. reload;
8. Session resumes READY;
9. arm second attempt;
10. reload after onset;
11. recovery produces explicit aborted record;
12. export;
13. import same export;
14. verification passes.

Repeat with two tabs to demonstrate revision conflict.

---

## 20. Regression boundaries

Every D.1 PR:
- full D.0 Python suite remains green;
- D.0 validation report remains current;
- no D.0 stable schema changes unless separately reviewed;
- no Sound Field source changes unless integration is explicitly in scope;
- no compiled Pilot drift.

D.1 does not get permission to "fix" D.0 casually.
