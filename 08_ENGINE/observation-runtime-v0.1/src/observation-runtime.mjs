import { buildBehavioralRecord } from "./behavioral-record-builder.mjs";
import { systemClock } from "./clock.mjs";
import { createContextMarker } from "./context-marker.mjs";
import { ObservationRuntimeError } from "./errors.mjs";
import { createUuid } from "./ids.mjs";
import { createResponseSeries, applyJournalEvent } from "./response-series-projector.mjs";
import { transition } from "./state-machine.mjs";
import { MemoryStore } from "./storage/memory-store.mjs";

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

function clone(value) {
  return structuredClone(value);
}

function assertUuid(value, label) {
  if (!UUID_PATTERN.test(value)) {
    throw new ObservationRuntimeError("IDENTITY_INVALID", `${label} must be a UUIDv4.`);
  }
}

export class ObservationRuntime {
  #store;
  #artifactProvider;
  #clock;
  #uuid;

  constructor({ store = new MemoryStore(), artifactProvider = null, clock = systemClock(), uuid = createUuid } = {}) {
    this.#store = store;
    this.#artifactProvider = artifactProvider;
    this.#clock = clock;
    this.#uuid = uuid;
  }

  static async open(options = {}) {
    return new ObservationRuntime(options);
  }

  async createSession({ sessionId = this.#uuid(), seriesId, participantId, protocolId }) {
    if (!sessionId || !seriesId || !participantId || !protocolId) {
      throw new ObservationRuntimeError("SESSION_INVALID", "Session identity fields are required.");
    }
    const createdAt = this.#clock.wallTimeRfc3339();
    const session = await this.#store.createSession({
      session_state_version: "0.1-draft",
      sessionId,
      seriesId,
      participantId,
      protocolId,
      state: "CREATED",
      revision: 0,
      last_event_seq: -1,
      current_attempt_id: null,
      current_runtime_epoch_id: this.#clock.runtimeEpochId(),
      created_at: createdAt,
      started_at: null,
      finalized_at: null,
      interpretation_policy: "no_automatic_interpretation",
      activeAttempt: null,
    });
    await this.#store.transact(sessionId, 0, (transaction) => {
      const event = this.#event(sessionId, "session_created", null, {
        series_id: seriesId,
        participant_id: participantId,
        protocol_id: protocolId,
        created_at: createdAt,
        runtime_id: "aeon-observation-runtime",
        runtime_version: "0.1",
        interpretation_policy: "no_automatic_interpretation",
      });
      transaction.appendEvent(event);
      transaction.setProjection(createResponseSeries({ seriesId, sessionId, participantId, protocolId, startedAt: createdAt }));
    });
    return this.#store.loadSession(sessionId);
  }

  async startSession({ sessionId, expectedRevision }) {
    return this.#transition(sessionId, expectedRevision, "startSession", null, { started_at: this.#clock.wallTimeRfc3339() });
  }

  async armTrial({ sessionId, expectedRevision, probeId, trialId, timingPoint }) {
    const refs = await this.#resolveTrialRefs(probeId, trialId);
    await this.#store.transact(sessionId, expectedRevision, (transaction) => {
      const result = transition(transaction.session.state, "armTrial");
      const attemptId = this.#uuid();
      const attempt = {
        attemptId,
        attemptOrdinal: (transaction.session.attemptOrdinal ?? 0) + 1,
        probeId,
        trialId,
        timingPoint,
        runtimeEpochId: this.#clock.runtimeEpochId(),
        displayContext: null,
        integrity: {},
        refs,
        onset: null,
        resolution: null,
      };
      transaction.session.state = result.to;
      transaction.session.attemptOrdinal = attempt.attemptOrdinal;
      transaction.session.current_attempt_id = attemptId;
      transaction.session.activeAttempt = attempt;
      const event = this.#event(sessionId, result.event, attemptId, {
        attempt_ordinal: attempt.attemptOrdinal,
        timing_point: timingPoint,
        probe_ref: refs.probe_ref,
        trial_ref: refs.trial_ref,
        stimulus_refs: refs.stimulus_refs,
      });
      transaction.appendEvent(event);
      transaction.session.last_event_seq = event.seq;
    });
    return this.#store.loadSession(sessionId);
  }

  async markStimulusOnset({ sessionId, expectedRevision, attemptId, presentationSource = "presentation_adapter", displayContext }) {
    await this.#store.transact(sessionId, expectedRevision, (transaction) => {
      const result = transition(transaction.session.state, "markStimulusOnset");
      const attempt = this.#requireAttempt(transaction.session, attemptId);
      const monotonicMs = this.#clock.nowMonotonicMs();
      attempt.displayContext = clone(displayContext);
      attempt.onset = { monotonicMs, runtimeEpochId: this.#clock.runtimeEpochId() };
      transaction.session.state = result.to;
      const event = this.#event(sessionId, result.event, attemptId, {
        presentation_source: presentationSource,
        display_context: displayContext,
      }, monotonicMs);
      transaction.appendEvent(event);
      transaction.session.last_event_seq = event.seq;
    });
    return this.#store.loadSession(sessionId);
  }

  async captureChoice({ sessionId, expectedRevision, attemptId, choiceId, inputModality }) {
    await this.#store.transact(sessionId, expectedRevision, (transaction) => {
      const result = transition(transaction.session.state, "captureChoice");
      const attempt = this.#requireAttempt(transaction.session, attemptId);
      const monotonicMs = this.#clock.nowMonotonicMs();
      attempt.resolution = { responseStatus: "answered", choiceId, inputModality, monotonicMs, runtimeEpochId: this.#clock.runtimeEpochId() };
      transaction.session.state = result.to;
      const event = this.#event(sessionId, result.event, attemptId, { choice_id: choiceId, input_modality: inputModality }, monotonicMs);
      transaction.appendEvent(event);
      transaction.session.last_event_seq = event.seq;
    });
    return this.#store.loadSession(sessionId);
  }

  async timeoutAttempt({ sessionId, expectedRevision, attemptId }) {
    return this.#resolveAttempt(sessionId, expectedRevision, attemptId, "timeoutAttempt", "response_timeout", "response_window_elapsed");
  }

  async abortAttempt({ sessionId, expectedRevision, attemptId, reason = "attempt_aborted" }) {
    return this.#resolveAttempt(sessionId, expectedRevision, attemptId, "abortAttempt", "attempt_aborted", reason);
  }

  async commitResolvedAttempt({ sessionId, expectedRevision, attemptId }) {
    await this.#store.transact(sessionId, expectedRevision, async (transaction) => {
      const result = transition(transaction.session.state, "commitResolvedAttempt");
      const attempt = this.#requireAttempt(transaction.session, attemptId);
      const record = buildBehavioralRecord({ attempt, recordId: this.#uuid(), recordedAt: this.#clock.wallTimeRfc3339() });
      transaction.session.state = result.to;
      transaction.session.current_attempt_id = null;
      transaction.session.activeAttempt = null;
      const event = this.#event(sessionId, result.event, attemptId, { record });
      const committed = transaction.appendEvent(event);
      transaction.setProjection(applyJournalEvent(transaction.projection, committed));
      transaction.session.last_event_seq = committed.seq;
    });
    return this.#store.loadSession(sessionId);
  }

  async commitParticipantObservation({ sessionId, expectedRevision, observation }) {
    if (!observation || observation.status !== "participant_reported") {
      throw new ObservationRuntimeError("OBSERVATION_INVALID", "Participant observations must have participant_reported status.");
    }
    await this.#store.transact(sessionId, expectedRevision, (transaction) => {
      const result = transition(transaction.session.state, "commitParticipantObservation");
      const event = this.#event(sessionId, "participant_observation_committed", null, { observation });
      const committed = transaction.appendEvent(event);
      transaction.setProjection(applyJournalEvent(transaction.projection, committed));
      transaction.session.last_event_seq = committed.seq;
      transaction.session.state = result.to;
    });
    return this.#store.loadSession(sessionId);
  }

  async recordContextMarker({ sessionId, expectedRevision, attemptId = null, marker }) {
    const normalized = createContextMarker({ markerId: marker.marker_id ?? this.#uuid(), ...marker });
    await this.#store.transact(sessionId, expectedRevision, (transaction) => {
      const result = transition(transaction.session.state, "recordContextMarker");
      const event = this.#event(sessionId, "context_marker_recorded", attemptId, { marker: normalized });
      const committed = transaction.appendEvent(event);
      transaction.session.last_event_seq = committed.seq;
      transaction.session.state = result.to;
    });
    return this.#store.loadSession(sessionId);
  }

  async #resolveAttempt(sessionId, expectedRevision, attemptId, command, eventType, reason) {
    await this.#store.transact(sessionId, expectedRevision, (transaction) => {
      const result = transition(transaction.session.state, command);
      const attempt = this.#requireAttempt(transaction.session, attemptId);
      attempt.resolution = {
        responseStatus: eventType === "response_timeout" ? "timeout" : "aborted",
        choiceId: null,
        inputModality: null,
        monotonicMs: this.#clock.nowMonotonicMs(),
        runtimeEpochId: this.#clock.runtimeEpochId(),
      };
      transaction.session.state = result.to;
      const event = this.#event(sessionId, eventType, attemptId, { reason }, attempt.resolution.monotonicMs);
      transaction.appendEvent(event);
      transaction.session.last_event_seq = event.seq;
    });
    return this.#store.loadSession(sessionId);
  }

  async #transition(sessionId, expectedRevision, command, attemptId, payload) {
    await this.#store.transact(sessionId, expectedRevision, (transaction) => {
      const result = transition(transaction.session.state, command);
      transaction.session.state = result.to;
      if (command === "startSession") transaction.session.started_at = payload.started_at;
      const event = this.#event(sessionId, result.event, attemptId, payload);
      transaction.appendEvent(event);
      transaction.session.last_event_seq = event.seq;
    });
    return this.#store.loadSession(sessionId);
  }

  #requireAttempt(session, attemptId) {
    if (!session.activeAttempt || session.activeAttempt.attemptId !== attemptId) {
      throw new ObservationRuntimeError("SESSION_NOT_FOUND", `Attempt not found: ${attemptId}`);
    }
    return session.activeAttempt;
  }

  async #resolveTrialRefs(probeId, trialId) {
    if (!this.#artifactProvider) {
      throw new ObservationRuntimeError("ARTIFACT_NOT_FOUND", "An artifact provider is required to arm a trial.");
    }
    const probe = await this.#artifactProvider.loadProbe(probeId);
    const trial = await this.#artifactProvider.loadTrial(trialId);
    if (!probe || !trial) throw new ObservationRuntimeError("ARTIFACT_NOT_FOUND", "Probe or trial was not found.");
    const stimuli = await Promise.all((trial.stimulus_ids ?? []).map((id) => this.#artifactProvider.loadStimulus(id)));
    if (stimuli.some((stimulus) => !stimulus)) throw new ObservationRuntimeError("ARTIFACT_NOT_FOUND", "A referenced stimulus was not found.");
    const ref = (artifact, artifactType, fallbackId) => ({ artifact_type: artifactType, artifact_id: artifact.artifact_id ?? fallbackId, sha256: artifact.sha256 });
    return {
      probe_ref: ref(probe, "behavioral_probe", probeId),
      trial_ref: ref(trial, "behavioral_trial", trialId),
      stimulus_refs: stimuli.map((stimulus, index) => ref(stimulus, "perceptual_stimulus", trial.stimulus_ids[index])),
    };
  }

  #event(sessionId, eventType, attemptId, payload, monotonicMs = this.#clock.nowMonotonicMs()) {
    return {
      event_schema_version: "0.1-draft",
      event_id: this.#uuid(),
      session_id: sessionId,
      event_type: eventType,
      wall_time: this.#clock.wallTimeRfc3339(),
      runtime_epoch_id: this.#clock.runtimeEpochId(),
      performance_time_origin_ms: this.#clock.performanceTimeOriginMs(),
      monotonic_ms: monotonicMs,
      attempt_id: attemptId,
      payload,
    };
  }
}
