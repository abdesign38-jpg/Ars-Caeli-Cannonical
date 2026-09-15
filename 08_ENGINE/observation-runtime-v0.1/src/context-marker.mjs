import { ObservationRuntimeError } from "./errors.mjs";
import { canonicalizeJson } from "./canonical-json.mjs";

const SOURCES = new Set(["participant", "operator", "runtime"]);
const KINDS = new Set(["technical", "environmental", "phenomenological", "procedural", "unexpected"]);
const MAX_DATA_BYTES = 65536;

export function createContextMarker({
  markerId,
  source,
  kind,
  label,
  data = {},
  note = null,
}) {
  if (!markerId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(markerId)) {
    throw new ObservationRuntimeError("MARKER_INVALID", "Context markers require a UUIDv4 marker ID.");
  }
  if (!SOURCES.has(source) || !KINDS.has(kind)) {
    throw new ObservationRuntimeError("MARKER_INVALID", "Context marker source or kind is unsupported.");
  }
  if (typeof label !== "string" || label.length < 1 || label.length > 128) {
    throw new ObservationRuntimeError("MARKER_INVALID", "Context marker labels must be 1-128 characters.");
  }
  if (note !== null && (typeof note !== "string" || note.length > 4096)) {
    throw new ObservationRuntimeError("MARKER_INVALID", "Context marker notes must be null or at most 4096 characters.");
  }

  const canonicalData = canonicalizeJson(data);
  if (Buffer.byteLength(canonicalData, "utf8") > MAX_DATA_BYTES) {
    throw new ObservationRuntimeError("PAYLOAD_LIMIT_EXCEEDED", "Context marker data exceeds 65536 canonical bytes.");
  }

  return {
    marker_schema_version: "0.1-draft",
    marker_id: markerId,
    source,
    kind,
    label,
    data: structuredClone(data),
    note,
    interpretation_policy: "none_at_capture",
    projection_policy: "journal_only",
  };
}
