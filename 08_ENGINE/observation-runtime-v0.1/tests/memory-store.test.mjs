import test from "node:test";
import assert from "node:assert/strict";

import { ObservationRuntimeError } from "../src/errors.mjs";
import { MemoryStore } from "../src/storage/memory-store.mjs";

test("memory store commits session, journal, and projection atomically", async () => {
  const store = new MemoryStore();
  const session = await store.createSession({ sessionId: "session-1", state: "CREATED" });

  await store.transact(session.sessionId, session.revision, (transaction) => {
    transaction.session.state = "READY";
    transaction.appendEvent({ event_schema_version: "0.1-draft", event_id: "11111111-1111-4111-8111-111111111111", session_id: "session-1", event_type: "session_started", wall_time: "2026-09-15T12:00:00Z", runtime_epoch_id: "22222222-2222-4222-8222-222222222222", performance_time_origin_ms: 1, monotonic_ms: 1, attempt_id: null, payload: { started_at: "2026-09-15T12:00:00Z" } });
    transaction.setProjection({ observations: [] });
  });

  assert.deepEqual(await store.loadSession("session-1"), {
    sessionId: "session-1",
    state: "READY",
    revision: 1,
  });
  assert.deepEqual((await store.listEvents("session-1")).map(({ event_type, seq }) => ({ event_type, seq })), [
    { event_type: "session_started", seq: 0 },
  ]);
  assert.deepEqual(await store.loadProjection("session-1"), { observations: [] });
});

test("stale revisions fail closed", async () => {
  const store = new MemoryStore();
  const session = await store.createSession({ sessionId: "session-2", state: "CREATED" });
  await store.transact(session.sessionId, 0, (transaction) => {
    transaction.session.state = "READY";
  });

  await assert.rejects(
    () => store.transact(session.sessionId, 0, () => {}),
    (error) => error instanceof ObservationRuntimeError && error.code === "SESSION_CONFLICT",
  );
  assert.deepEqual(await store.listEvents("session-2"), []);
});

test("failed callbacks do not commit staged state or journal events", async () => {
  const store = new MemoryStore();
  const session = await store.createSession({ sessionId: "session-3", state: "CREATED" });

  await assert.rejects(() => store.transact(session.sessionId, 0, (transaction) => {
    transaction.session.state = "READY";
    transaction.appendEvent({ event_schema_version: "0.1-draft", event_id: "33333333-3333-4333-8333-333333333333", session_id: "session-3", event_type: "session_started", wall_time: "2026-09-15T12:00:00Z", runtime_epoch_id: "44444444-4444-4444-8444-444444444444", performance_time_origin_ms: 1, monotonic_ms: 1, attempt_id: null, payload: { started_at: "2026-09-15T12:00:00Z" } });
    throw new Error("transaction failed");
  }), /transaction failed/);

  assert.deepEqual(await store.loadSession("session-3"), {
    sessionId: "session-3",
    state: "CREATED",
    revision: 0,
  });
  assert.deepEqual(await store.listEvents("session-3"), []);
});

test("conflicting artifact snapshots fail before session commit", async () => {
  const store = new MemoryStore();
  const session = await store.createSession({ sessionId: "session-4", state: "CREATED" });
  const snapshot = { snapshot_schema_version: "0.1-draft", artifact_type: "behavioral_probe", artifact_id: "probe-1", canonical_schema_id: "https://example.test/probe", sha256: "a".repeat(64), document: { value: 1 } };
  await store.transact(session.sessionId, 0, (transaction) => transaction.saveArtifactSnapshot(snapshot));

  await assert.rejects(() => store.transact(session.sessionId, 1, (transaction) => {
    transaction.session.state = "READY";
    transaction.saveArtifactSnapshot({ ...snapshot, document: { value: 2 } });
  }), { code: "ARTIFACT_HASH_MISMATCH" });

  assert.equal((await store.loadSession(session.sessionId)).state, "CREATED");
  assert.equal((await store.loadSession(session.sessionId)).revision, 1);
});
