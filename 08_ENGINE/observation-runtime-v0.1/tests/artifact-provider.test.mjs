import test from "node:test";
import assert from "node:assert/strict";

import { createArtifactProvider } from "../src/artifact-provider.mjs";

const probe = {
  schema_version: "0.2-draft",
  probe_id: "probe-1",
  evidence_role: "experimental_operationalization",
  choices: [{ choice_id: "left" }, { choice_id: "right" }],
};
const trial = {
  schema_version: "0.2-draft",
  trial_id: "trial-1",
  probe_id: "probe-1",
  presentations: [{ slot: 0 }, { slot: 1 }],
  stimulus_ids: ["stimulus-1"],
};
const stimulus = { schema_version: "0.2-draft", stimulus_id: "stimulus-1" };

function provider() {
  return createArtifactProvider({
    loadProbe: async () => probe,
    loadTrial: async () => trial,
    loadStimulus: async () => stimulus,
  });
}

test("validates and hashes D.0 artifacts before returning snapshots", async () => {
  const artifact = await provider().loadProbe("probe-1");
  assert.equal(artifact.artifact_id, "probe-1");
  assert.equal(artifact.artifact_type, "behavioral_probe");
  assert.match(artifact.sha256, /^[0-9a-f]{64}$/);
  assert.equal(artifact.document.schema_version, "0.2-draft");
});

test("rejects unsupported versions and stale supplied hashes", async () => {
  await assert.rejects(
    () => createArtifactProvider({ loadProbe: async () => ({ ...probe, schema_version: "0.1" }) }).loadProbe("probe-1"),
    { code: "ARTIFACT_UNSUPPORTED_VERSION" },
  );
  await assert.rejects(
    () => createArtifactProvider({ loadProbe: async () => ({ document: probe, sha256: "0".repeat(64) }) }).loadProbe("probe-1"),
    { code: "ARTIFACT_HASH_MISMATCH" },
  );
});

test("preserves wrapped Trial documents for stimulus resolution", async () => {
  const wrapped = createArtifactProvider({
    loadTrial: async () => ({
      document: {
        schema_version: "0.2-draft",
        trial_id: "trial-wrapped",
        probe_id: "probe-1",
        presentations: [{ slot: 0, stimulus_ref: "stimulus-a" }, { slot: 1, stimulus_ref: "stimulus-b" }],
      },
    }),
  });
  const artifact = await wrapped.loadTrial("trial-wrapped");
  assert.equal(artifact.document.presentations[1].stimulus_ref, "stimulus-b");
  assert.match(artifact.sha256, /^[0-9a-f]{64}$/);
});
