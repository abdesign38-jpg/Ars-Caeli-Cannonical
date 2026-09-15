import test from "node:test";
import assert from "node:assert/strict";

import { systemClock } from "../src/clock.mjs";
import { createId } from "../src/ids.mjs";

test("clock separates monotonic timing from wall time and fixes one runtime epoch", () => {
  const clock = systemClock();
  assert.equal(typeof clock.nowMonotonicMs(), "number");
  assert.match(clock.wallTimeRfc3339(), /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(clock.runtimeEpochId(), clock.runtimeEpochId());
  assert.equal(typeof clock.performanceTimeOriginMs(), "number");
});

test("IDs use the supplied UUID source", () => {
  assert.equal(createId("event", () => "fixed"), "event-fixed");
});
