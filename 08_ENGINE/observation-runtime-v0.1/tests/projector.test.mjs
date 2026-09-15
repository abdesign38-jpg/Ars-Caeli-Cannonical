import test from "node:test";
import assert from "node:assert/strict";

import { createResponseSeries, projectJournal } from "../src/response-series-projector.mjs";

test("projects committed behavioral records and participant observations", () => {
  const initial = createResponseSeries({
    seriesId: "series-1",
    sessionId: "session-1",
    participantId: "participant-1",
    protocolId: "protocol-1",
    startedAt: "2026-09-15T12:00:00Z",
  });
  const record = { schema_version: "0.2-draft", record_id: "record-1", evidence_role: "behavioral_measured" };
  const observation = { timestamp_s: 1.2, timing_point: "post_trial", condition_id: null, responses: { confidence: 4 }, status: "participant_reported" };
  const projected = projectJournal(initial, [
    { event_type: "context_marker_recorded", payload: { marker: { label: "unexpected" } } },
    { event_type: "behavioral_record_committed", payload: { record } },
    { event_type: "participant_observation_committed", payload: { observation } },
  ]);

  assert.deepEqual(projected.behavioral_records, [record]);
  assert.deepEqual(projected.observations, [observation]);
  assert.deepEqual(projected.engine_records, []);
  assert.deepEqual(projected.derived_metrics, []);
  assert.match(projected.interpretation_boundary, /do not diagnose/);
});

test("projection does not mutate the source series", () => {
  const initial = createResponseSeries({
    seriesId: "series-1",
    sessionId: "session-1",
    participantId: "participant-1",
    protocolId: "protocol-1",
    startedAt: "2026-09-15T12:00:00Z",
  });
  projectJournal(initial, [{ event_type: "context_marker_recorded", payload: {} }]);
  assert.deepEqual(initial.behavioral_records, []);
  assert.deepEqual(initial.observations, []);
});
