import { ObservationRuntimeError } from "../errors.mjs";
import { Journal } from "../journal.mjs";
import { ObservationStore } from "./observation-store.mjs";

const DATABASE_NAME = "aeon-observation-runtime-v0.1";
const DATABASE_VERSION = 1;
const STORE_NAMES = ["sessions", "events", "artifacts", "projections"];

function clone(value) {
  return structuredClone(value);
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
  });
}

export class IndexedDBStore extends ObservationStore {
  #db;
  #keyRange;

  constructor(db, keyRange = globalThis.IDBKeyRange) {
    super();
    this.#db = db;
    this.#keyRange = keyRange;
  }

  static async open({ indexedDB = globalThis.indexedDB, IDBKeyRange = globalThis.IDBKeyRange } = {}) {
    if (!indexedDB) throw new ObservationRuntimeError("STORE_TRANSACTION_FAILED", "IndexedDB is unavailable.");
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("sessions")) db.createObjectStore("sessions", { keyPath: "session_id" });
      if (!db.objectStoreNames.contains("events")) {
        const events = db.createObjectStore("events", { keyPath: ["session_id", "seq"] });
        events.createIndex("event_id", "event_id", { unique: true });
      }
      if (!db.objectStoreNames.contains("artifacts")) db.createObjectStore("artifacts", { keyPath: "sha256" });
      if (!db.objectStoreNames.contains("projections")) db.createObjectStore("projections", { keyPath: "session_id" });
    };
    const db = await requestResult(request);
    if (!IDBKeyRange) throw new ObservationRuntimeError("STORE_TRANSACTION_FAILED", "IndexedDB key ranges are unavailable.");
    return new IndexedDBStore(db, IDBKeyRange);
  }

  async createSession(session) {
    const sessionId = session?.session_id ?? session?.sessionId;
    if (!sessionId) throw new ObservationRuntimeError("SESSION_NOT_FOUND", "A session ID is required.");
    const persisted = {
      ...clone(session),
      session_id: sessionId,
      last_event_seq: session.last_event_seq ?? -1,
      revision: 0,
    };
    const transaction = this.#db.transaction(STORE_NAMES, "readwrite");
    transaction.objectStore("sessions").add(persisted);
    await transactionDone(transaction).catch((error) => {
      throw new ObservationRuntimeError("SESSION_CONFLICT", error.message);
    });
    return this.loadSession(sessionId);
  }

  async loadSession(sessionId) {
    const transaction = this.#db.transaction(["sessions"], "readonly");
    return clone(await requestResult(transaction.objectStore("sessions").get(sessionId)) ?? null);
  }

  async listEvents(sessionId) {
    const transaction = this.#db.transaction(["events"], "readonly");
    const request = transaction.objectStore("events").getAll(this.#keyRange.bound([sessionId, 0], [sessionId, Number.MAX_SAFE_INTEGER]));
    return clone(await requestResult(request));
  }

  async loadProjection(sessionId) {
    const transaction = this.#db.transaction(["projections"], "readonly");
    return clone(await requestResult(transaction.objectStore("projections").get(sessionId)) ?? null);
  }

  async loadArtifactSnapshot(sha256) {
    const transaction = this.#db.transaction(["artifacts"], "readonly");
    return clone(await requestResult(transaction.objectStore("artifacts").get(sha256)) ?? null);
  }

  async transact(sessionId, expectedRevision, callback) {
    const current = await this.loadSession(sessionId);
    if (!current) throw new ObservationRuntimeError("SESSION_NOT_FOUND", `Session not found: ${sessionId}`);
    if (current.revision !== expectedRevision) {
      throw new ObservationRuntimeError("SESSION_CONFLICT", `Expected revision ${expectedRevision}, found ${current.revision}.`, { expectedRevision, actualRevision: current.revision }, true);
    }

    const draft = {
      session: clone(current),
      journal: new Journal(),
      projection: await this.loadProjection(sessionId),
      artifacts: [],
    };
    for (const event of await this.listEvents(sessionId)) draft.journal.append(event);
    const transactionDraft = {
      session: draft.session,
      journal: draft.journal,
      projection: draft.projection,
      appendEvent: (event) => draft.journal.append(event),
      setProjection: (projection) => { draft.projection = clone(projection); },
      saveArtifactSnapshot: (snapshot) => { draft.artifacts.push(clone(snapshot)); },
    };
    const result = await callback(transactionDraft);
    draft.session.revision += 1;

    const stores = STORE_NAMES;
    const transaction = this.#db.transaction(stores, "readwrite", { durability: "strict" });
    const sessionStore = transaction.objectStore("sessions");
    let conflict = false;
    const sessionRequest = sessionStore.get(sessionId);
    sessionRequest.onsuccess = () => {
      const storedSession = sessionRequest.result;
      if (!storedSession || storedSession.revision !== expectedRevision) {
        conflict = true;
        transaction.abort();
        return;
      }
      sessionStore.put(clone({ ...draft.session, session_id: sessionId }));
      const eventStore = transaction.objectStore("events");
      for (const event of draft.journal.list().slice(current.last_event_seq + 1)) eventStore.add(clone(event));
      if (draft.projection) transaction.objectStore("projections").put(clone({ ...draft.projection, session_id: sessionId }));
      for (const snapshot of draft.artifacts) transaction.objectStore("artifacts").put(clone(snapshot));
    };
    sessionRequest.onerror = () => transaction.abort();
    await transactionDone(transaction).catch((error) => {
      if (conflict) throw new ObservationRuntimeError("SESSION_CONFLICT", "Session revision changed during transaction.", {}, true);
      throw new ObservationRuntimeError("STORE_TRANSACTION_FAILED", error.message, {}, true);
    });
    return result ?? clone(draft.session);
  }
}

export { DATABASE_NAME, DATABASE_VERSION };
