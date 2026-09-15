import { ObservationRuntimeError } from "./errors.mjs";

const SUPPORTED_VERSION = "0.2-draft";
const TIMING_POINTS = new Set(["calibration", "standalone", "pre_protocol_behavioral", "post_recovery_behavioral"]);

function requireObject(document, label) {
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    throw new ObservationRuntimeError("ARTIFACT_INVALID", `${label} must be an object.`);
  }
}

function requireVersion(document, label) {
  if (document.schema_version !== SUPPORTED_VERSION) {
    throw new ObservationRuntimeError("ARTIFACT_UNSUPPORTED_VERSION", `${label} must use ${SUPPORTED_VERSION}.`, {
      received: document.schema_version,
      supported: SUPPORTED_VERSION,
    });
  }
}

function requireString(value, field, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new ObservationRuntimeError("ARTIFACT_INVALID", `${label}.${field} must be a non-empty string.`);
  }
}

export function guardBehavioralProbe(document) {
  requireObject(document, "behavioral_probe");
  requireVersion(document, "behavioral_probe");
  requireString(document.probe_id, "probe_id", "behavioral_probe");
  requireString(document.evidence_role, "evidence_role", "behavioral_probe");
  if (document.evidence_role !== "experimental_operationalization") {
    throw new ObservationRuntimeError("ARTIFACT_INVALID", "behavioral_probe.evidence_role is not operationalization.");
  }
  if (!Array.isArray(document.choices) || document.choices.length < 2) {
    throw new ObservationRuntimeError("ARTIFACT_INVALID", "behavioral_probe.choices must contain at least two choices.");
  }
  return document;
}

export function guardBehavioralTrial(document) {
  requireObject(document, "behavioral_trial");
  requireVersion(document, "behavioral_trial");
  requireString(document.trial_id, "trial_id", "behavioral_trial");
  requireString(document.probe_id, "probe_id", "behavioral_trial");
  if (!Array.isArray(document.presentations) || document.presentations.length < 2) {
    throw new ObservationRuntimeError("ARTIFACT_INVALID", "behavioral_trial.presentations must contain at least two items.");
  }
  return document;
}

export function guardBehavioralRecord(document) {
  requireObject(document, "behavioral_record");
  requireVersion(document, "behavioral_record");
  requireString(document.record_id, "record_id", "behavioral_record");
  requireString(document.probe_id, "probe_id", "behavioral_record");
  requireString(document.trial_id, "trial_id", "behavioral_record");
  if (!new Set(["answered", "timeout", "aborted"]).has(document.response_status)) {
    throw new ObservationRuntimeError("ARTIFACT_INVALID", "behavioral_record.response_status is unsupported.");
  }
  if (!TIMING_POINTS.has(document.timing_point)) {
    throw new ObservationRuntimeError("ARTIFACT_INVALID", "behavioral_record.timing_point is unsupported.");
  }
  if (document.evidence_role !== "behavioral_measured" || document.operational_authority !== false) {
    throw new ObservationRuntimeError("ARTIFACT_INVALID", "behavioral_record evidence boundary is invalid.");
  }
  return document;
}

export function guardArtifact(artifactType, document) {
  if (artifactType === "behavioral_probe") return guardBehavioralProbe(document);
  if (artifactType === "behavioral_trial") return guardBehavioralTrial(document);
  requireObject(document, artifactType);
  requireVersion(document, artifactType);
  return document;
}
