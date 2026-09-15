import { buildBehavioralRecord } from "./behavioral-record-builder.mjs";
import { ObservationRuntimeError } from "./errors.mjs";
import { applyJournalEvent, createResponseSeries, projectJournal } from "./response-series-projector.mjs";

export function replaySessionProjection(session, events) {
  const initial = createResponseSeries({
    seriesId: session.series_id ?? session.seriesId,
    sessionId: session.session_id ?? session.sessionId,
    participantId: session.participant_id ?? session.participantId,
    protocolId: session.protocol_id ?? session.protocolId,
    startedAt: session.started_at ?? session.created_at,
  });
  return projectJournal(initial, events);
}

export function recoveryDisposition(state) {
  if (state === "ARMED" || state === "OBSERVING") return "abort_and_commit";
  if (state === "RESOLVED") return "reconstruct_commit";
  return null;
}

export function assertRecoverableSession(session) {
  if (!session?.activeAttempt || !recoveryDisposition(session.state)) {
    throw new ObservationRuntimeError("RECOVERY_FAILED", "Session has no recoverable unfinished attempt.");
  }
}

export function appendRecoveredRecord(transaction, {
  session,
  attempt,
  priorState,
  priorRuntimeEpochId,
  newRuntimeEpochId,
  eventFactory,
  recordId,
  recordedAt,
}) {
  const disposition = recoveryDisposition(priorState);
  if (!disposition) throw new ObservationRuntimeError("RECOVERY_FAILED", `State cannot be recovered: ${priorState}`);

  const recoveryEvent = transaction.appendEvent(eventFactory("recovery_detected", attempt.attemptId, {
    prior_state: priorState,
    prior_runtime_epoch_id: priorRuntimeEpochId,
    new_runtime_epoch_id: newRuntimeEpochId,
    disposition,
  }));

  if (disposition === "abort_and_commit") {
    if (priorState === "ARMED" && !attempt.displayContext) {
      throw new ObservationRuntimeError("RECOVERY_FAILED", "ARMED recovery requires persisted display context.");
    }
    attempt.resolution = {
      responseStatus: "aborted",
      choiceId: null,
      inputModality: null,
      monotonicMs: null,
      runtimeEpochId: newRuntimeEpochId,
    };
    transaction.appendEvent(eventFactory("attempt_aborted", attempt.attemptId, {
      reason: priorState === "ARMED" ? "runtime_restart_before_onset" : "runtime_restart_during_observation",
    }));
  }

  const record = buildBehavioralRecord({
    attempt,
    recordId,
    recordedAt,
  });
  const committed = transaction.appendEvent(eventFactory("behavioral_record_committed", attempt.attemptId, { record }));
  transaction.setProjection(applyJournalEvent(transaction.projection, committed));
  transaction.session.state = "READY";
  transaction.session.current_attempt_id = null;
  transaction.session.activeAttempt = null;
  transaction.session.last_event_seq = committed.seq;
}
