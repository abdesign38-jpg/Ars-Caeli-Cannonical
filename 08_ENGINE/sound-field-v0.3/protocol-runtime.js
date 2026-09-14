(() => {
  "use strict";

  const SUPPORTED_COMPILER_VERSION = "0.1";
  const REQUIRED_CONDITION_IDS = [
    "C1_LOW_ASC",
    "C2_MED_ASC",
    "C3_HIGH",
    "C4_MED_DESC",
    "C5_LOW_DESC"
  ];
  const INTEGRITY_FAILURE_DISPOSITIONS = Object.freeze({
    stimulus_integrity: "ABORT_CONDITION",
    telemetry_integrity: "CONTINUE_STIMULUS"
  });

  function canonicalize(value) {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.keys(value).sort().map(key => [key, canonicalize(value[key])])
      );
    }
    return value;
  }

  function canonicalJson(value) {
    return JSON.stringify(canonicalize(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.getOwnPropertyNames(value).forEach(key => deepFreeze(value[key]));
    return Object.freeze(value);
  }

  async function sha256Hex(value) {
    if (!window.crypto?.subtle) {
      throw new Error("AEON_EXECUTION_BLOCKED: Web Crypto API unavailable");
    }
    const bytes = new TextEncoder().encode(canonicalJson(value));
    const hash = await window.crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(hash)]
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function executionError(message, details = {}) {
    const error = new Error(`AEON_EXECUTION_BLOCKED: ${message}`);
    Object.assign(error, details);
    return error;
  }

  function isFiniteNonNegativeNumber(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
  }

  function integrityFailureDisposition(kind) {
    const disposition = INTEGRITY_FAILURE_DISPOSITIONS[kind];
    if (!disposition) throw executionError(`unsupported integrity kind: ${kind}`);
    return disposition;
  }

  function completedConditionTiming({ blockDurationS, pauses = [], lifecycleWallS = null } = {}) {
    if (!isFiniteNonNegativeNumber(blockDurationS)) throw executionError("invalid completed-condition block duration");
    let pauseWallS = 0;
    for (const pause of pauses) {
      if (!isFiniteNonNegativeNumber(pause?.wall_duration_ms)) throw executionError("invalid pause wall duration");
      pauseWallS += pause.wall_duration_ms / 1000;
    }
    return {
      protocol_active_exposure_s: blockDurationS,
      protocol_pause_wall_s: pauseWallS,
      protocol_wall_duration_s: blockDurationS + pauseWallS,
      attempt_lifecycle_wall_s: isFiniteNonNegativeNumber(lifecycleWallS) ? lifecycleWallS : null
    };
  }

  function protocolDurationTotals(conditionRecords = []) {
    const completed = conditionRecords.filter(record => record?.condition_status === "COMPLETED");
    const active = completed.filter(record => isFiniteNonNegativeNumber(record.protocol_active_exposure_s));
    const wall = completed.filter(record => isFiniteNonNegativeNumber(record.protocol_wall_duration_s));
    const complete = completed.length > 0 && active.length === completed.length && wall.length === completed.length;
    return {
      completed_condition_count: completed.length,
      active_duration_record_count: active.length,
      wall_duration_record_count: wall.length,
      protocol_active_exposure_s: complete ? active.reduce((sum, record) => sum + record.protocol_active_exposure_s, 0) : null,
      protocol_wall_duration_s: complete ? wall.reduce((sum, record) => sum + record.protocol_wall_duration_s, 0) : null,
      duration_integrity: complete ? "COMPLETE" : "INCOMPLETE"
    };
  }

  function aggregateTelemetryIntegrity(statuses = []) {
    const order = ["FAILED", "INCOMPLETE", "PARTIAL", "VALID", "PENDING"];
    return statuses.reduce((worst, status) => order.indexOf(status) < order.indexOf(worst) ? status : worst, "PENDING");
  }

  function assertSignal(signal) {
    if (!signal || signal.carrier?.hz !== 432 || signal.carrier?.key !== "method_432") {
      throw executionError("unsupported compiled carrier");
    }
    if (signal.modulation?.hz !== 8 || signal.modulation?.key !== "alpha_8") {
      throw executionError("unsupported compiled modulation");
    }
    if (signal.harmonic_b_rule !== "2x_carrier") {
      throw executionError("unsupported harmonic rule");
    }
    if (Number(signal.environmental_breath_hz) !== 0.073) {
      throw executionError("unsupported environmental breath");
    }
  }

  function assertRuntimePolicy(policy) {
    const expected = {
      condition_clock: "active_exposure_only",
      cycle_reset: "at_each_condition_start",
      pause: {
        allowed: true,
        clock_behavior: "freeze_condition_clock",
        audio_behavior: "silence",
        resume_behavior: "continue_same_condition_time",
        record_pause_duration: true
      },
      between_conditions: {
        audio_state: "silence",
        next_condition_trigger: "required_probe_saved_or_skipped",
        gap_duration_policy: "participant_contingent_record_actual"
      },
      baseline: { probe_trigger: "before_first_condition", audio_state: "silence" },
      post_exposure: { audio_state: "silence", immediate_post_trigger: "final_condition_end" },
      recovery: { audio_state: "silence", clock_anchor: "final_condition_end", probe_offsets_s: [60, 180] },
      manual_controls: {
        carrier: "locked",
        modulation: "locked",
        void_schedule: "locked",
        gate_envelope: "locked",
        aeon_master_gain: "locked_at_protocol_start"
      },
      integrity_breach_policy: "abort_condition_and_mark_series_invalid"
    };
    if (canonicalJson(policy) !== canonicalJson(expected)) {
      throw executionError("runtime policy mismatch");
    }
  }

  function assertExecutableCondition(condition) {
    if (!condition || condition.execution_status !== "validated") {
      throw executionError("condition is not validated");
    }
    if (condition.compiler_version !== SUPPORTED_COMPILER_VERSION || !condition.condition_id) {
      throw executionError("unsupported condition compiler or ID");
    }
    assertSignal(condition.signal);
    const schedule = condition.runtime_schedule;
    if (!schedule || schedule.pattern !== "fixed_periodic") {
      throw executionError("unsupported schedule");
    }
    if (schedule.cycle_order !== "active_then_silence" || schedule.cycle_anchor !== "condition_start" || Number(schedule.phase_offset_s) !== 0) {
      throw executionError("unsupported cycle semantics");
    }
    const ramp = Number(schedule.gate_envelope?.ramp_ms) / 1000;
    if (!(ramp > 0 && ramp < schedule.active_duration_s && ramp < schedule.silent_duration_s)) {
      throw executionError("invalid gate ramp");
    }
    if (!Number.isInteger(schedule.whole_cycles) || schedule.whole_cycles < 1) {
      throw executionError("invalid whole-cycle count");
    }
    return condition;
  }

  function assertExecutableProtocol(protocol) {
    if (!protocol || protocol.execution_status !== "validated") {
      throw executionError("protocol is not validated");
    }
    if (protocol.compiler_version !== SUPPORTED_COMPILER_VERSION || !protocol.protocol_id) {
      throw executionError("unsupported protocol compiler or ID");
    }
    if (!Array.isArray(protocol.condition_sequence) || protocol.condition_sequence.length !== REQUIRED_CONDITION_IDS.length || protocol.condition_sequence.some((id, index) => id !== REQUIRED_CONDITION_IDS[index])) {
      throw executionError("unsupported condition sequence");
    }
    if (!protocol.controlled_signal) throw executionError("missing controlled signal");
    assertSignal(protocol.controlled_signal);
    assertRuntimePolicy(protocol.runtime_policy);
    return protocol;
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw executionError(`artifact fetch failed (${response.status})`, { url });
    return response.json();
  }

  async function loadCompiledProtocol(url) {
    return assertExecutableProtocol(await fetchJson(url));
  }

  async function loadCompiledCondition(url) {
    return assertExecutableCondition(await fetchJson(url));
  }

  async function verifyConditionFingerprint(condition, expectedHash) {
    const actual = await sha256Hex(condition);
    if (actual !== expectedHash) {
      throw executionError("condition fingerprint mismatch", { expected: expectedHash, actual });
    }
    return actual;
  }

  async function loadAndVerifyArtifacts(baseUrl) {
    const protocol = await loadCompiledProtocol(`${baseUrl}/protocols/pilot.void_x_response_crystallization.invisibilidad.v0_1.executable.json`);
    const conditions = new Map();
    for (const conditionId of protocol.condition_sequence) {
      const condition = await loadCompiledCondition(`${baseUrl}/conditions/${conditionId}.executable.json`);
      await verifyConditionFingerprint(condition, protocol.condition_fingerprints[conditionId]);
      conditions.set(conditionId, deepFreeze(condition));
    }
    return { protocol: deepFreeze(protocol), conditions };
  }

  function scheduledStateAt(schedule, conditionTimeS) {
    const t = Number(conditionTimeS);
    if (!(t >= 0) || t >= schedule.block_duration_s) return "SILENT";
    const cycleTime = (t + schedule.phase_offset_s) % schedule.cycle_duration_s;
    return cycleTime < schedule.active_duration_s ? "ACTIVE" : "SILENT";
  }

  function inGateRampWindow(schedule, conditionTimeS) {
    const t = Number(conditionTimeS);
    if (!(t >= 0) || t >= schedule.block_duration_s) return false;
    const ramp = schedule.gate_envelope.ramp_ms / 1000;
    const cycleTime = (t + schedule.phase_offset_s) % schedule.cycle_duration_s;
    return (cycleTime < ramp) || (cycleTime >= schedule.active_duration_s && cycleTime < schedule.active_duration_s + ramp);
  }

  function boundaryGuardAt(schedule, conditionTimeS, analysisWindowMs) {
    const t = Number(conditionTimeS);
    if (!(t >= 0) || t >= schedule.block_duration_s) return false;
    const guardS = Math.max(50, schedule.gate_envelope.ramp_ms + Number(analysisWindowMs || 0)) / 1000;
    const cycleTime = (t + schedule.phase_offset_s) % schedule.cycle_duration_s;
    return cycleTime < guardS ||
      Math.abs(cycleTime - schedule.active_duration_s) < guardS ||
      cycleTime > schedule.cycle_duration_s - guardS;
  }

  function telemetryTimeInBlock(rawTime, blockDurationS) {
    return rawTime != null && rawTime >= 0 && rawTime < blockDurationS;
  }

  function classifyTelemetryStatus(sampleCount, expectedSampleCount, steadyStateSampleCount, readFailed = false) {
    if (readFailed) return "FAILED";
    const completeness = expectedSampleCount > 0 ? sampleCount / expectedSampleCount : 0;
    if (completeness >= 0.95 && steadyStateSampleCount > 0) return "VALID";
    if (completeness >= 0.80) return "PARTIAL";
    return "INCOMPLETE";
  }

  function unexpectedContextState(state, { conditionRunning, expectedSuspend = false, expectedClose = false } = {}) {
    if (!conditionRunning) return false;
    if (state === "running") return false;
    if (state === "suspended" && expectedSuspend) return false;
    if (state === "closed" && expectedClose) return false;
    return true;
  }

  function visibilityInvalidatesProtocol(visibilityState, conditionRunning) {
    return conditionRunning && visibilityState === "hidden";
  }

  function rmsAndPeakDbfs(floatData) {
    let sum = 0;
    let peakAbs = 0;
    for (const sample of floatData) {
      sum += sample * sample;
      peakAbs = Math.max(peakAbs, Math.abs(sample));
    }
    const rms = Math.sqrt(sum / Math.max(floatData.length, 1));
    return {
      rms_dbfs: 20 * Math.log10(Math.max(rms, 1e-8)),
      peak_abs: peakAbs,
      peak_dbfs: 20 * Math.log10(Math.max(peakAbs, 1e-8)),
      near_full_scale: peakAbs >= 0.98,
      above_nominal_full_scale: peakAbs > 1.0
    };
  }

  function scheduleFixedPeriodicGate(gainParam, schedule, startAt) {
    const ramp = schedule.gate_envelope.ramp_ms / 1000;
    if (!(ramp > 0 && ramp < schedule.active_duration_s && ramp < schedule.silent_duration_s)) {
      throw executionError("invalid gate ramp");
    }
    const activeGain = schedule.gate_envelope.active_gain;
    const silentGain = schedule.gate_envelope.silent_gain;
    gainParam.cancelScheduledValues(startAt);
    gainParam.setValueAtTime(silentGain, startAt);
    for (let index = 0; index < schedule.whole_cycles; index += 1) {
      const cycleStart = startAt + index * schedule.cycle_duration_s;
      const activeEnd = cycleStart + schedule.active_duration_s;
      gainParam.setValueAtTime(silentGain, cycleStart);
      gainParam.linearRampToValueAtTime(activeGain, cycleStart + ramp);
      gainParam.setValueAtTime(activeGain, activeEnd);
      gainParam.linearRampToValueAtTime(silentGain, activeEnd + ramp);
    }
    gainParam.setValueAtTime(silentGain, startAt + schedule.block_duration_s);
  }

  function rmsDbfs(floatData) {
    let sum = 0;
    for (const sample of floatData) sum += sample * sample;
    const rms = Math.sqrt(sum / Math.max(floatData.length, 1));
    return 20 * Math.log10(Math.max(rms, 1e-8));
  }

  window.AEONProtocolRuntime = {
    canonicalize,
    canonicalJson,
    deepFreeze,
    isFiniteNonNegativeNumber,
    integrityFailureDisposition,
    completedConditionTiming,
    protocolDurationTotals,
    aggregateTelemetryIntegrity,
    sha256Hex,
    loadCompiledProtocol,
    loadCompiledCondition,
    loadAndVerifyArtifacts,
    assertExecutableProtocol,
    assertExecutableCondition,
    verifyConditionFingerprint,
    scheduledStateAt,
    inGateRampWindow,
    boundaryGuardAt,
    telemetryTimeInBlock,
    classifyTelemetryStatus,
    unexpectedContextState,
    visibilityInvalidatesProtocol,
    scheduleFixedPeriodicGate,
    rmsDbfs,
    rmsAndPeakDbfs,
    REQUIRED_CONDITION_IDS
  };
})();
