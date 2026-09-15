import test from "node:test";
import assert from "node:assert/strict";

import { ObservationRuntime } from "../src/observation-runtime.mjs";
import { createArtifactProvider } from "../src/artifact-provider.mjs";
import { MemoryStore } from "../src/storage/memory-store.mjs";

const UUIDS = [
  "10000000-0000-4000-8000-000000000001",
  "10000000-0000-4000-8000-000000000002",
  "10000000-0000-4000-8000-000000000003",
  "10000000-0000-4000-8000-000000000004",
  "10000000-0000-4000-8000-000000000005",
  "10000000-0000-4000-8000-000000000006",
  "10000000-0000-4000-8000-000000000007",
  "10000000-0000-4000-8000-000000000008",
];

function runtime(store, epoch, values = UUIDS) {
  const uuids = [...values];
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
      runtimeEpochId: () => epoch,
    },
  });
}

async function arm(runtimeInstance, sessionId) {
  const created = await runtimeInstance.createSession({ sessionId, seriesId: `${sessionId}-series`, participantId: "participant-1", protocolId: "protocol-1" });
  const ready = await runtimeInstance.startSession({ sessionId, expectedRevision: created.revision });
  return runtimeInstance.armTrial({ sessionId, expectedRevision: ready.revision, probeId: "probe-1", trialId: "trial-1", timingPoint: "pre_protocol_behavioral", displayContext: { width_px: 1440, height_px: 900, device_pixel_ratio: 1 } });
}

test("OBSERVING recovery preserves onset but invalidates cross-epoch timing", async () => {
  const store = new MemoryStore();
  const first = runtime(store, "30000000-0000-4000-8000-000000000001");
  const armed = await arm(first, "session-observing");
  await first.markStimulusOnset({ sessionId: "session-observing", expectedRevision: armed.revision, attemptId: armed.current_attempt_id, displayContext: { width_px: 1440, height_px: 900, device_pixel_ratio: 1 } });

  const resumed = await runtime(store, "40000000-0000-4000-8000-000000000001", UUIDS.slice(4)).resumeSession({ sessionId: "session-observing" });
  assert.equal(resumed.state, "READY");
  const record = (await store.loadProjection("session-observing")).behavioral_records[0];
  assert.equal(record.response_status, "aborted");
  assert.equal(record.reaction_time_ms, null);
  assert.equal(record.timing_trace.stimulus_onset_ms, 100);
  assert.equal(record.timing_integrity ?? record.integrity.timing_integrity, "UNKNOWN");
});

test("RESOLVED recovery reconstructs the captured response", async () => {
  const store = new MemoryStore();
  const first = runtime(store, "50000000-0000-4000-8000-000000000001");
  const armed = await arm(first, "session-resolved");
  const observing = await first.markStimulusOnset({ sessionId: "session-resolved", expectedRevision: armed.revision, attemptId: armed.current_attempt_id, displayContext: { width_px: 1440, height_px: 900, device_pixel_ratio: 1 } });
  await first.captureChoice({ sessionId: "session-resolved", expectedRevision: observing.revision, attemptId: observing.current_attempt_id, choiceId: "left", inputModality: "keyboard" });

  const resumed = await runtime(store, "60000000-0000-4000-8000-000000000001", UUIDS.slice(5)).resumeSession({ sessionId: "session-resolved" });
  assert.equal(resumed.state, "READY");
  const events = await store.listEvents("session-resolved");
  assert.deepEqual(events.map(({ event_type }) => event_type), [
    "session_created",
    "session_started",
    "trial_armed",
    "stimulus_onset",
    "response_captured",
    "recovery_detected",
    "behavioral_record_committed",
  ]);
  const record = (await store.loadProjection("session-resolved")).behavioral_records[0];
  assert.equal(record.response_status, "answered");
  assert.equal(record.choice_id, "left");
  assert.equal(record.reaction_time_ms, 0);
});
