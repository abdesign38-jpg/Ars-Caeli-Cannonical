# Implementation Specification — AEON Phase B.1 Contract Integrity

## Repository target
Work under `08_ENGINE/experimental-protocol-model/v0.1/`.

Do not touch `08_ENGINE/sound-field-v0.3/` in this commit except optional documentation saying runtime integration is pending.

## Core rule
No source JSON may feed AEON execution directly.

Required path:
`source -> schema validate -> semantic validate -> resolve refs -> compile -> executable artifact -> runtime`.

If any stage fails, compilation fails.

## 1. Add source/runtime schemas
Add:
- `contracts/experiment-protocol.schema.json`
- `contracts/executable-stimulus.schema.json`
- `contracts/executable-protocol.schema.json`

`EXPERIMENT_PROTOCOL` is author-edited source.
The two executable schemas describe compiler output and are generated artifacts.

## 2. Remove Pilot 01 dual source of truth
Current Pilot 01 embeds full condition objects while the same conditions exist as standalone `*.stimulus-condition.json`.

Replace embedded `conditions` with:

```json
"condition_refs": [
  "C1_LOW_ASC",
  "C2_MED_ASC",
  "C3_HIGH",
  "C4_MED_DESC",
  "C5_LOW_DESC"
]
```

Keep `design.sequence` and require it to equal `condition_refs`.

Standalone condition files become canonical. Do not support both representations.

## 3. Semantic validation
Keep current Draft 2020-12 structural validator and add `semantic_validator.py`.

Stable error shape:

```json
{
  "code":"VOID_CYCLE_MISMATCH",
  "path":"void_profile.schedule",
  "message":"active_duration_s + silent_duration_s must equal cycle_duration_s",
  "expected":10,
  "actual":12,
  "severity":"error"
}
```

No executable object is returned if an error exists.

## 4. Void execution invariants
For executable v0.1 support only `fixed_periodic`.

Reject `seeded_irregular` and `explicit_events` for execution until those semantics exist.

For `fixed_periodic` enforce within numeric tolerance:

```text
active_duration_s + silent_duration_s == cycle_duration_s
silence_ratio == silent_duration_s / cycle_duration_s
event_rate_per_min == 60 / cycle_duration_s
mean_gap_ms == silent_duration_s * 1000
gap_cv == 0
temporal_predictability == 1
seed == null
explicit_events == []
```

For Pilot 01 additionally require:

```text
block_duration_s / cycle_duration_s is an integer
block_duration_s == condition.timing.exposure_s
```

The compiler recomputes runtime metrics from schedule primitives.

## 5. Condition invariants
When keys exist in `held_constant`, verify them against actual nested values:

```text
held_constant.cycle_duration_s == void_profile.schedule.cycle_duration_s
held_constant.event_rate_per_min == recomputed event_rate_per_min
held_constant.temporal_predictability == recomputed temporal_predictability
held_constant.gap_cv == recomputed gap_cv
held_constant.carrier_source == signal.carrier.source
held_constant.carrier_hz == signal.carrier.hz
held_constant.modulation_mode == signal.modulation.mode
held_constant.modulation_hz == signal.modulation.hz
held_constant.harmonic_b_rule == signal.harmonic_b_rule
```

If manipulated variable `void.temporal_occupancy.silence_ratio` is present, it must equal recomputed silence ratio.

Require:
`timing.exposure_s == void_profile.schedule.block_duration_s`.

Resolve wound and crystallization IDs uniquely. Missing/duplicate references are hard errors.

## 6. Protocol invariants
Validate `EXPERIMENT_PROTOCOL`, then resolve all `condition_refs`.

Require:
- every condition ref resolves exactly once;
- no duplicate refs;
- `design.sequence == condition_refs`;
- condition `order_control.position` equals 1-based sequence position;
- all conditions share one `order_control.sequence_id`;
- every condition passes executable semantic validation;
- `probe_set_ref` resolves uniquely;
- `primary_outcome.id == probe_set.primary_outcome`;
- primary outcome exists among probe items;
- `design.block_duration_s == each condition.timing.exposure_s`;
- for Pilot 01, `controlled_signal == each condition.signal`.

If future protocols intentionally manipulate signal, add an explicit new policy rather than silently bypassing this invariant.

## 7. Deterministic compiler
Add `compiler.py`.

Generate:

```text
compiled/
  conditions/
    C1_LOW_ASC.executable.json
    ...
  protocols/
    pilot.void_x_response_crystallization.invisibilidad.v0_1.executable.json
```

Each compiled condition contains:
- `execution_status: validated`
- compiler version
- condition ID
- source SHA-256
- exact signal identity
- recomputed `runtime_schedule`
- experimental context
- hypothesis refs
- blinding boundary
- measurement boundary
- integrity flags

Never copy source `derived_schedule_metrics` as runtime authority.

## 8. Runtime authority
Future Void Gate consumes only:
`compiled_condition.runtime_schedule`.

Never consume:
`source_condition.void_profile.derived_schedule_metrics`.

## 9. Adapter boundary
Refactor adapters so:
- raw loaders are private (`_load_raw_*`);
- `loadStimulusCondition(id)` performs schema + semantic validation;
- add `loadExecutableStimulusCondition(id)` for compiler output;
- add `loadExperimentProtocol(id)` and `loadExecutableProtocol(id)`.

Future browser engine does not call Python. Python protects authoring/CI/compiler paths.

## 10. Static GitHub Pages boundary
Because GitHub Pages cannot execute Python:
- CI/build compiles source JSON into static validated runtime artifacts;
- Phase C browser code fetches only `compiled/...executable.json`;
- runtime rejects any artifact without `execution_status === "validated"`;
- raw `examples/*.json` are never runtime audio inputs.

## 11. Response-series identity
Change `createResponseSeries()`.

Require:
- `series_id`
- `session_id`
- `participant_id`
- `protocol_id`
- `started_at`

Remove runtime fallback `SERIES-TEMPLATE`.

## 12. Determinism
Canonicalize source JSON for hashing:
- UTF-8
- sorted keys
- compact separators
- no volatile timestamp in hashed content

Two compilations of unchanged source must produce identical bytes.

## 13. CI
Add `.github/workflows/aeon-contract-integrity.yml`.

CI must:
1. install dev deps;
2. validate schemas/examples;
3. run semantic negative/positive tests;
4. compile all executable artifacts to a temp dir;
5. compare them byte-for-byte with committed `compiled/`;
6. fail on stale/mismatched generated files.

## 14. No auto-correction
Compiler must never silently repair:
- bad silence ratio;
- bad cycle duration;
- wrong held constant;
- missing references;
- sequence mismatch;
- signal mismatch.

Fail with structured error.

## 15. Required error codes
- `SCHEMA_INVALID`
- `UNSUPPORTED_EXECUTION_PATTERN`
- `VOID_CYCLE_MISMATCH`
- `VOID_BLOCK_NOT_WHOLE_CYCLES`
- `VOID_SILENCE_RATIO_MISMATCH`
- `VOID_EVENT_RATE_MISMATCH`
- `VOID_MEAN_GAP_MISMATCH`
- `VOID_GAP_CV_MISMATCH`
- `VOID_PREDICTABILITY_MISMATCH`
- `VOID_SEED_INVALID`
- `VOID_EXPLICIT_EVENTS_INVALID`
- `CONDITION_EXPOSURE_MISMATCH`
- `CONDITION_MANIPULATION_MISMATCH`
- `CONDITION_HELD_CONSTANT_MISMATCH`
- `REFERENCE_NOT_FOUND`
- `REFERENCE_DUPLICATE`
- `PROTOCOL_SEQUENCE_MISMATCH`
- `PROTOCOL_ORDER_POSITION_MISMATCH`
- `PROTOCOL_SEQUENCE_ID_MISMATCH`
- `PROTOCOL_SIGNAL_MISMATCH`
- `PROTOCOL_PRIMARY_OUTCOME_MISMATCH`
- `RESPONSE_SERIES_ID_REQUIRED`

## 16. Gate before Phase C
Do not implement the Void Gate until:
- all source examples pass structural validation;
- all executable conditions pass semantic validation;
- Pilot 01 itself validates;
- all references resolve uniquely;
- compiled artifacts are deterministic;
- negative tests fail for the intended reason;
- CI blocks stale compiled output.

## Suggested commit

```text
feat(aeon): add semantic contract compiler and execution integrity gate

- add experiment protocol and executable schemas
- enforce Void schedule invariants
- resolve protocol references from canonical condition files
- compile deterministic runtime artifacts
- block direct/raw condition execution
- require unique response-series identities
- add negative semantic tests and CI drift check
```
