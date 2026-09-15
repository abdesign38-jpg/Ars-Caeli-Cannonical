# AEON Phase D.1 — Observation Runtime Foundation v0.1

**Baseline:** D.0 closure commit `b8b1a4eea2e9e5fc8e254b20340c8b3a66d367a2`

This package is the architecture and implementation handoff for the next AEON phase.

D.1 turns the D.0 measurement contracts into a browser-native observation runtime.

## Core proposition

```text
Journal = what happened
Response Series = validated projection of what happened
Artifact Snapshots = what definitions were actually used
Context Markers = what happened that we did not know to ask for
```

The runtime is deliberately strict about identity, timing and persistence but deliberately permissive about capturing unexpected context.

That combination is intentional.

## Read order

1. `IMPLEMENTATION_SPEC_PHASE_D1_OBSERVATION_RUNTIME_v0.1.md`
2. `docs/CODE_HEALTH_GUARDRAILS.md`
3. `ARCHITECTURE_DECISIONS_D1_v0.1.md`
4. `docs/STATE_MACHINE.md`
5. `docs/PERSISTENCE_AND_RECOVERY.md`
6. `docs/OPEN_OBSERVATION_CHANNEL.md`
7. `docs/ERROR_MODEL.md`
8. `docs/SCIENTIFIC_BOUNDARIES.md`
9. `docs/TEST_PLAN.md`
10. `docs/CI_PLAN.md`
11. `QA_CHECKLIST_PHASE_D1_v0.1.md`
12. `reference/REFERENCE_API_SHAPE.md`
13. `contracts/*`
14. `examples/*`
15. `GITHUB_CODER_PROMPT_PHASE_D1_v0.1.txt`

## What makes D.1 different

D.1 is not only a response collector.

It is designed to:
- survive reloads;
- preserve retries and failures;
- detect concurrent-tab conflicts;
- replay a Session from its journal;
- preserve exact D.0 artifacts by hash;
- capture subjective reports;
- capture unexpected context without prematurely interpreting it;
- export a self-auditing session bundle.

## No phase leakage

D.1 does not render geometry.

The future D.2 renderer will connect through the presentation boundary.

D.1 does not score participants.

D.1 does not infer symbolic meaning.

It observes.
