import { ObservationRuntimeError } from "./errors.mjs";

const UUID_V4 = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
const EVENT_TYPES = new Set([
  "session_created",
  "session_started",
  "trial_armed",
  "stimulus_onset",
  "response_captured",
  "response_timeout",
  "attempt_aborted",
  "integrity_flagged",
  "behavioral_record_committed",
  "participant_observation_committed",
  "context_marker_recorded",
  "recovery_detected",
  "session_finalized",
  "session_aborted",
]);

function invalid(message, details = {}) {
  throw new ObservationRuntimeError("EVENT_SCHEMA_INVALID", message, details);
}

function requiredObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid(`${label} must be an object.`);
}

function requiredString(value, label) {
  if (typeof value !== "string" || value.length === 0) invalid(`${label} must be a non-empty string.`);
}

function requiredUuid(value, label, nullable = false) {
  if (nullable && value === null) return;
  if (typeof value !== "string" || !UUID_V4.test(value)) invalid(`${label} must be a UUIDv4 or null.`);
}

export function validateRuntimeEvent(event) {
  requiredObject(event, "runtime event");
  if (event.event_schema_version !== "0.1-draft") invalid("Unsupported runtime event schema version.");
  requiredUuid(event.event_id, "event_id");
  requiredString(event.session_id, "session_id");
  if (!Number.isInteger(event.seq) || event.seq < 0) invalid("seq must be a non-negative integer.");
  if (!EVENT_TYPES.has(event.event_type)) invalid(`Unsupported event_type: ${event.event_type}`);
  if (typeof event.wall_time !== "string" || Number.isNaN(Date.parse(event.wall_time))) invalid("wall_time must be RFC3339.");
  requiredUuid(event.runtime_epoch_id, "runtime_epoch_id");
  if (typeof event.performance_time_origin_ms !== "number" || event.performance_time_origin_ms < 0) invalid("performance_time_origin_ms must be non-negative.");
  if (typeof event.monotonic_ms !== "number" || event.monotonic_ms < 0) invalid("monotonic_ms must be non-negative.");
  requiredUuid(event.attempt_id, "attempt_id", true);
  requiredObject(event.payload, "payload");

  if (["session_created", "session_started", "participant_observation_committed", "session_finalized", "session_aborted"].includes(event.event_type)) {
    if (event.attempt_id !== null) invalid(`${event.event_type} cannot target an attempt.`);
  } else if (event.attempt_id === null && event.event_type !== "context_marker_recorded") {
    invalid(`${event.event_type} requires an attempt_id.`);
  }

  if (event.event_type === "response_captured") {
    requiredString(event.payload.choice_id, "payload.choice_id");
    if (!["keyboard", "pointer", "touch", "other"].includes(event.payload.input_modality)) invalid("payload.input_modality is unsupported.");
  }
  if (event.event_type === "response_timeout" && event.payload.reason !== "response_window_elapsed") invalid("Timeout reason is invalid.");
  if (event.event_type === "behavioral_record_committed") {
    requiredObject(event.payload.record, "payload.record");
    if (event.payload.record.schema_version !== "0.2-draft" || event.payload.record.evidence_role !== "behavioral_measured") invalid("Committed record is not a supported D.0 behavioral record.");
  }
  if (event.event_type === "participant_observation_committed" && event.payload.observation?.status !== "participant_reported") invalid("Participant observation status is invalid.");
  if (event.event_type === "context_marker_recorded") {
    requiredObject(event.payload.marker, "payload.marker");
    if (event.payload.marker.interpretation_policy !== "none_at_capture" || event.payload.marker.projection_policy !== "journal_only") invalid("Context marker policy is invalid.");
  }

  return event;
}
