import test from "node:test";
import assert from "node:assert/strict";

import { ObservationRuntimeError } from "../src/errors.mjs";
import {
  SESSION_STATES,
  isTerminalState,
  transition,
} from "../src/state-machine.mjs";

test("matches the canonical D.1 state set", () => {
  assert.deepEqual(SESSION_STATES, [
    "CREATED",
    "READY",
    "ARMED",
    "OBSERVING",
    "RESOLVED",
    "FINALIZED",
    "ABORTED",
  ]);
});

test("accepts every normative transition", () => {
  const valid = [
    ["CREATED", "startSession", "session_started", "READY"],
    ["READY", "armTrial", "trial_armed", "ARMED"],
    ["ARMED", "markStimulusOnset", "stimulus_onset", "OBSERVING"],
    ["ARMED", "abortAttempt", "attempt_aborted", "RESOLVED"],
    ["OBSERVING", "captureChoice", "response_captured", "RESOLVED"],
    ["OBSERVING", "timeoutAttempt", "response_timeout", "RESOLVED"],
    ["OBSERVING", "abortAttempt", "attempt_aborted", "RESOLVED"],
    ["RESOLVED", "commitResolvedAttempt", "behavioral_record_committed", "READY"],
    ["READY", "finalizeSession", "session_finalized", "FINALIZED"],
    ["CREATED", "abortSession", "session_aborted", "ABORTED"],
    ["READY", "abortSession", "session_aborted", "ABORTED"],
  ];

  for (const [state, command, event, nextState] of valid) {
    assert.deepEqual(transition(state, command), { event, to: nextState });
  }
});

test("allows same-state journal commands only where specified", () => {
  assert.deepEqual(transition("READY", "recordContextMarker"), { event: null, to: "READY" });
  assert.deepEqual(transition("OBSERVING", "flagIntegrity"), { event: null, to: "OBSERVING" });
});

test("rejects invalid transitions with a typed error", () => {
  assert.throws(
    () => transition("FINALIZED", "startSession"),
    (error) => error instanceof ObservationRuntimeError && error.code === "STATE_TRANSITION_INVALID",
  );
});

test("identifies terminal states", () => {
  assert.equal(isTerminalState("FINALIZED"), true);
  assert.equal(isTerminalState("ABORTED"), true);
  assert.equal(isTerminalState("READY"), false);
});
