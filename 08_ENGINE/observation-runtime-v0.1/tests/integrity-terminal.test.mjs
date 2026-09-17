import test from "node:test";
import assert from "node:assert/strict";

import { ObservationRuntime } from "../src/observation-runtime.mjs";
import { createArtifactProvider } from "../src/artifact-provider.mjs";
import { MemoryStore } from "../src/storage/memory-store.mjs";

const UUIDS = [
  "70000000-0000-4000-8000-000000000001",
  "70000000-0000-4000-8000-000000000002",
  "70000000-0000-4000-8000-000000000003",
  "70000000-0000-4000-8000-000000000004",
  "70000000-0000-4000-8000-000000000005",
  "70000000-0000-4000-8000-000000000006",
  "70000000-0000-4000-8000-000000000007",
  "70000000-0000-4000-8000-000000000008",
  "70000000-0000-4000-8000-000000000009",
  "70000000-0000-4000-8000-000000000010",
  "70000000-0000-4000-8000-000000000011",
  "70000000-0000-4000-8000-000000000012",
];

function makeRuntime(store) {
  const uuids = [...UUIDS];
  const provider = createArtifactProvider({
    loadProbe: async (id) => ({ schema_version: "0.2-draft", probe_id: id, evidence_role: "experimental_operationalization", choices: [{ choice_id: "left" }, { choice_id: "right" }] }),
    loadTrial: async (id) => ({ schema_version: "0.2-draft", trial_id: id, probe_id: "probe-1", presentations: [{ slot: 0 }, { slot: 1 }], stimulus_ids: ["stimulus-1"] }),
    loadStimulus: async (id) => ({ schema_version: "0.2-draft", stimulus_id: id }),
  });
  return new ObservationRuntime({
    store,
    artifactProvider: provider,
    uuid: () => uuids.shift(),
    clock: {
      nowMonotonicMs: () => 100,
      wallTimeRfc3339: () => "2026-09-15T12:00:00.000Z",
      performanceTimeOriginMs: () => 1000,
      runtimeEpochId: () => "80000000-0000-4000-8000-000000000001",
    },
  });
}

async function armedRuntime() {
  const store = new MemoryStore();
  const runtime = makeRuntime(store);
  const created = await runtime.createSession({ sessionId: "session-integrity", seriesId: "series-1", participantId: "participant-1", protocolId: "protocol-1" });
  const ready = await runtime.startSession({ sessionId: "session-integrity", expectedRevision: created.revision });
  const armed = await runtime.armTrial({ sessionId: "session-integrity", expectedRevision: ready.revision, probeId: "probe-1", trialId: "trial-1", timingPoint: "pre_protocol_behavioral", displayContext: { width_px: 1440, height_px: 900, device_pixel_ratio: 1 } });
  return { store, runtime, armed };
}

test("integrity flags persist into the committed behavioral record", async () => {
  const { store, runtime, armed } = await armedRuntime();
  const flagged = await runtime.flagIntegrity({ sessionId: "session-integrity", expectedRevision: armed.revision, attemptId: armed.current_attempt_id, dimension: "response_input_integrity", status: "INVALID", reason: "input_adapter_disconnected" });
  const observing = await runtime.markStimulusOnset({ sessionId: "session-integrity", expectedRevision: flagged.revision, attemptId: flagged.current_attempt_id, displayContext: { width_px: 1440, height_px: 900, device_pixel_ratio: 1 } });
  const resolved = await runtime.abortAttempt({ sessionId: "session-integrity", expectedRevision: observing.revision, attemptId: observing.current_attempt_id, reason: "input_adapter_disconnected" });
  await runtime.commitResolvedAttempt({ sessionId: "session-integrity", expectedRevision: resolved.revision, attemptId: resolved.current_attempt_id });

  const record = (await store.loadProjection("session-integrity")).behavioral_records[0];
  assert.equal(record.integrity.response_input_integrity, "INVALID");
  assert.ok(record.integrity.reasons.includes("input_adapter_disconnected"));
});

test("finalize and abort commands make terminal sessions immutable", async () => {
  const { runtime } = await armedRuntime();
  const created = await runtime.createSession({ sessionId: "session-terminal", seriesId: "series-2", participantId: "participant-2", protocolId: "protocol-2" });
  const ready = await runtime.startSession({ sessionId: "session-terminal", expectedRevision: created.revision });
  const finalized = await runtime.finalizeSession({ sessionId: "session-terminal", expectedRevision: ready.revision });
  assert.equal(finalized.state, "FINALIZED");
  await assert.rejects(() => runtime.recordContextMarker({ sessionId: "session-terminal", expectedRevision: finalized.revision, marker: { source: "runtime", kind: "technical", label: "late", data: {}, note: null } }), { code: "STATE_TRANSITION_INVALID" });

  const abortCreated = await runtime.createSession({ sessionId: "session-abort", seriesId: "series-3", participantId: "participant-3", protocolId: "protocol-3" });
  const aborted = await runtime.abortSession({ sessionId: "session-abort", expectedRevision: abortCreated.revision, reason: "operator_cancelled" });
  assert.equal(aborted.state, "ABORTED");
  await assert.rejects(() => runtime.startSession({ sessionId: "session-abort", expectedRevision: aborted.revision }), { code: "STATE_TRANSITION_INVALID" });
});
