import test from "node:test";
import assert from "node:assert/strict";

import { validateRuntimeEvent } from "../src/runtime-event-validator.mjs";

const baseEvent = {
  event_schema_version: "0.1-draft",
  event_id: "11111111-1111-4111-8111-111111111111",
  session_id: "session-1",
  seq: 0,
  event_type: "session_started",
  wall_time: "2026-09-15T12:00:00Z",
  runtime_epoch_id: "22222222-2222-4222-8222-222222222222",
  performance_time_origin_ms: 1,
  monotonic_ms: 1,
  attempt_id: null,
  payload: { started_at: "2026-09-15T12:00:00Z" },
};

test("accepts a canonical session event", () => {
  assert.equal(validateRuntimeEvent(baseEvent), baseEvent);
});

test("rejects invalid event identity and payload boundaries", () => {
  assert.throws(() => validateRuntimeEvent({ ...baseEvent, event_id: "not-a-uuid" }), { code: "EVENT_SCHEMA_INVALID" });
  assert.throws(() => validateRuntimeEvent({ ...baseEvent, event_type: "response_timeout", attempt_id: null }), { code: "EVENT_SCHEMA_INVALID" });
});