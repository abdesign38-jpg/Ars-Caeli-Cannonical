import { ObservationRuntimeError } from "../errors.mjs";

export function createContextMarkerAdapter({ runtime, sessionId, getRevision, attemptId = null }) {
  if (!runtime?.recordContextMarker) throw new ObservationRuntimeError("INPUT_ADAPTER_INVALID", "A runtime with recordContextMarker is required.");
  return Object.freeze({
    record: (marker) => runtime.recordContextMarker({ sessionId, expectedRevision: getRevision(), attemptId, marker }),
  });
}
