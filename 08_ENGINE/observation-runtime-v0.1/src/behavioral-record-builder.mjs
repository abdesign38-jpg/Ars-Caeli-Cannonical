import { ObservationRuntimeError } from "./errors.mjs";

const VALID_TIMING_POINTS = new Set([
  "calibration",
  "standalone",
  "pre_protocol_behavioral",
  "post_recovery_behavioral",
]);

function integrityValue(value, fallback) {
  return value ?? fallback;
}

export function buildBehavioralRecord({
  attempt,
  recordId,
  recordedAt,
  runtimeId = "aeon-observation-runtime",
  runtimeVersion = "0.1",
  clockSource = "performance.now",
}) {
  if (!attempt?.attemptId || !attempt.probeId || !attempt.trialId) {
    throw new ObservationRuntimeError("RECORD_INVALID", "A behavioral record requires attempt, probe, and trial identity.");
  }
  if (!VALID_TIMING_POINTS.has(attempt.timingPoint)) {
    throw new ObservationRuntimeError("RECORD_INVALID", `Unsupported timing point: ${attempt.timingPoint}`);
  }
  if (!recordId || !recordedAt) {
    throw new ObservationRuntimeError("RECORD_INVALID", "A behavioral record requires recordId and recordedAt.");
  }

  const onset = attempt.onset ?? null;
  const resolution = attempt.resolution;
  if (!resolution?.responseStatus) {
    throw new ObservationRuntimeError("RECORD_UNRESOLVED", "Cannot build a record before the attempt is resolved.");
  }

  const sameEpoch = onset === null || onset.runtimeEpochId === resolution.runtimeEpochId;
  const answered = resolution.responseStatus === "answered";
  const reactionTimeMs = answered && onset !== null && sameEpoch
    ? resolution.monotonicMs - onset.monotonicMs
    : null;
  if (reactionTimeMs !== null && reactionTimeMs < 0) {
    throw new ObservationRuntimeError("TIMING_INVALID", "Response time cannot precede stimulus onset.");
  }

  const timingIntegrity = integrityValue(
    attempt.integrity?.timing,
    answered && onset !== null && sameEpoch ? "VALID" : "UNKNOWN",
  );
  const reasons = [...(attempt.integrity?.reasons ?? [])];
  if (!sameEpoch) reasons.push("runtime_epoch_mismatch");
  if (timingIntegrity !== "VALID" && reasons.length === 0) reasons.push("timing_integrity_not_valid");

  return {
    schema_version: "0.2-draft",
    record_id: recordId,
    probe_id: attempt.probeId,
    trial_id: attempt.trialId,
    response_status: resolution.responseStatus,
    choice_id: resolution.choiceId ?? null,
    reaction_time_ms: reactionTimeMs,
    recorded_at: recordedAt,
    timing_point: attempt.timingPoint,
    provenance: {
      runtime_id: runtimeId,
      runtime_version: runtimeVersion,
      clock_source: clockSource,
      input_modality: resolution.inputModality ?? "none",
    },
    timing_trace: {
      stimulus_onset_ms: onset?.monotonicMs ?? null,
      response_ms: answered && sameEpoch ? resolution.monotonicMs : null,
    },
    display_context: attempt.displayContext,
    operational_authority: false,
    integrity: {
      perceptual_stimulus_integrity: integrityValue(attempt.integrity?.perceptualStimulus, "VALID"),
      response_input_integrity: integrityValue(attempt.integrity?.responseInput, answered ? "VALID" : "UNKNOWN"),
      timing_integrity: timingIntegrity,
      reasons,
    },
    evidence_role: "behavioral_measured",
  };
}
