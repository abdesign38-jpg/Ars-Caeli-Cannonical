import test from "node:test";
import assert from "node:assert/strict";

import { ObservationRuntimeError } from "../src/errors.mjs";
import { Journal } from "../src/journal.mjs";

const event = (event_id, event_type) => ({
  event_schema_version: "0.1-draft",
  event_id,
  session_id: "session-1",
  event_type,
  wall_time: "2026-09-15T12:00:00Z",
  runtime_epoch_id: "11111111-1111-4111-8111-111111111111",
  performance_time_origin_ms: 1,
  monotonic_ms: 1,
  attempt_id: null,
  payload: { started_at: "2026-09-15T12:00:00Z" },
});

test("journal appends ordered immutable events and replays them", () => {
  const journal = new Journal();
  journal.append(event("11111111-1111-4111-8111-111111111111", "session_started"));
  journal.append(event("22222222-2222-4222-8222-222222222222", "session_started"));

  assert.deepEqual(journal.list().map(({ seq, event_type }) => ({ seq, event_type })), [
    { seq: 0, event_type: "session_started" },
    { seq: 1, event_type: "session_started" },
  ]);
  assert.equal(journal.replay((count) => count + 1, 0), 2);
});

test("journal rejects duplicate event IDs", () => {
  const journal = new Journal();
  journal.append(event("11111111-1111-4111-8111-111111111111", "session_started"));

  assert.throws(
    () => journal.append(event("11111111-1111-4111-8111-111111111111", "session_started")),
    (error) => error instanceof ObservationRuntimeError && error.code === "DUPLICATE_RECORD_COMMIT",
  );
});

test("journal rejects malformed events", () => {
  assert.throws(
    () => new Journal().append({ event_id: "11111111-1111-4111-8111-111111111111" }),
    (error) => error instanceof ObservationRuntimeError && error.code === "EVENT_INVALID",
  );
});
