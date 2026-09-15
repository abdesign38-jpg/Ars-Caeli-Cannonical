const INTERPRETATION_BOUNDARY = "Behavioral records describe observed choices and timing; they do not diagnose, establish causality, or prove symbolic constructs.";

export function createResponseSeries({ seriesId, sessionId, participantId, protocolId, startedAt }) {
  return {
    schema_version: "0.2-draft",
    series_id: seriesId,
    session_id: sessionId,
    participant_id: participantId,
    protocol_id: protocolId,
    started_at: startedAt,
    observations: [],
    engine_records: [],
    derived_metrics: [],
    behavioral_records: [],
    interpretation_boundary: INTERPRETATION_BOUNDARY,
  };
}

export function applyJournalEvent(series, event) {
  const next = structuredClone(series);
  if (event.event_type === "behavioral_record_committed") {
    next.behavioral_records.push(structuredClone(event.payload.record));
  } else if (event.event_type === "participant_observation_committed") {
    next.observations.push(structuredClone(event.payload.observation));
  }
  return next;
}

export function projectJournal(initialSeries, events) {
  return events.reduce(applyJournalEvent, structuredClone(initialSeries));
}
