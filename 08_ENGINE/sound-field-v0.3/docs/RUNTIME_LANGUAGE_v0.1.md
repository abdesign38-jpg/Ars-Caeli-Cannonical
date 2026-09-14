# AEON Runtime Language v0.1

Status: experimental operational vocabulary.

This vocabulary describes the protocol runtime and future observation layer. It does not replace the contract-level `epistemic_layer`. Runtime data roles map to existing epistemic layers.

## Runtime roles

- `scheduled_*`: declared by a validated compiled protocol; typically `experimental_operationalization`.
- `measured_digital_*`: observed downstream of the browser protocol gate; `engine_measured`, not SPL, physiology, or participant report.
- Participant observations retain stable canonical IDs such as `felt_presence` and carry `epistemic_layer: participant_reported`.
- `derived_*`: calculated values with documented inputs and `derived_metric` provenance.
- Interpretations use existing layers such as `hypothesis`, `source_symbolic`, or `source_documented`.

The separation law is:

```text
scheduled != measured_digital != participant_reported != derived_metric != hypothesis
```

## Integrity

`stimulus_integrity` describes whether the controlled stimulus remained valid: `PENDING`, `VALID`, or `INVALID`.

`telemetry_integrity` describes the browser-digital observation stream: `PENDING`, `VALID`, `PARTIAL`, `INCOMPLETE`, or `FAILED`. Telemetry failure does not automatically invalidate stimulus delivery.

`condition_status` is a persisted result such as `COMPLETED`, distinct from runtime states such as `CONDITION_RUNNING` or `PROBE_PENDING`.

## Time

- `condition_time_s`: AudioContext-derived schedule time; pause freezes it.
- `protocol_active_exposure_s`: compiled block duration for a successful fixed-duration condition.
- `protocol_pause_wall_s`: intentional pause wall time.
- `protocol_wall_duration_s`: active exposure plus intentional pauses.
- `attempt_lifecycle_wall_s`: software start-to-finalization diagnostic, never exposure duration.

ISO timestamps provide chronology; `performance.now()` differences provide monotonic durations.

## Gate and telemetry

`scheduled_state` is logical `ACTIVE` or `SILENT`. `gate_state` may be `ACTIVE`, `SILENT`, `RAMP`, or `PAUSED`. `boundary_guard` marks analyser samples too close to a gate transition for steady-state interpretation and does not alter stimulus timing.

`scheduled_silence_ratio` is the logical protocol authority. `measured_digital_silence_ratio` is independent browser-digital telemetry.

## Void and crystallization

Free Field Void is the legacy delay/temporal-spacing mapping. Protocol Temporal Void is the deterministic post-master occupancy gate. They are not equivalent.

Source symbolic crystallization and response crystallization are separate constructs. A response metric does not prove the symbolic construct.

## Measurement boundary

Use the phrase `browser-digital output downstream of the protocol gate`. Do not describe it as sound level at the ear, physiology, or causal participant response.
