import { ObservationRuntimeError } from "../errors.mjs";
import { Journal } from "../journal.mjs";
import { ObservationStore } from "./observation-store.mjs";

function clone(value) {
  return structuredClone(value);
}

export class MemoryStore extends ObservationStore {
  #sessions = new Map();

  async createSession(session) {
    if (!session?.sessionId) {
      throw new ObservationRuntimeError("SESSION_NOT_FOUND", "A session ID is required.");
    }
    if (this.#sessions.has(session.sessionId)) {
      throw new ObservationRuntimeError("SESSION_CONFLICT", `Session already exists: ${session.sessionId}`);
    }
    this.#sessions.set(session.sessionId, {
      session: { ...clone(session), revision: 0 },
      journal: new Journal(),
      projection: null,
    });
    return this.loadSession(session.sessionId);
  }

  async loadSession(sessionId) {
    const record = this.#sessions.get(sessionId);
    return record ? clone(record.session) : null;
  }

  async listEvents(sessionId) {
    return this.#sessions.get(sessionId)?.journal.list() ?? [];
  }

  async loadProjection(sessionId) {
    const projection = this.#sessions.get(sessionId)?.projection;
    return projection === undefined ? null : clone(projection);
  }

  async transact(sessionId, expectedRevision, callback) {
    const current = this.#sessions.get(sessionId);
    if (!current) {
      throw new ObservationRuntimeError("SESSION_NOT_FOUND", `Session not found: ${sessionId}`);
    }
    if (current.session.revision !== expectedRevision) {
      throw new ObservationRuntimeError(
        "SESSION_CONFLICT",
        `Expected revision ${expectedRevision}, found ${current.session.revision}.`,
        { expectedRevision, actualRevision: current.session.revision },
        true,
      );
    }

    const draft = {
      session: clone(current.session),
      journal: current.journal.clone(),
      projection: current.projection === null ? null : clone(current.projection),
    };
    const transaction = {
      session: draft.session,
      journal: draft.journal,
      projection: draft.projection,
      appendEvent: (event) => draft.journal.append(event),
      setProjection: (projection) => {
        draft.projection = clone(projection);
      },
    };

    const result = await callback(transaction);
    draft.session.revision += 1;
    this.#sessions.set(sessionId, draft);
    return result ?? clone(draft.session);
  }
}
