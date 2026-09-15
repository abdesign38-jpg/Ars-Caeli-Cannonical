# Code Health Guardrails — D.1 REVIEWED v2

## 1. One functional source of truth per concern

### Session transitions
Normative source: implementation transition table in `src/state-machine.mjs`.

Documentation tables are explanatory.

Tests must assert every transition/invalid transition from the exported table. Do not maintain an independent second machine in test code.

### Measurement semantics
Normative source: D.0 JSON Schema + Python semantic validator.

D.1 JavaScript runtime guards are **compatibility guards**, not a second full schema system. They validate only fields D.1 consumes and are checked against a shared mutation corpus.

### Projection
Normative source: Journal replay functions.

Persisted Response Series is a materialized cache and export projection, not an independent truth.

### Hashing
Normative canonicalization: RFC 8785/JCS.

Never add another serializer/hash path.

## 2. Keep pure core separate from browser shell

Pure modules:
- state machine;
- event reducer/replay;
- projection;
- record builder;
- canonical/hash wrapper interfaces;
- error definitions.

Browser-bound modules:
- IndexedDB;
- Performance clock;
- StorageManager;
- DOM input adapter;
- development harness.

Core tests should not need DOM globals.

## 3. Commands, events and projections are different types

A Command is intent.

An Event is an immutable fact that the command successfully committed.

A Projection is derived state.

Never persist Commands as if they happened.

Never mutate Events to repair Projections.

## 4. Transaction boundary

Do not perform network fetches, WebCrypto, schema validation or unrelated promises inside an active IndexedDB transaction.

Prepare immutable candidate data first.

Open transaction only for:
- revision check;
- store reads needed for conflict/duplicate protection;
- event/artifact/projection/session writes.

## 5. No generic repository class

Avoid a giant `ObservationRepository` with dozens of unrelated methods.

Expose the minimal `ObservationStore` contract needed by the runtime.

Memory and IndexedDB backends implement the same contract.

## 6. Explicit ownership

- D.0 owns measurement contract meaning.
- D.1 owns observation lifecycle and persistence.
- D.2 will own perceptual presentation.
- Sound Field owns the existing audio/session interface until an explicit integration phase.

Do not import Sound Field state objects into D.1.

## 7. Bounded exploratory payloads

Open observation is not unlimited storage.

Reject oversize markers/events with `PAYLOAD_LIMIT_EXCEEDED`.

No silent truncation.

## 8. Tests should attack invariants, not implementation details

Prefer:
- "second tab cannot overwrite revision"
over:
- "private method `_writeRevision()` was called twice".

Prefer:
- "replay recreates exact projection"
over:
- snapshot-testing arbitrary object layout.

## 9. Recovery is normal control flow

Browser restart is expected.

Recovery code must be deterministic, tested and idempotent.

Running recovery twice must not duplicate a Behavioral Record.

## 10. No premature abstraction

Do not introduce:
- plugin system;
- generic event bus;
- dependency-injection framework;
- ORM;
- Redux-like global store;
- worker architecture;

unless a concrete D.1 invariant requires it.

The architecture is already rich. The code should remain boring where it can.
