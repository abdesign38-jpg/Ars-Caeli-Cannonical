# Detailed Architecture Review — AEON Phase D.1 Observation Runtime · REVIEWED v2

## Verdict

The D.1 architecture is fundamentally well aligned with AEON's current core and APL, but the first v0.1 handoff had several implementation-level risks that were worth fixing before Coder.

REVIEWED v2 resolves the blockers identified in this audit.

## Alignment with AEON core

### Strong alignment

APL requires:
- traceable entities;
- observation without automatic interpretation;
- separation of observed data, interpretation, hypothesis and symbolic model;
- traceability across experiment, observation and knowledge.

D.1's Journal / Response Series / Context Marker separation supports those requirements directly.

The D.0 protocol model already establishes:
- symbolic source != experimental operationalization != measured evidence;
- participant_reported != behavioral_measured != derived_metric;
- neutral probes;
- validated measurement graph.

D.1 consumes those rules instead of redefining them.

### Healthy module boundary

`08_ENGINE/observation-runtime-v0.1/` as a sibling of:
- `experimental-protocol-model/v0.1/`;
- `sound-field-v0.3/`;

is the correct placement.

It avoids turning Sound Field into the owner of experimental persistence and avoids turning D.0 contracts into a browser runtime.

## Findings corrected before implementation

### BLOCKER 1 — cross-language canonicalization

Original v0.1 proposed `aeon.sorted-json.v0.1`.

That is safe enough inside the current JS-only Sound Field fingerprint path, but D.1 verifies hashes in both JS and Python.

Sorted keys alone do not fully define cross-language primitive-number serialization.

REVIEWED v2:
- adopts RFC 8785/JCS;
- pins `canonicalize@5.0.0`;
- pins Python `rfc8785==0.1.4`;
- adds shared golden vectors;
- changes export manifest canonicalization to `RFC8785-JCS`.

### BLOCKER 2 — async work inside IndexedDB transactions

The first handoff did not explicitly prohibit WebCrypto/schema/network awaits after opening a transaction.

IndexedDB transaction lifetime is event-loop sensitive.

REVIEWED v2 explicitly requires:
- artifact resolution, validation, canonicalization and hashing BEFORE transaction open;
- transaction body limited to IDB requests + synchronous request bookkeeping.

### IMPORTANT 3 — persistence durability

IndexedDB storage is best-effort by default.

REVIEWED v2:
- checks `navigator.storage.persisted()`;
- requests `navigator.storage.persist()` when available;
- records persistent/best_effort/unavailable status;
- uses storage estimate as observable runtime context;
- requests strict transaction durability where supported, with explicit fallback.

### IMPORTANT 4 — exploratory payload bounds

An open marker channel with completely unbounded payloads can damage storage/export health.

REVIEWED v2 adds:
- marker label/note schema bounds;
- runtime canonical-byte limits;
- explicit `PAYLOAD_LIMIT_EXCEEDED`;
- no silent truncation.

### IMPORTANT 5 — source-of-truth guardrails

The design already had Journal as truth, but multiple specs could drift.

REVIEWED v2 explicitly establishes:
- Journal replay as projection authority;
- D.0 schemas/semantic validator as measurement authority;
- D.1 JS guards as compatibility guards only;
- one canonical hashing path;
- one functional state-machine table in implementation.

## Architecture judged healthy

### Journal first
Good fit for browser crash/recovery and AEON traceability.

### Response Series as materialized projection
Prevents storage/UI state from becoming epistemic truth.

### Explicit runtime epochs
Correct separation of reload boundaries from monotonic timing.

### Artifact snapshots
Strong reproducibility boundary.

### IndexedDB
Appropriate browser persistence layer.

### Optimistic revision
Appropriate minimal concurrency guard for multiple tabs.

### Context Marker
Good exploratory aperture as long as it remains journal-only at capture.

### MemoryStore + IndexedDBStore
Good testing seam if the interface remains small.

## What not to add

REVIEWED v2 explicitly warns against premature:
- event-bus framework;
- ORM;
- Redux/global store;
- plugin framework;
- worker topology;
- generic dependency-injection framework.

D.1 already has enough architecture.

## Remaining integration risks to test, not redesign

1. Browser-specific IndexedDB behavior cannot be proven by fake-indexeddb alone.
2. Storage persistence may be denied.
3. Timing integrity can degrade during sleep/background behavior.
4. JS compatibility guards can drift from D.0 unless mutation-corpus CI remains mandatory.
5. D.2 presentation integration must call the onset boundary exactly once.

These are implementation/verification risks, not architecture defects.

## Recommendation

Use REVIEWED v2 as the implementation handoff.

Do not send the original v0.1 package to Coder.

Do not modify D.0 or Sound Field to make D.1 easier; consume them through explicit adapters.
