const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

const root = path.resolve(__dirname, "..");
const runtimeSource = fs.readFileSync(path.join(root, "protocol-runtime.js"), "utf8");
const context = { window: { crypto: webcrypto }, TextEncoder, fetch };
vm.runInNewContext(runtimeSource, context);
const runtime = context.window.AEONProtocolRuntime;
const compiledRoot = path.resolve(root, "..", "experimental-protocol-model", "v0.1", "compiled");
const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));

const schedules = {
  C1_LOW_ASC: { block_duration_s: 60, cycle_duration_s: 10, active_duration_s: 8, silent_duration_s: 2, phase_offset_s: 0, gate_envelope: { ramp_ms: 20 } },
  C2_MED_ASC: { block_duration_s: 60, cycle_duration_s: 10, active_duration_s: 5, silent_duration_s: 5, phase_offset_s: 0, gate_envelope: { ramp_ms: 20 } },
  C3_HIGH: { block_duration_s: 60, cycle_duration_s: 10, active_duration_s: 2, silent_duration_s: 8, phase_offset_s: 0, gate_envelope: { ramp_ms: 20 } }
};

test("gate timeline vectors match logical schedule", () => {
  const vectors = readJson(path.join(__dirname, "gate-timeline.v0.1.json"));
  for (const [conditionId, vector] of Object.entries(vectors.conditions)) {
    const schedule = schedules[conditionId];
    for (const point of vector.points) {
      assert.equal(runtime.scheduledStateAt(schedule, point.t), point.state, `${conditionId} at ${point.t}`);
      if (point.ramp !== undefined) assert.equal(runtime.inGateRampWindow(schedule, point.t), point.ramp, `${conditionId} ramp at ${point.t}`);
    }
  }
});

test("compiled Pilot 01 condition fingerprints verify", async () => {
  const protocol = readJson(path.join(compiledRoot, "protocols", "pilot.void_x_response_crystallization.invisibilidad.v0_1.executable.json"));
  runtime.assertExecutableProtocol(protocol);
  for (const conditionId of protocol.condition_sequence) {
    const condition = readJson(path.join(compiledRoot, "conditions", `${conditionId}.executable.json`));
    runtime.assertExecutableCondition(condition);
    assert.equal(await runtime.verifyConditionFingerprint(condition, protocol.condition_fingerprints[conditionId]), protocol.condition_fingerprints[conditionId]);
  }
});

test("unsupported runtime rule fails closed", () => {
  const protocol = readJson(path.join(compiledRoot, "protocols", "pilot.void_x_response_crystallization.invisibilidad.v0_1.executable.json"));
  protocol.runtime_policy.manual_controls.carrier = "editable";
  assert.throws(() => runtime.assertExecutableProtocol(protocol), /AEON_EXECUTION_BLOCKED/);
});
