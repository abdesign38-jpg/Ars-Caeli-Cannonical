# QA — AEON Phase B.1 Contract Integrity

## Structural
- [ ] Existing 7 schemas still pass Draft 2020-12 validation.
- [ ] New `experiment-protocol.schema.json` validates migrated Pilot 01.
- [ ] Executable schemas validate compiler outputs.
- [ ] `validator.py --examples` no longer skips the protocol.

## Single source of truth
- [ ] Pilot 01 contains `condition_refs`, not embedded conditions.
- [ ] Standalone stimulus condition files are canonical.
- [ ] Duplicate condition IDs fail resolution.
- [ ] Missing condition IDs fail resolution.

## Void semantics
- [ ] LOW recomputes 0.20 silence, 6 events/min, 2000 ms gap.
- [ ] MEDIUM recomputes 0.50 silence, 6 events/min, 5000 ms gap.
- [ ] HIGH recomputes 0.80 silence, 6 events/min, 8000 ms gap.
- [ ] 60 s / 10 s = 6 whole cycles for all three.
- [ ] Changing stored ratio without changing schedule fails.
- [ ] Changing active+silent so sum != cycle fails.
- [ ] Changing stored event rate fails.
- [ ] `seeded_irregular` is descriptive but not executable in v0.1.
- [ ] `explicit_events` is descriptive but not executable in v0.1.

## Condition integrity
- [ ] held carrier source/hz match signal.
- [ ] held modulation mode/hz match signal.
- [ ] held cycle/event rate/predictability/gap CV match recomputed values.
- [ ] manipulated silence ratio matches recomputed ratio.
- [ ] exposure equals Void block duration.
- [ ] wound/crystallization references resolve uniquely.

## Protocol integrity
- [ ] `condition_refs == design.sequence`.
- [ ] positions are 1..5.
- [ ] one common sequence_id.
- [ ] primary outcome matches probe primary outcome.
- [ ] primary outcome exists among probe items.
- [ ] every condition signal equals Pilot 01 controlled signal.
- [ ] every block exposure equals protocol block duration.

## Compiler
- [ ] raw derived metrics are never runtime authority.
- [ ] compiler output includes source SHA-256.
- [ ] compiler writes only after all validators pass.
- [ ] unchanged sources compile byte-identically twice.
- [ ] stale committed compiled artifact makes `compiler.py --check` fail.
- [ ] corrupt source creates no executable artifact.

## Adapters / IDs
- [ ] `loadStimulusCondition()` cannot return a semantically invalid executable condition.
- [ ] executable loader reads only `compiled/`.
- [ ] `createResponseSeries()` requires explicit `series_id`.
- [ ] no runtime `SERIES-TEMPLATE` fallback remains.

## CI
- [ ] workflow runs on changes to protocol-model path.
- [ ] positive tests pass.
- [ ] every required negative test fails for the expected code.
- [ ] CI fails when compiled output is stale.

## Phase C gate
- [ ] No Sound Field audio/UI changes in B.1.
- [ ] Only after every item above passes may Void Gate work begin.
