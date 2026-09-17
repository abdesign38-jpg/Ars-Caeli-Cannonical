import { canonicalizeJson } from "../canonical-json.mjs";
import { ObservationRuntimeError } from "../errors.mjs";
import { replaySessionProjection } from "../recovery.mjs";

const SECURITY_BOUNDARY = "Hashes provide tamper evidence for exported components; they are not signatures and do not authenticate the author.";

async function sha256(value) {
  if (!globalThis.crypto?.subtle) throw new ObservationRuntimeError("HASHING_UNAVAILABLE", "WebCrypto SHA-256 is required for export verification.");
  const bytes = new TextEncoder().encode(canonicalizeJson(value));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const hashCanonical = sha256;

function sessionForExport(session) {
  return {
    session_state_version: "0.1-draft",
    session_id: session.session_id ?? session.sessionId,
    series_id: session.series_id ?? session.seriesId,
    participant_id: session.participant_id ?? session.participantId,
    protocol_id: session.protocol_id ?? session.protocolId,
    state: session.state,
    revision: session.revision,
    last_event_seq: session.last_event_seq,
    current_attempt_id: session.current_attempt_id,
    current_runtime_epoch_id: session.current_runtime_epoch_id,
    created_at: session.created_at,
    started_at: session.started_at,
    finalized_at: session.finalized_at,
    interpretation_policy: "no_automatic_interpretation",
  };
}

function assertExportShape(bundle) {
  if (!bundle || bundle.export_schema_version !== "0.1-draft" || !bundle.session || !Array.isArray(bundle.journal) || !bundle.response_series || !Array.isArray(bundle.artifact_snapshots) || !bundle.manifest) {
    throw new ObservationRuntimeError("EXPORT_SCHEMA_INVALID", "Export bundle does not match the D.1 shape.");
  }
}

export async function buildSessionExport({ session, responseSeries, journal, artifactSnapshots, exportId, exportedAt }) {
  const normalizedSession = sessionForExport(session);
  const components = {
    session: normalizedSession,
    response_series: responseSeries,
    journal,
    artifact_snapshots: artifactSnapshots,
  };
  return {
    export_schema_version: "0.1-draft",
    export_id: exportId,
    exported_at: exportedAt,
    runtime: { runtime_id: "aeon-observation-runtime", runtime_version: "0.1" },
    ...components,
    manifest: {
      hash_algorithm: "SHA-256",
      canonicalization: "RFC8785-JCS",
      session_sha256: await sha256(normalizedSession),
      response_series_sha256: await sha256(responseSeries),
      journal_sha256: await sha256(journal),
      artifact_snapshots_sha256: await sha256(artifactSnapshots),
      security_boundary: SECURITY_BOUNDARY,
    },
  };
}

export async function verifySessionExport(bundle) {
  assertExportShape(bundle);
  if (bundle.runtime?.runtime_id !== "aeon-observation-runtime" || bundle.runtime?.runtime_version !== "0.1") {
    throw new ObservationRuntimeError("EXPORT_SCHEMA_INVALID", "Unsupported runtime version.");
  }
  const expected = {
    session_sha256: await sha256(bundle.session),
    response_series_sha256: await sha256(bundle.response_series),
    journal_sha256: await sha256(bundle.journal),
    artifact_snapshots_sha256: await sha256(bundle.artifact_snapshots),
  };
  for (const [name, digest] of Object.entries(expected)) {
    if (bundle.manifest[name] !== digest) throw new ObservationRuntimeError("EXPORT_HASH_MISMATCH", `Export component hash mismatch: ${name}`);
  }
  const replayed = replaySessionProjection(bundle.session, bundle.journal);
  if (canonicalizeJson(replayed) !== canonicalizeJson(bundle.response_series)) {
    throw new ObservationRuntimeError("EXPORT_REPLAY_MISMATCH", "Journal replay does not match embedded response series.");
  }
  return structuredClone(bundle);
}

export { sessionForExport };
