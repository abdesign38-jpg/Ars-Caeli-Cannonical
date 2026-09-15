import test from "node:test";
import assert from "node:assert/strict";

import { ObservationRuntime } from "../src/observation-runtime.mjs";
import { createArtifactProvider } from "../src/artifact-provider.mjs";
import { MemoryStore } from "../src/storage/memory-store.mjs";

const UUIDS = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
  "00000000-0000-4000-8000-000000000004",
  "00000000-0000-4000-8000-000000000005",
  "00000000-0000-4000-8000-000000000006",
  "00000000-0000-4000-8000-000000000007",
];

function makeRuntime(store, epoch, uuidValues = UUIDS) {
  const uuids = [...uuidValues];
  const artifactProvider = createArtifactProvider({
    async loadProbe(id) { return { schema_version: "0.2-draft", probe_id: id, evidence_role: "experimental_operationalization", choices: [{ choice_id: "left" }, { choice_id: "right" }] }; },
    async loadTrial(id) { return { schema_version: "0.2-draft", trial_id: id, probe_id: "probe-1", presentations: [{ slot: 0 }, { slot: 1 }], stimulus_ids: ["stimulus-1"] }; },
    async loadStimulus(id) { return { schema_version: "0.2-draft", stimulus_id: id }; },
  });
  const clock = {
    nowMonotonicMs: () => 100,
    wallTimeRfc3339: () => "2026-09-15T12:00:00.000Z",
    performanceTimeOriginMs: () => 1000,
    runtimeEpochId: () => epoch,
  };
  return new ObservationRuntime({ store, artifactProvider, clock, uuid: () => uuids.shift() });
}

test("ARMED recovery aborts and commits without inventing onset or RT", async () => {
  const store = new MemoryStore();
  const first = makeRuntime(store, "11111111-1111-4111-8111-111111111111");
  const created = await first.createSession({ sessionId: "session-armed", seriesId: "series-1", participantId: "participant-1", protocolId: "protocol-1" });
  const ready = await first.startSession({ sessionId: "session-armed", expectedRevision: created.revision });
  await first.armTrial({
    sessionId: "session-armed",
    expectedRevision: ready.revision,
    probeId: "probe-1",
    trialId: "trial-1",
    timingPoint: "pre_protocol_behavioral",
    displayContext: { width_px: 1440, height_px: 900, device_pixel_ratio: 1 },
  });

  const resumed = await makeRuntime(store, "22222222-2222-4222-8222-222222222222", UUIDS.slice(3)).resumeSession({ sessionId: "session-armed" });
  assert.equal(resumed.state, "READY");
  assert.equal(resumed.current_attempt_id, null);
  assert.equal(resumed.current_runtime_epoch_id, "22222222-2222-4222-8222-222222222222");

  const events = await store.listEvents("session-armed");
  assert.deepEqual(events.map(({ event_type }) => event_type), [
    "session_created",
    "session_started",
    "trial_armed",
    "recovery_detected",
    "attempt_aborted",
    "behavioral_record_committed",
  ]);
  const record = (await store.loadProjection("session-armed")).behavioral_records[0];
  assert.equal(record.response_status, "aborted");
  assert.equal(record.reaction_time_ms, null);
  assert.deepEqual(record.timing_trace, { stimulus_onset_ms: null, response_ms: null });
  assert.equal(record.integrity.timing_integrity, "UNKNOWN");
});

test("resume requires an unfinished recoverable attempt", async () => {
  const store = new MemoryStore();
  const runtime = makeRuntime(store, "11111111-1111-4111-8111-111111111111");
  const created = await runtime.createSession({ sessionId: "session-ready", seriesId: "series-1", participantId: "participant-1", protocolId: "protocol-1" });

  await assert.rejects(
    () => runtime.resumeSession({ sessionId: created.sessionId }),
    { code: "RECOVERY_FAILED" },
  );
});
