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
  "00000000-0000-4000-8000-000000000008",
];

function makeRuntime() {
  const store = new MemoryStore();
  const uuids = [...UUIDS];
  const times = [10, 20, 100, 500, 1250, 1300];
  const clock = {
    nowMonotonicMs: () => times.shift() ?? 1300,
    wallTimeRfc3339: () => "2026-09-15T12:00:00.000Z",
    performanceTimeOriginMs: () => 1000,
    runtimeEpochId: () => "11111111-1111-4111-8111-111111111111",
  };
  const artifactProvider = createArtifactProvider({
    async loadProbe(id) {
      return { schema_version: "0.2-draft", probe_id: id, evidence_role: "experimental_operationalization", choices: [{ choice_id: "left" }, { choice_id: "right" }] };
    },
    async loadTrial(id) {
      return { schema_version: "0.2-draft", trial_id: id, probe_id: "probe-1", presentations: [{ slot: 0 }, { slot: 1 }], stimulus_ids: ["stimulus-1"] };
    },
    async loadStimulus(id) {
      return { schema_version: "0.2-draft", stimulus_id: id };
    },
  });
  return {
    store,
    runtime: new ObservationRuntime({ store, artifactProvider, clock, uuid: () => uuids.shift() }),
  };
}

test("runs a canonical session command flow through the journal and projection", async () => {
  const { runtime, store } = makeRuntime();
  const created = await runtime.createSession({
    sessionId: "session-1",
    seriesId: "series-1",
    participantId: "participant-1",
    protocolId: "protocol-1",
  });
  const ready = await runtime.startSession({ sessionId: "session-1", expectedRevision: created.revision });
  const armed = await runtime.armTrial({
    sessionId: "session-1",
    expectedRevision: ready.revision,
    probeId: "probe-1",
    trialId: "trial-1",
    timingPoint: "pre_protocol_behavioral",
  });
  const observing = await runtime.markStimulusOnset({
    sessionId: "session-1",
    expectedRevision: armed.revision,
    attemptId: armed.current_attempt_id,
    presentationSource: "presentation_adapter",
    displayContext: { width_px: 1440, height_px: 900, device_pixel_ratio: 1 },
  });
  const resolved = await runtime.captureChoice({
    sessionId: "session-1",
    expectedRevision: observing.revision,
    attemptId: observing.current_attempt_id,
    choiceId: "left",
    inputModality: "keyboard",
  });
  const committed = await runtime.commitResolvedAttempt({
    sessionId: "session-1",
    expectedRevision: resolved.revision,
    attemptId: resolved.current_attempt_id,
  });

  assert.equal(committed.state, "READY");
  assert.equal(committed.last_event_seq, 5);
  const events = await store.listEvents("session-1");
  assert.deepEqual(events.map(({ seq, event_type }) => ({ seq, event_type })), [
    { seq: 0, event_type: "session_created" },
    { seq: 1, event_type: "session_started" },
    { seq: 2, event_type: "trial_armed" },
    { seq: 3, event_type: "stimulus_onset" },
    { seq: 4, event_type: "response_captured" },
    { seq: 5, event_type: "behavioral_record_committed" },
  ]);
  const record = (await store.loadProjection("session-1")).behavioral_records[0];
  assert.equal(record.reaction_time_ms, 750);
  assert.equal(record.evidence_role, "behavioral_measured");
  assert.equal((await store.loadArtifactSnapshot(events[2].payload.probe_ref.sha256)).artifact_id, "probe-1");
});

test("context markers remain journal-only and participant observations project separately", async () => {
  const { runtime, store } = makeRuntime();
  const created = await runtime.createSession({ sessionId: "session-2", seriesId: "series-2", participantId: "p-2", protocolId: "protocol-2" });
  const ready = await runtime.startSession({ sessionId: "session-2", expectedRevision: created.revision });
  const marked = await runtime.recordContextMarker({
    sessionId: "session-2",
    expectedRevision: ready.revision,
    marker: { source: "participant", kind: "unexpected", label: "salience", data: { intensity: 6 }, note: null },
  });
  const final = await runtime.commitParticipantObservation({
    sessionId: "session-2",
    expectedRevision: marked.revision,
    observation: { timestamp_s: 1, timing_point: "post_trial", condition_id: null, responses: { confidence: 4 }, status: "participant_reported" },
  });

  assert.equal(final.state, "READY");
  const events = await store.listEvents("session-2");
  assert.deepEqual(events.map(({ event_type }) => event_type), [
    "session_created",
    "session_started",
    "context_marker_recorded",
    "participant_observation_committed",
  ]);
  const projection = await store.loadProjection("session-2");
  assert.equal(projection.observations.length, 1);
  assert.equal(projection.behavioral_records.length, 0);
});
