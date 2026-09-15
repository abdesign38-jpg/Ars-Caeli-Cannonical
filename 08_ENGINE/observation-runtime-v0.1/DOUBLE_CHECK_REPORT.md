# Double-check Report — AEON Phase D.1 Observation Runtime Foundation v0.1

## Baseline

Designed against immutable D.0 closure:

`b8b1a4eea2e9e5fc8e254b20340c8b3a66d367a2`

## Package-level verification completed

- 5 D.1 Draft 2020-12 schemas parse and self-validate.
- 5 canonical D.1 `$id` values are unique.
- 3 D.1 examples validate in an isolated repository simulation with the pinned D.0 schema dependencies.
- the normal Session Export validates including:
  - embedded D.0 Response Series;
  - Behavioral Record;
  - Participant Observation;
  - Runtime Events;
  - Artifact Snapshots.
- artifact snapshot hashes match their documents in the example.
- export component hashes match the example manifest.
- abort-before-onset event sequence is schema-valid.
- reference Python validator parses successfully.
- package contains no `__pycache__` or `.pyc`.

## Architectural review findings

### Strong boundary

D.1 does not need a renderer to be useful.

It can mature:
- state;
- capture;
- storage;
- replay;
- recovery;
- artifact provenance;
- export;
- subjective observations.

D.2 can later attach to the onset boundary.

### Deliberate exploratory aperture

The open Context Marker channel is retained.

This is not a loophole in the evidence model because markers:
- have explicit source;
- are timestamped;
- are journal-only;
- have no interpretation at capture.

This lets AEON preserve anomalies without converting them into conclusions.

### Journal source of truth

This is the most consequential D.1 choice.

A cached Response Series can be rebuilt.
A Browser reload can be represented.
A response captured immediately before a crash can be reconstructed.
Retries remain visible.

### Browser persistence

IndexedDB is preferred over an unload-time file save.

D.1 should persist each logical command transactionally and recover on startup.

### Timing

The design separates:
- monotonic runtime intervals;
- wall-clock chronology;
- runtime epoch identity.

This avoids treating a browser reload as continuous high-resolution time.

## Explicitly not claimed by this package

The architecture package does not claim:
- D.1 has been implemented;
- IndexedDB behavior has been demonstrated in the real browser;
- browser timing equals neural/perceptual latency;
- PG01's regularity parameter has psychophysical validity;
- markers have causal or symbolic meaning;
- D.1 is closed.

Those claims require implementation evidence.

## Implementation recommendation

Implement D.1 in the ordered slices in the Implementation Spec.

Do not begin D.2 renderer work merely because the presentation port already exists.

The port is the seam that allows D.2 to remain independent.
