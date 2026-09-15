import test from "node:test";
import assert from "node:assert/strict";

import { ObservationRuntimeError } from "../src/errors.mjs";
import { Journal } from "../src/journal.mjs";

test("journal appends ordered immutable events and replays them", () => {
  const journal = new Journal();
  journal.append({ eventId: "evt-1", type: "session_created" });
  journal.append({ eventId: "evt-2", type: "session_started" });

  assert.deepEqual(journal.list().map(({ seq, type }) => ({ seq, type })), [
    { seq: 1, type: "session_created" },
    { seq: 2, type: "session_started" },
  ]);
  assert.equal(journal.replay((count) => count + 1, 0), 2);
});

test("journal rejects duplicate event IDs", () => {
  const journal = new Journal();
  journal.append({ eventId: "evt-1", type: "session_created" });

  assert.throws(
    () => journal.append({ eventId: "evt-1", type: "session_started" }),
    (error) => error instanceof ObservationRuntimeError && error.code === "DUPLICATE_RECORD_COMMIT",
  );
});

test("journal rejects malformed events", () => {
  assert.throws(
    () => new Journal().append({ eventId: "evt-1" }),
    (error) => error instanceof ObservationRuntimeError && error.code === "EVENT_INVALID",
  );
});
