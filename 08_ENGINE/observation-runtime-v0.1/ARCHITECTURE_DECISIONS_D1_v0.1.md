# Architecture Decisions — AEON Phase D.1 Observation Runtime Foundation

## ADR-D1-01 · Journal first, projection second

The append-only Journal is the runtime source of truth.

`RESPONSE_SERIES v0.2` is a deterministic projection of committed journal events.

Why:
- crash recovery;
- auditability;
- retries without erasure;
- unexpected-event preservation;
- reconstruction of state after browser restart.

The projection may be cached, but it must always be reproducible from the Journal.

## ADR-D1-02 · Rich capture does not imply rich claims

D.1 intentionally accepts context markers that were not anticipated by the experiment.

They are stored as journal-only markers with source, timing and context.

They are not silently upgraded into:
- a behavioral record;
- participant observation;
- derived metric;
- symbolic claim.

This is not suppression of exploration. It is preservation of raw ambiguity.

## ADR-D1-03 · Browser clock and wall clock have different jobs

`performance.now()`:
- within-attempt timing;
- RT;
- event ordering inside a runtime epoch.

RFC3339 wall time:
- chronology;
- export;
- human inspection.

`Date.now()` is not used for reaction time.

Every runtime load receives a new `runtime_epoch_id` and stores `performance.timeOrigin`.

## ADR-D1-04 · A reload is a measurable event

A browser reload or runtime restart is not hidden.

If an attempt is active, D.1 records recovery and either:
- reconstructs a resolved attempt; or
- creates an explicit aborted record.

No timing interval crosses a runtime epoch boundary.

## ADR-D1-05 · D.0 artifacts are snapshotted at use time

Probe, Trial and Stimulus definitions are resolved, validated, canonicalized, hashed and preserved by content hash when a Trial is armed.

This protects reproducibility if repository definitions later change.

## ADR-D1-06 · No scoring in raw behavior

Behavioral Record captures:
- response status;
- choice;
- timing;
- provenance;
- integrity.

Correctness, accuracy, threshold, PSE or symbolic interpretation remain derived work.

## ADR-D1-07 · IndexedDB is the durable browser store

D.1 uses IndexedDB because the runtime is browser-native and requires transactional persistence across reloads.

All logical state changes occur in transactions.

Primary persistence never depends on unload/page-close hooks.

## ADR-D1-08 · Optimistic revision prevents silent multi-tab overwrite

Session State contains a revision.

Every write command provides the revision it observed.

The current revision is checked inside the storage transaction.

Mismatch raises `SESSION_CONFLICT`.

## ADR-D1-09 · Artifact hashes use RFC 8785/JCS

D.1 verifies hashes in both JavaScript and Python.

A simple "sort object keys then stringify" convention is not sufficiently explicit across languages because primitive number serialization can diverge (`1` vs `1.0`, exponent forms, negative zero).

Therefore D.1 uses RFC 8785 JSON Canonicalization Scheme (JCS) before SHA-256.

JavaScript and Python each use a pinned RFC-8785 implementation plus shared golden vectors.

SHA-256 manifest hashes detect changes to exported components.

They do not authenticate authorship and are not a security signature scheme.

## ADR-D1-10 · Development harness is allowed; participant UI is not D.1

A browser harness may expose runtime state and buttons for testing.

It must be visibly labeled as development tooling.

The participant-facing perceptual experience belongs to D.2 / later integration.

## ADR-D1-11 · D.1 can capture participant reports as well as behavior

The existing Response Series already has a stable `participant_reported` stream.

D.1 therefore supports explicit Participant Observation commits in addition to behavioral records.

This makes D.1 an actual observation layer rather than a reaction-time-only recorder.

## ADR-D1-12 · The unexpected gets a door, not a throne

The context-marker channel permits:
- environmental surprises;
- technical anomalies;
- spontaneous phenomenological reports;
- procedural deviations.

It is deliberately flexible.

But `projection_policy=journal_only` prevents an unexpected note from becoming a scientific conclusion merely because it was captured.

## ADR-D1-13 · D.1 remains future-compatible with D.2

D.1 exposes presentation onset as a port/event.

D.2 will later supply the renderer and call that boundary.

This allows D.1 timing, persistence and recovery to mature independently of the visual grammar.

## ADR-D1-14 · One justified production dependency

Most of the runtime uses browser standards.

D.1 permits exactly one production dependency in v0.1:

```text
canonicalize@5.0.0
```

for RFC 8785/JCS canonicalization.

Reimplementing cryptographic canonicalization by hand would be a worse code-health tradeoff than one pinned, zero-transitive-dependency package.

`fake-indexeddb@6.2.5` remains dev-only.

Python CI pins `rfc8785==0.1.4`.

## ADR-D1-15 · IndexedDB transaction callbacks stay storage-only

Hashing, validation and other asynchronous work are completed before opening a readwrite transaction.

Inside an active IndexedDB transaction the implementation performs only IndexedDB requests and synchronous bookkeeping required to enqueue those requests.

This avoids accidental `TransactionInactiveError` / auto-commit behavior caused by awaiting unrelated promises.

## ADR-D1-16 · Persistence capability is observable

Browser storage is best-effort by default.

At Session creation D.1 checks/request persistent storage when the API is available and records the resulting capability.

Failure to obtain persistent storage does not fabricate a measurement failure, but it remains visible as runtime context.
