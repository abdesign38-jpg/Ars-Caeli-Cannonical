import test from "node:test";
import assert from "node:assert/strict";

import { buildBehavioralRecord } from "../src/behavioral-record-builder.mjs";

const baseAttempt = {
  attemptId: "attempt-1",
  probeId: "pg01-geometric-regularity",
  trialId: "pg01-trial-0001",
  timingPoint: "pre_protocol_behavioral",
  displayContext: { width_px: 1440, height_px: 900, device_pixel_ratio: 1 },
  onset: { monotonicMs: 1000, runtimeEpochId: "epoch-a" },
  resolution: {
    responseStatus: "answered",
    choiceId: "left",
    inputModality: "keyboard",
    monotonicMs: 1842,
    runtimeEpochId: "epoch-a",
  },
};

test("builds a D.0-compatible answered behavioral record", () => {
  const record = buildBehavioralRecord({
    attempt: baseAttempt,
    recordId: "record-1",
    recordedAt: "2026-09-15T12:00:00Z",
  });

  assert.deepEqual(record, {
    schema_version: "0.2-draft",
    record_id: "record-1",
    probe_id: "pg01-geometric-regularity",
    trial_id: "pg01-trial-0001",
    response_status: "answered",
    choice_id: "left",
    reaction_time_ms: 842,
    recorded_at: "2026-09-15T12:00:00Z",
    timing_point: "pre_protocol_behavioral",
    provenance: {
      runtime_id: "aeon-observation-runtime",
      runtime_version: "0.1",
      clock_source: "performance.now",
      input_modality: "keyboard",
    },
    timing_trace: { stimulus_onset_ms: 1000, response_ms: 1842 },
    display_context: { width_px: 1440, height_px: 900, device_pixel_ratio: 1 },
    operational_authority: false,
    integrity: {
      perceptual_stimulus_integrity: "VALID",
      response_input_integrity: "VALID",
      timing_integrity: "VALID",
      reasons: [],
    },
    evidence_role: "behavioral_measured",
  });
});

test("timeout and abort records never invent reaction time", () => {
  const timeout = buildBehavioralRecord({
    attempt: {
      ...baseAttempt,
      resolution: { responseStatus: "timeout", choiceId: null, inputModality: null, monotonicMs: 2000, runtimeEpochId: "epoch-a" },
    },
    recordId: "record-timeout",
    recordedAt: "2026-09-15T12:00:02Z",
  });
  const aborted = buildBehavioralRecord({
    attempt: {
      ...baseAttempt,
      onset: null,
      resolution: { responseStatus: "aborted", choiceId: null, inputModality: null, monotonicMs: 900, runtimeEpochId: "epoch-a" },
    },
    recordId: "record-aborted",
    recordedAt: "2026-09-15T12:00:03Z",
  });

  assert.equal(timeout.reaction_time_ms, null);
  assert.deepEqual(timeout.timing_trace, { stimulus_onset_ms: 1000, response_ms: null });
  assert.equal(aborted.reaction_time_ms, null);
  assert.deepEqual(aborted.timing_trace, { stimulus_onset_ms: null, response_ms: null });
});

test("cross-epoch answered responses cannot produce valid reaction time", () => {
  const record = buildBehavioralRecord({
    attempt: {
      ...baseAttempt,
      resolution: { ...baseAttempt.resolution, runtimeEpochId: "epoch-b" },
    },
    recordId: "record-recovered",
    recordedAt: "2026-09-15T12:00:04Z",
  });

  assert.equal(record.reaction_time_ms, null);
  assert.equal(record.integrity.timing_integrity, "UNKNOWN");
  assert.deepEqual(record.timing_trace, { stimulus_onset_ms: 1000, response_ms: null });
  assert.deepEqual(record.integrity.reasons, ["runtime_epoch_mismatch"]);
});
