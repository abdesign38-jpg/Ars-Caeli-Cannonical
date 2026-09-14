"use strict";

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

test("verified artifacts are deeply frozen", () => {
  const protocol = readJson(path.join(compiledRoot, "protocols", "pilot.void_x_response_crystallization.invisibilidad.v0_1.executable.json"));
  const condition = readJson(path.join(compiledRoot, "conditions", "C1_LOW_ASC.executable.json"));
  runtime.deepFreeze(protocol);
  runtime.deepFreeze(condition);
  assert.equal(Object.isFrozen(protocol.runtime_policy), true);
  assert.equal(Object.isFrozen(condition.runtime_schedule), true);
  assert.equal(Object.isFrozen(condition.runtime_schedule.gate_envelope), true);
  assert.throws(() => { condition.runtime_schedule.pattern = "seeded_irregular"; }, TypeError);
  assert.throws(() => { condition.signal.carrier.hz = 440; }, TypeError);
});

test("corrupt condition fingerprint fails closed", async () => {
  const protocol = readJson(path.join(compiledRoot, "protocols", "pilot.void_x_response_crystallization.invisibilidad.v0_1.executable.json"));
  const condition = readJson(path.join(compiledRoot, "conditions", "C1_LOW_ASC.executable.json"));
  condition.signal.carrier.hz = 440;
  await assert.rejects(() => runtime.verifyConditionFingerprint(condition, protocol.condition_fingerprints.C1_LOW_ASC), /AEON_EXECUTION_BLOCKED/);
});

test("telemetry rejects samples outside the exposure interval", () => {
  assert.equal(runtime.telemetryTimeInBlock(-0.001, 60), false);
  assert.equal(runtime.telemetryTimeInBlock(60, 60), false);
  assert.equal(runtime.telemetryTimeInBlock(59.999, 60), true);
});

test("boundary guard follows analyser window and gate boundaries", () => {
  const schedule = schedules.C1_LOW_ASC;
  assert.equal(runtime.boundaryGuardAt(schedule, 0, 21.333), true);
  assert.equal(runtime.boundaryGuardAt(schedule, 8, 21.333), true);
  assert.equal(runtime.boundaryGuardAt(schedule, 9, 21.333), false);
  assert.equal(runtime.boundaryGuardAt(schedule, 10, 21.333), true);
});

test("telemetry metrics separate RMS from peak/full-scale", () => {
  const metrics = runtime.rmsAndPeakDbfs(new Float32Array([0, 0.5, -1.0, 0.25]));
  assert.equal(metrics.peak_abs, 1);
  assert.equal(metrics.near_full_scale, true);
  assert.equal(metrics.above_nominal_full_scale, false);
  assert.ok(metrics.peak_dbfs > metrics.rms_dbfs);
});

test("telemetry status reports completeness policy", () => {
  assert.equal(runtime.classifyTelemetryStatus(2400, 2400, 100), "VALID");
  assert.equal(runtime.classifyTelemetryStatus(2000, 2400, 100), "PARTIAL");
  assert.equal(runtime.classifyTelemetryStatus(1000, 2400, 100), "INCOMPLETE");
  assert.equal(runtime.classifyTelemetryStatus(2400, 2400, 100, true), "FAILED");
});

test("unexpected context interruption and visibility loss invalidate exposure", () => {
  assert.equal(runtime.unexpectedContextState("interrupted", { conditionRunning: true }), true);
  assert.equal(runtime.unexpectedContextState("suspended", { conditionRunning: true, expectedSuspend: true }), false);
  assert.equal(runtime.unexpectedContextState("running", { conditionRunning: true }), false);
  assert.equal(runtime.visibilityInvalidatesProtocol("hidden", true), true);
  assert.equal(runtime.visibilityInvalidatesProtocol("visible", true), false);
});

test("protocol source contains exact onset and isolation guards", () => {
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  assert.match(app, /initializeProtocolAudioGraphExact/);
  assert.match(app, /if\(protocolRunning\(\)\)\{updateSignalMonitor\(\);return;\}/);
  const timerStart = app.indexOf("function updateTimer");
  const timerEnd = app.indexOf("async function handleProtocolTransport", timerStart);
  assert.ok(app.indexOf("function sampleProtocolTelemetry") < timerStart);
  assert.equal(app.slice(timerStart, timerEnd).includes("sampleProtocolTelemetry();"), false);
});

test("unsupported runtime rule fails closed", () => {
  const protocol = readJson(path.join(compiledRoot, "protocols", "pilot.void_x_response_crystallization.invisibilidad.v0_1.executable.json"));
  protocol.runtime_policy.manual_controls.carrier = "editable";
  assert.throws(() => runtime.assertExecutableProtocol(protocol), /AEON_EXECUTION_BLOCKED/);
});
