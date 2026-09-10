# AEON · Phase B.1 — Contract Integrity

Use this handoff in GitHub Coder.

## Objective

Make it impossible for the future AEON sound engine to execute a source JSON file directly.

Required pipeline:

```text
SOURCE JSON
  ↓
JSON Schema validation
  ↓
Semantic invariant validation
  ↓
Reference resolution
  ↓
Deterministic compiler
  ↓
EXECUTABLE ARTIFACT
  ↓
AEON runtime
```

If any stage fails, there is no executable artifact.

The browser-based Sound Field must eventually load only generated files under `compiled/`, never raw files under `examples/`.

## Scope

This phase does **not** implement the Void audio gate yet.

It adds:
- `EXPERIMENT_PROTOCOL` schema;
- semantic validators;
- single-source-of-truth protocol references;
- deterministic executable compiler;
- strict adapter boundary;
- mandatory response-series IDs;
- automated tests;
- CI integrity gate;
- compiled runtime contracts.

## Preserve

Do not change:
- current Sound Field audio graph;
- current UI;
- current phase logic;
- Ars Caeli source definitions;
- wound/crystallization symbolic meanings.

## Critical rule

`derived_schedule_metrics` are assertions to verify, not values the engine may trust.

The compiler recomputes runtime metrics from primitive schedule values. If source values disagree, compilation fails.
