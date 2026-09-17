# AEON Engine Audit v0.1

## Scope and guardrail

This document is an inspection-only audit of the current AEON generation engine baseline as it exists on the latest `main` branch. No production files were modified, renamed, refactored, or rewritten.

## Repository baseline at audit time

- HEAD SHA: `31a12051ead342655c5975b961d670f4df85f436`
- Branch: `main`
- Git status: clean
- Worktree clean: yes
- Repository file count: 1013
- `08_ENGINE` file count: 182
- Validation note: all relevant repo-level checks were run from their intended project roots without modifying production code

## Executive summary

The repository currently contains three distinct engine surfaces with different responsibilities and different trust boundaries:

1. `08_ENGINE/experimental-protocol-model/v0.1` is the validation and contract layer for the current AEON protocol model. It defines deterministic temporal void conditions, protocol examples, and schema validation logic without acting as the browser execution engine.
2. `08_ENGINE/sound-field-v0.3` is the browser-facing session UI and experimental runtime. It loads compiled protocol artifacts, enforces locked runtime policy, visualizes the session field, and exposes an operational audio/telemetry layer that remains explicitly experimental and non-canonical.
3. `08_ENGINE/observation-runtime-v0.1` is the D.1 observation journal/runtime layer. It treats sessions as event-sourced state machines, stores canonicalized event journals, creates response-series projections, validates artifact snapshots, verifies export bundles, and exposes a focused runtime API.

These surfaces are deliberately separated. The current architecture does not collapse symbolic authorship, browser execution, and observation persistence into a single runtime. That split is consistent with the repository’s own epistemic boundaries and is the clearest baseline to audit against.

## Engine inventory

### 1) Experimental protocol model

- Path: `08_ENGINE/experimental-protocol-model/v0.1`
- Role: Contract-first protocol specification and validation layer for Pilot 01.
- Runtime status: Active validation layer; not the primary browser execution engine.
- Inputs: JSON contracts, example stimulus conditions, protocol examples, compiled condition/protocol artifacts.
- Outputs: Schema validation reports, compiled executable protocol data, validation status.
- Dependencies: JSON schemas, example files, measurement adapters, validator logic.
- Consumers: Sound Field runtime, future experiment tooling, CI validation jobs.
- Generation relevance: High. This is the canonical operational specification for the current pilot and the boundary of what is considered valid experimental protocol behavior.
- Control type: Validation / deterministic protocol specification
- Evidence: OBSERVED IN CODE
- Notes: The README states that D.0 is validation-only infrastructure and explicitly separates symbolic source models from experimental operationalization. The compiled protocol and condition artifacts are treated as the authority behind the browser runtime.

### 2) Compiled protocol artifacts

- Path: `08_ENGINE/experimental-protocol-model/v0.1/compiled`
- Role: Executable Pilot 01 condition and protocol data consumed by the browser runtime.
- Runtime status: Active data source for runtime verification.
- Inputs: Protocol and condition JSON artifacts.
- Outputs: Fingerprinted, validated conditions and protocol metadata used by `protocol-runtime.js`.
- Dependencies: Runtime policy definitions and condition sequence contracts.
- Consumers: `08_ENGINE/sound-field-v0.3/protocol-runtime.js` and its tests.
- Generation relevance: High. These artifacts define the current controlled experimental delivery semantics.
- Control type: Artifact validation / deterministic execution contract
- Evidence: OBSERVED IN CODE
- Notes: `protocol-runtime.js` verifies executable state, checks protocol runtime policy, fingerprints conditions, and rejects mismatches.

### 3) Sound Field browser runtime

- Path: `08_ENGINE/sound-field-v0.3/app.js`
- Role: Primary browser UI and execution surface for the session experience.
- Runtime status: Active experimental browser runtime; not canonical doctrine.
- Inputs: `mappings.json`, compiled protocol artifacts from the experimental model, user session state, UI controls.
- Outputs: Audio rendering, timing state, field visualization, local session storage, ATLAS export metadata.
- Dependencies: `index.html`, `styles.css`, `protocol-runtime.js`, `mappings.json`, browser Web Audio API.
- Consumers: End-user session interactions; browser smoke/test harness; ATLAS export functions.
- Generation relevance: High for user-facing experimental orchestration, but not the formal source of truth for the canonical model.
- Control type: Browser execution / UI / session orchestration
- Evidence: OBSERVED IN CODE
- Notes: `module.manifest.json` explicitly labels this runtime as experimental and states that the protocol runtime authority is the compiled AEON Pilot 01 artifacts. The app enforces locked runtime policy if in protocol mode and records telemetry failures without treating them as fatal to the stimulus itself.

### 4) Sound Field protocol abstraction

- Path: `08_ENGINE/sound-field-v0.3/protocol-runtime.js`
- Role: Runtime validator and execution helper for compiled protocol artifacts.
- Runtime status: Active and tested.
- Inputs: Compiled protocol JSON and condition JSON.
- Outputs: State gating, schedule checks, integrity decisions, telemetry classification, deterministic gate scheduling.
- Dependencies: `window.crypto.subtle`, canonical JSON handling, compiled artifacts.
- Consumers: `app.js` when arming a protocol, tests under `sound-field-v0.3/tests`.
- Generation relevance: Medium-high. This is the runtime layer that turns artifact contracts into browser-enforced operating semantics.
- Control type: Execution gate / integrity guard
- Evidence: OBSERVED IN CODE
- Notes: The file explicitly implements integrity dispositions such as `ABORT_CONDITION` for stimulus integrity and `CONTINUE_STIMULUS` for telemetry integrity. It also enforces a strict runtime policy mismatch fail-closed behavior.

### 5) Sound Field configuration and symbolic mapping

- Path: `08_ENGINE/sound-field-v0.3/mappings.json`
- Role: Symbolic and operational mapping definitions for fields, signal layers, dimensions, and phase parameters.
- Runtime status: Active configuration source.
- Inputs: Field dimension names and values, symbolic frequency lists, phase and signal metadata.
- Outputs: UI state mapping and runtime signal definitions.
- Dependencies: UI and browser runtime values.
- Consumers: `app.js`, rendering, signal plan updates.
- Generation relevance: Medium. This is an operational translation layer, not canonical physics or doctrine.
- Control type: Configuration mapping
- Evidence: OBSERVED IN CODE
- Notes: The manifest clearly labels time, entropy, and symbolic mappings as experimental non-canonical, which matches the repository boundary discipline.

### 6) Observation runtime core

- Path: `08_ENGINE/observation-runtime-v0.1/src/observation-runtime.mjs`
- Role: Canonical D.1 session runtime facade and state machine entrypoint.
- Runtime status: Active and validated.
- Inputs: session metadata, trial/probe/stimulus references, clock, artifact provider, storage backend.
- Outputs: session lifecycle transitions, journal events, projection updates, export bundles, recovery actions.
- Dependencies: memory/indexeddb storage, state-machine logic, recovery logic, artifact provider, exporter, canonical JSON helpers, response series projector.
- Consumers: runtime callers, tests, future integration layers.
- Generation relevance: High. This is the only explicit journal-driven engine in the repo that tracks session transitions and records behavioral evidence with implementation-level rigor.
- Control type: State-transition runtime / event-sourced session engine
- Evidence: OBSERVED IN CODE
- Notes: The facade exposes `createSession`, `startSession`, `armTrial`, `markStimulusOnset`, `captureChoice`, `commitResolvedAttempt`, `finalizeSession`, `abortSession`, `exportSession`, `resumeSession`, and integrity flagging.

### 7) Observation runtime state machine and recovery

- Path: `08_ENGINE/observation-runtime-v0.1/src/state-machine.mjs`, `recovery.mjs`
- Role: Defines normative transitions and recoverable session states.
- Runtime status: Active and tested.
- Inputs: session state and command events.
- Outputs: Validated transitions, recoverable states, replayed state restoration.
- Dependencies: runtime event journal and projection state.
- Consumers: `observation-runtime.mjs`, tests for recovery and state transitions.
- Generation relevance: High. This is the core guardrail that prevents invalid transitions and rehydrates incomplete session states.
- Control type: State validation / recovery
- Evidence: OBSERVED IN CODE
- Notes: Recovery logic distinguishes ARMED, OBSERVING, and RESOLVED states and preserves evidence without inventing missing onset or reaction time values.

### 8) Observation runtime storage and export

- Path: `08_ENGINE/observation-runtime-v0.1/src/storage/*`, `src/export/session-export.mjs`
- Role: Persist journal, projection, and artifact snapshots; export and verify full session bundles.
- Runtime status: Active and tested.
- Inputs: session data, events, artifact snapshots, hashes.
- Outputs: imported/verified bundle, signed replay verification, export integrity metadata.
- Dependencies: canonical JSON hashing, memory or IndexedDB stores, journal event structure.
- Consumers: runtime export API, session verification, browser and Node-level tests.
- Generation relevance: High. This is the near-actual evidence custody layer for generated observations.
- Control type: Persistence / verification / bundle integrity
- Evidence: OBSERVED IN CODE
- Notes: The export verification logic explicitly separates hash mismatch and replay mismatch cases by design.

### 9) Browser adapters and harness

- Path: `08_ENGINE/observation-runtime-v0.1/src/adapters/*`, `08_ENGINE/observation-runtime-v0.1/harness/*`
- Role: Captures valid input events and provides a browser harness for runtime proofs.
- Runtime status: Active but intentionally non-production.
- Inputs: keyboard, pointer, touch events, browser environment.
- Outputs: first-valid response, event capture, session proof harness behavior.
- Dependencies: browser DOM APIs and runtime event contracts.
- Consumers: browser-based integration tests and local proof harnesses.
- Generation relevance: Medium. These are important for runtime validation in the browser but they do not define the experiment itself.
- Control type: Input capture / local proof harness
- Evidence: OBSERVED IN CODE
- Notes: The README and harness documentation explicitly label the browser harness as a development proof shell rather than a production UI.

### 10) ATLAS memory layer

- Path: `09_ATLAS/README.md`, `09_ATLAS/schemas/*`
- Role: Memory and session archive layer for session records and observations.
- Runtime status: Active documentation and schema layer, not the runtime engine itself.
- Inputs: exported session bundles, ATLAS metadata, observational data.
- Outputs: archived memory records and JSON schemas.
- Dependencies: repo canonical documents, session schema, export metadata.
- Consumers: sound-field export and future corpus migration.
- Generation relevance: Medium. This is the repository-level memory structure that receives exported session records, without deciding causality.
- Control type: Memory archive / schema registry
- Evidence: OBSERVED IN CODE
- Notes: ATLAS explicitly states that it stores memory and does not determine causality.

## Validation baseline recorded during audit

### D.0 / protocol model validation

Command(s):

- `cd /workspaces/Ars-Caeli-Cannonical && python3 08_ENGINE/experimental-protocol-model/v0.1/validator.py --examples`
- `cd /workspaces/Ars-Caeli-Cannonical/08_ENGINE/experimental-protocol-model/v0.1 && PYTHONPATH=. python -m pytest -q tests`

Result:

- `validator.py --examples`: valid for all example protocol/condition files
- `pytest`: 56 passed in 30.46s

Evidence: OBSERVED IN CODE / OBSERVED IN TEST OUTPUT

### Sound Field protocol runtime validation

Command(s):

- `cd /workspaces/Ars-Caeli-Cannonical/08_ENGINE/sound-field-v0.3 && node --test tests/protocol-runtime.test.js`

Result:

- 16 passed, 0 failed

Evidence: OBSERVED IN TEST OUTPUT

### D.1 observation runtime validation

Command(s):

- `cd /workspaces/Ars-Caeli-Cannonical && npm ci --prefix 08_ENGINE/observation-runtime-v0.1 && npm test --prefix 08_ENGINE/observation-runtime-v0.1`

Result:

- 44 passed, 0 failed

Evidence: OBSERVED IN TEST OUTPUT

## What the current engine actually is

The current engine is best described as a layered experimental system rather than a single monolithic generation engine:

- the repository defines canonical concepts and symbolic boundaries,
- the experimental protocol model defines valid pilot behavior,
- the browser sound field executes and visualizes those conditions,
- the observation runtime records evidence in a journaled, recoverable, export-verifiable format,
- ATLAS provides the memory/archive boundary for recorded session material.

This is a disciplined separation of concerns, not a redesign of production architecture. The current baseline is therefore a working evidence pipeline with explicit non-canonical boundaries, not a fully unified generative engine.

## Gaps / follow-up questions

- There is no single entrypoint that renders the entire system as one engine object; the repository’s engine surfaces are distributed.
- Sound Field is active and experimental, but it does not appear to be the canonical source of meaning; it operationalizes compiled protocol artifacts within browser constraints.
- The observation runtime is the strictest evidence boundary, yet it remains observational rather than interpretive.
- The current architecture still needs a clear human-facing map of how protocol artifacts flow into browser execution and then into exported ATLAS memory.

## Conclusion

The current AEON generation engine baseline is valid, layered, and intentionally partitioned. The strongest operational core is the D.1 observation runtime; the strongest validation/specification layer is the D.0 protocol model; the strongest live UI is the Sound Field browser surface; and the strongest memory/archive layer is ATLAS. The repo is not missing a single hidden engine; it is organized as a collection of bounded engine surfaces with explicit epistemic roles.

Status: INSPECTION COMPLETE

---

Evidence code used in this document:

- OBSERVED IN CODE: direct repository evidence from source and manifest files
- OBSERVED IN TEST OUTPUT: direct validation evidence from executed tests
- INFERENCE: interpreted relationship or system role based on observed code and docs
- UNKNOWN: not directly verifiable from the current inspection baseline
- NEEDS FOLLOW-UP: item requires deeper inspection before strong conclusion
