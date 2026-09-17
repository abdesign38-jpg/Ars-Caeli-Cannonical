import { ObservationRuntimeError } from "../errors.mjs";

export function createParticipantObservationAdapter({ runtime, sessionId, getRevision }) {
  if (!runtime?.commitParticipantObservation) throw new ObservationRuntimeError("INPUT_ADAPTER_INVALID", "A runtime with commitParticipantObservation is required.");
  return Object.freeze({
    commit: (observation) => runtime.commitParticipantObservation({ sessionId, expectedRevision: getRevision(), observation: { ...observation, status: "participant_reported" } }),
  });
}
