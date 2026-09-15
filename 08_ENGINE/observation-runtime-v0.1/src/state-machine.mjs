import { ObservationRuntimeError } from "./errors.mjs";

export const SESSION_STATES = Object.freeze([
  "CREATED",
  "READY",
  "ARMED",
  "OBSERVING",
  "RESOLVED",
  "FINALIZED",
  "ABORTED",
]);

const transitions = new Map([
  ["CREATED:startSession", { event: "session_started", to: "READY" }],
  ["READY:armTrial", { event: "trial_armed", to: "ARMED" }],
  ["ARMED:markStimulusOnset", { event: "stimulus_onset", to: "OBSERVING" }],
  ["ARMED:abortAttempt", { event: "attempt_aborted", to: "RESOLVED" }],
  ["OBSERVING:captureChoice", { event: "response_captured", to: "RESOLVED" }],
  ["OBSERVING:timeoutAttempt", { event: "response_timeout", to: "RESOLVED" }],
  ["OBSERVING:abortAttempt", { event: "attempt_aborted", to: "RESOLVED" }],
  ["RESOLVED:commitResolvedAttempt", { event: "behavioral_record_committed", to: "READY" }],
  ["READY:finalizeSession", { event: "session_finalized", to: "FINALIZED" }],
  ["CREATED:abortSession", { event: "session_aborted", to: "ABORTED" }],
  ["READY:abortSession", { event: "session_aborted", to: "ABORTED" }],
]);

const sameStateCommands = new Map([
  ["READY", new Set(["commitParticipantObservation", "recordContextMarker"])],
  ["ARMED", new Set(["flagIntegrity", "recordContextMarker"])],
  ["OBSERVING", new Set(["flagIntegrity", "recordContextMarker"])],
  ["RESOLVED", new Set(["flagIntegrity", "recordContextMarker"])],
]);

export function transition(state, command) {
  if (!SESSION_STATES.includes(state)) {
    throw new ObservationRuntimeError(
      "STATE_TRANSITION_INVALID",
      `Unknown session state: ${state}`,
      { state, command },
    );
  }

  const next = transitions.get(`${state}:${command}`);
  if (next) {
    return { ...next };
  }

  if (sameStateCommands.get(state)?.has(command)) {
    return { event: null, to: state };
  }

  throw new ObservationRuntimeError(
    "STATE_TRANSITION_INVALID",
    `Invalid session transition: ${state} -> ${command}`,
    { state, command },
  );
}

export function isTerminalState(state) {
  return state === "FINALIZED" || state === "ABORTED";
}
