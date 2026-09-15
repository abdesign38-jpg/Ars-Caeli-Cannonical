import test from "node:test";
import assert from "node:assert/strict";

import { ObservationRuntimeError } from "../src/errors.mjs";
import { MemoryStore } from "../src/storage/memory-store.mjs";

test("memory store commits session, journal, and projection atomically", async () => {
  const store = new MemoryStore();
  const session = await store.createSession({ sessionId: "session-1", state: "CREATED" });

  await store.transact(session.sessionId, session.revision, (transaction) => {
    transaction.session.state = "READY";
    transaction.appendEvent({ eventId: "evt-1", type: "session_started" });
    transaction.setProjection({ observations: [] });
  });

  assert.deepEqual(await store.loadSession("session-1"), {
    sessionId: "session-1",
    state: "READY",
    revision: 1,
  });
  assert.deepEqual((await store.listEvents("session-1")).map(({ type, seq }) => ({ type, seq })), [
    { type: "session_started", seq: 1 },
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
    transaction.appendEvent({ eventId: "evt-failed", type: "session_started" });
    throw new Error("transaction failed");
  }), /transaction failed/);

  assert.deepEqual(await store.loadSession("session-3"), {
    sessionId: "session-3",
    state: "CREATED",
    revision: 0,
  });
  assert.deepEqual(await store.listEvents("session-3"), []);
});
