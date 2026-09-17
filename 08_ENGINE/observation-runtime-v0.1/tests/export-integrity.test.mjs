import test from "node:test";
import assert from "node:assert/strict";

import { ObservationRuntime } from "../src/observation-runtime.mjs";
import { hashCanonical } from "../src/export/session-export.mjs";
import { MemoryStore } from "../src/storage/memory-store.mjs";

const UUIDS = [
  "90000000-0000-4000-8000-000000000001",
  "90000000-0000-4000-8000-000000000002",
  "90000000-0000-4000-8000-000000000003",
  "90000000-0000-4000-8000-000000000004",
];

function runtime(store) {
  const uuids = [...UUIDS];
  return new ObservationRuntime({
    store,
    uuid: () => uuids.shift(),
    clock: {
      nowMonotonicMs: () => 1,
      wallTimeRfc3339: () => "2026-09-15T12:00:00.000Z",
      performanceTimeOriginMs: () => 1000,
      runtimeEpochId: () => "a0000000-0000-4000-8000-000000000001",
    },
  });
}

test("exports and verifies an untampered session bundle", async () => {
  const store = new MemoryStore();
  const instance = runtime(store);
  const created = await instance.createSession({ sessionId: "session-export", seriesId: "series-1", participantId: "participant-1", protocolId: "protocol-1" });
  await instance.startSession({ sessionId: "session-export", expectedRevision: created.revision });

  const bundle = await instance.exportSession({ sessionId: "session-export" });
  const verified = await ObservationRuntime.verifyImport(bundle);
  assert.equal(verified.export_schema_version, "0.1-draft");
  assert.equal(verified.session.session_id, "session-export");
  assert.equal(verified.manifest.canonicalization, "RFC8785-JCS");
});

test("rejects tampered components and replay divergence", async () => {
  const store = new MemoryStore();
  const instance = runtime(store);
  const created = await instance.createSession({ sessionId: "session-tamper", seriesId: "series-1", participantId: "participant-1", protocolId: "protocol-1" });
  await instance.startSession({ sessionId: "session-tamper", expectedRevision: created.revision });
  const bundle = await instance.exportSession({ sessionId: "session-tamper" });

  const tamperedHash = structuredClone(bundle);
  tamperedHash.session.protocol_id = "changed";
  await assert.rejects(() => ObservationRuntime.verifyImport(tamperedHash), { code: "EXPORT_HASH_MISMATCH" });

  const tamperedReplay = structuredClone(bundle);
  tamperedReplay.response_series.observations.push({ timestamp_s: 1, timing_point: "post_trial", condition_id: null, responses: {}, status: "participant_reported" });
  tamperedReplay.manifest.response_series_sha256 = await hashCanonical(tamperedReplay.response_series);
  await assert.rejects(() => ObservationRuntime.verifyImport(tamperedReplay), { code: "EXPORT_REPLAY_MISMATCH" });
});
