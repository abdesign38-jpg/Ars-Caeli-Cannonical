import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { IDBFactory, IDBKeyRange } from "fake-indexeddb";

import { ObservationRuntimeError } from "../src/errors.mjs";
import { IndexedDBStore } from "../src/storage/indexeddb-store.mjs";

let indexedDB;

beforeEach(() => {
  indexedDB = new IDBFactory();
});

async function createStore() {
  return IndexedDBStore.open({ indexedDB, IDBKeyRange });
}

test("IndexedDB store creates and loads a session", async () => {
  const store = await createStore();
  await store.createSession({ sessionId: "session-1", state: "CREATED" });
  assert.deepEqual(await store.loadSession("session-1"), { sessionId: "session-1", session_id: "session-1", state: "CREATED", last_event_seq: -1, revision: 0 });
});

test("IndexedDB transaction commits session, event, projection, and artifact", async () => {
  const store = await createStore();
  await store.createSession({ session_id: "session-2", state: "CREATED", last_event_seq: -1 });
  const event = { event_schema_version: "0.1-draft", event_id: "00000000-0000-4000-8000-000000000001", session_id: "session-2", seq: 0, event_type: "session_started", wall_time: "2026-09-15T12:00:00Z", runtime_epoch_id: "11111111-1111-4111-8111-111111111111", performance_time_origin_ms: 1, monotonic_ms: 1, attempt_id: null, payload: { started_at: "2026-09-15T12:00:00Z" } };
  const artifact = { snapshot_schema_version: "0.1-draft", artifact_type: "behavioral_probe", artifact_id: "probe-1", canonical_schema_id: "https://example.test/probe", sha256: "a".repeat(64), document: { schema_version: "0.2-draft" } };
  await store.transact("session-2", 0, (transaction) => {
    transaction.session.state = "READY";
    transaction.session.last_event_seq = 0;
    transaction.appendEvent(event);
    transaction.setProjection({ session_id: "session-2", behavioral_records: [] });
    transaction.saveArtifactSnapshot(artifact);
  });

  assert.equal((await store.loadSession("session-2")).revision, 1);
  assert.deepEqual((await store.listEvents("session-2")).map(({ seq }) => seq), [0]);
  assert.deepEqual(await store.loadProjection("session-2"), { session_id: "session-2", behavioral_records: [] });
  assert.deepEqual(await store.loadArtifactSnapshot(artifact.sha256), artifact);
});

test("IndexedDB rejects stale revisions without writing", async () => {
  const store = await createStore();
  await store.createSession({ session_id: "session-3", state: "CREATED" });
  await store.transact("session-3", 0, (transaction) => { transaction.session.state = "READY"; });

  await assert.rejects(() => store.transact("session-3", 0, () => {}), (error) => error instanceof ObservationRuntimeError && error.code === "SESSION_CONFLICT");
  assert.equal((await store.loadSession("session-3")).revision, 1);
});

test("failed callback leaves IndexedDB state unchanged", async () => {
  const store = await createStore();
  await store.createSession({ session_id: "session-4", state: "CREATED" });
  await assert.rejects(() => store.transact("session-4", 0, (transaction) => {
    transaction.session.state = "READY";
    throw new Error("injected failure");
  }), /injected failure/);
  assert.deepEqual(await store.loadSession("session-4"), { session_id: "session-4", state: "CREATED", last_event_seq: -1, revision: 0 });
});
