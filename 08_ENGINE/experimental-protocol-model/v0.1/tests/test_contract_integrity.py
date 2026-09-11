from __future__ import annotations

import copy
import json
from pathlib import Path

import pytest

from semantic_validator import (
    ReferenceDuplicateError,
    SemanticValidationError,
    ensure_semantically_valid,
    recompute_fixed_periodic,
    validate_condition_semantics,
    validate_protocol_semantics,
)
import adapters
from adapters import (
    createResponseSeries,
    loadCrystallizationProfile,
    loadExecutableStimulusCondition,
    loadProbeSet,
    loadStimulusCondition,
    loadWoundProfile,
)
from validator import validate_instance, validate_examples

PACKAGE_ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = PACKAGE_ROOT / "examples"

def read(name):
    return json.loads((EXAMPLES / name).read_text(encoding="utf-8"))

def find_condition(cid):
    matches=[]
    for p in EXAMPLES.glob("*.stimulus-condition.json"):
        v=json.loads(p.read_text(encoding="utf-8"))
        if v["condition_id"]==cid:
            matches.append(v)
    if len(matches)!=1:
        raise LookupError(f"condition {cid} resolved {len(matches)} times")
    return matches[0]

def find_wound(wid):
    for p in EXAMPLES.glob("*.wound-profile.json"):
        v=json.loads(p.read_text(encoding="utf-8"))
        if v["wound_id"]==wid:
            return v
    raise LookupError(wid)

def find_crystal(cid):
    for p in EXAMPLES.glob("*.crystallization-profile.json"):
        v=json.loads(p.read_text(encoding="utf-8"))
        if v["crystallization_id"]==cid:
            return v
    raise LookupError(cid)

def find_probe(pid):
    for p in EXAMPLES.glob("*.observation-probe.json"):
        v=json.loads(p.read_text(encoding="utf-8"))
        if v["probe_set_id"]==pid:
            return v
    raise LookupError(pid)

def codes(issues):
    return {x.code for x in issues}

def test_pilot_void_profiles_recompute_exactly():
    expected={
        "void-low.profile.json": .2,
        "void-medium.profile.json": .5,
        "void-high.profile.json": .8,
    }
    for name, ratio in expected.items():
        calc=recompute_fixed_periodic(read(name))
        assert calc["silence_ratio"] == pytest.approx(ratio)
        assert calc["event_rate_per_min"] == pytest.approx(6)
        assert calc["whole_cycles"] == 6

def test_cycle_mismatch_is_blocked():
    c=copy.deepcopy(find_condition("C1_LOW_ASC"))
    c["void_profile"]["schedule"]["active_duration_s"]=9
    issues=validate_condition_semantics(c, executable=True)
    assert "VOID_CYCLE_MISMATCH" in codes(issues)

def test_false_derived_silence_ratio_is_blocked():
    c=copy.deepcopy(find_condition("C1_LOW_ASC"))
    c["void_profile"]["derived_schedule_metrics"]["silence_ratio"]=.9
    issues=validate_condition_semantics(c, executable=True)
    assert "VOID_SILENCE_RATIO_MISMATCH" in codes(issues)

def test_false_event_rate_is_blocked():
    c=copy.deepcopy(find_condition("C1_LOW_ASC"))
    c["void_profile"]["derived_schedule_metrics"]["event_rate_per_min"]=12
    issues=validate_condition_semantics(c, executable=True)
    assert "VOID_EVENT_RATE_MISMATCH" in codes(issues)

def test_manipulated_ratio_must_match_schedule():
    c=copy.deepcopy(find_condition("C1_LOW_ASC"))
    c["manipulated_variables"][0]["value"]=.5
    issues=validate_condition_semantics(c, executable=True)
    assert "CONDITION_MANIPULATION_MISMATCH" in codes(issues)

def test_held_carrier_cannot_disagree_with_signal():
    c=copy.deepcopy(find_condition("C1_LOW_ASC"))
    c["held_constant"]["carrier_hz"]=174
    issues=validate_condition_semantics(c, executable=True)
    assert "CONDITION_HELD_CONSTANT_MISMATCH" in codes(issues)

def test_exposure_must_equal_void_block():
    c=copy.deepcopy(find_condition("C1_LOW_ASC"))
    c["timing"]["exposure_s"]=30
    issues=validate_condition_semantics(c, executable=True)
    assert "CONDITION_EXPOSURE_MISMATCH" in codes(issues)

def test_non_fixed_pattern_not_executable():
    c=copy.deepcopy(find_condition("C1_LOW_ASC"))
    c["void_profile"]["schedule"]["pattern"]="seeded_irregular"
    c["void_profile"]["schedule"]["seed"]=42
    issues=validate_condition_semantics(c, executable=True)
    assert "UNSUPPORTED_EXECUTION_PATTERN" in codes(issues)

def test_missing_wound_reference_is_blocked():
    c=copy.deepcopy(find_condition("C1_LOW_ASC"))
    c["hypothesis_refs"]["wound_profile_id"]="does_not_exist"
    issues=validate_condition_semantics(
        c, resolve_wound=find_wound, resolve_crystallization=find_crystal, executable=True
    )
    assert "REFERENCE_NOT_FOUND" in codes(issues)

def test_ensure_semantically_valid_raises():
    c=copy.deepcopy(find_condition("C1_LOW_ASC"))
    c["void_profile"]["derived_schedule_metrics"]["silence_ratio"]=.99
    issues=validate_condition_semantics(c, executable=True)
    with pytest.raises(SemanticValidationError):
        ensure_semantically_valid(issues, c["condition_id"])

# After Pilot 01 migration to condition_refs.
def test_protocol_sequence_must_equal_condition_refs():
    p=read("pilot-01-void-x-crystallization.protocol.json")
    p=copy.deepcopy(p)
    p["design"]["sequence"][0],p["design"]["sequence"][1]=p["design"]["sequence"][1],p["design"]["sequence"][0]
    issues=validate_protocol_semantics(
        p,load_condition=find_condition,load_probe=find_probe,
        resolve_wound=find_wound,resolve_crystallization=find_crystal
    )
    assert "PROTOCOL_SEQUENCE_MISMATCH" in codes(issues)

def test_protocol_controlled_signal_mismatch_is_blocked():
    p=copy.deepcopy(read("pilot-01-void-x-crystallization.protocol.json"))
    def loader(cid):
        c=copy.deepcopy(find_condition(cid))
        if cid=="C3_HIGH":
            c["signal"]["carrier"]["hz"]=174
        return c
    issues=validate_protocol_semantics(
        p,load_condition=loader,load_probe=find_probe,
        resolve_wound=find_wound,resolve_crystallization=find_crystal
    )
    assert "PROTOCOL_SIGNAL_MISMATCH" in codes(issues)

def test_primary_outcome_must_match_probe():
    p=copy.deepcopy(read("pilot-01-void-x-crystallization.protocol.json"))
    p["primary_outcome"]["id"]="invented_outcome"
    issues=validate_protocol_semantics(
        p,load_condition=find_condition,load_probe=find_probe,
        resolve_wound=find_wound,resolve_crystallization=find_crystal
    )
    assert "PROTOCOL_PRIMARY_OUTCOME_MISMATCH" in codes(issues)

def test_response_series_requires_explicit_series_id():
    context = {
        "session_id": "session-1",
        "participant_id": "participant-1",
        "protocol_id": "protocol-1",
        "started_at": "2026-09-10T00:00:00Z",
    }
    with pytest.raises(ValueError, match="RESPONSE_SERIES_ID_REQUIRED"):
        createResponseSeries(context)

def test_executable_loader_reads_compiled_artifact_only():
    compiled = loadExecutableStimulusCondition("C1_LOW_ASC")
    assert compiled["execution_status"] == "validated"
    assert "derived_schedule_metrics" not in compiled["runtime_schedule"]

def test_source_condition_adapter_is_semantically_validated():
    condition = loadStimulusCondition("C1_LOW_ASC")
    assert condition["condition_id"] == "C1_LOW_ASC"


def test_validate_examples_includes_protocol():
    results = validate_examples()
    assert any(result["file"].endswith(".protocol.json") for result in results)


def test_invalid_protocol_structure_is_rejected():
    p = copy.deepcopy(read("pilot-01-void-x-crystallization.protocol.json"))
    p["protocol_id"] = ""
    result = validate_instance(p, "experiment-protocol.schema.json")
    assert not result["valid"]


def test_missing_cycle_order_is_schema_invalid():
    c = copy.deepcopy(find_condition("C1_LOW_ASC"))
    del c["void_profile"]["schedule"]["cycle_order"]
    result = validate_instance(c, "stimulus-condition.schema.json")
    assert not result["valid"]


def test_wrong_cycle_order_is_blocked():
    c = copy.deepcopy(find_condition("C1_LOW_ASC"))
    c["void_profile"]["schedule"]["cycle_order"] = "silence_then_active"
    issues = validate_condition_semantics(c, executable=True)
    assert "VOID_CYCLE_SEMANTICS_INVALID" in codes(issues)


def test_wrong_cycle_anchor_is_blocked():
    c = copy.deepcopy(find_condition("C1_LOW_ASC"))
    c["void_profile"]["schedule"]["cycle_anchor"] = "block_start"
    issues = validate_condition_semantics(c, executable=True)
    assert "VOID_CYCLE_SEMANTICS_INVALID" in codes(issues)


def test_nonzero_phase_offset_is_blocked():
    c = copy.deepcopy(find_condition("C1_LOW_ASC"))
    c["void_profile"]["schedule"]["phase_offset_s"] = 1
    issues = validate_condition_semantics(c, executable=True)
    assert "VOID_CYCLE_SEMANTICS_INVALID" in codes(issues)


def test_gate_envelope_is_identical_across_pilot():
    expected = {
        "active_gain": 1.0,
        "silent_gain": 0.0,
        "ramp_ms": 20,
        "ramp_shape": "linear",
    }
    for cid in ["C1_LOW_ASC", "C2_MED_ASC", "C3_HIGH", "C4_MED_DESC", "C5_LOW_DESC"]:
        c = find_condition(cid)
        assert c["gate_envelope"] == expected


def test_changed_ramp_ms_is_blocked():
    p = copy.deepcopy(read("pilot-01-void-x-crystallization.protocol.json"))
    def loader(cid):
        c = copy.deepcopy(find_condition(cid))
        c["gate_envelope"]["ramp_ms"] = 40
        return c
    issues = validate_protocol_semantics(
        p,
        load_condition=loader,
        load_probe=find_probe,
        resolve_wound=find_wound,
        resolve_crystallization=find_crystal,
    )
    assert "CONDITION_GATE_ENVELOPE_MISMATCH" in codes(issues)


def test_duplicate_condition_reference_is_detected(tmp_path, monkeypatch):
    examples = tmp_path / "examples"
    examples.mkdir()
    payload = {"condition_id": "DUP", "void_profile": {"schedule": {"pattern": "fixed_periodic"}}, "signal": {"carrier": {"source": "m", "hz": 432}, "modulation": {"mode": "alpha", "hz": 8}}, "gate_envelope": {"active_gain": 1.0, "silent_gain": 0.0, "ramp_ms": 20, "ramp_shape": "linear"}}
    (examples / "one.stimulus-condition.json").write_text(json.dumps(payload), encoding="utf-8")
    (examples / "two.stimulus-condition.json").write_text(json.dumps(payload), encoding="utf-8")
    monkeypatch.setattr(adapters, "EXAMPLES_ROOT", examples)
    with pytest.raises(ReferenceDuplicateError):
        adapters._read_examples("*.stimulus-condition.json", "condition_id", "DUP")


def test_duplicate_wound_reference_is_detected(tmp_path, monkeypatch):
    examples = tmp_path / "examples"
    examples.mkdir()
    payload = {"wound_id": "DUP", "label": "w"}
    (examples / "one.wound-profile.json").write_text(json.dumps(payload), encoding="utf-8")
    (examples / "two.wound-profile.json").write_text(json.dumps(payload), encoding="utf-8")
    monkeypatch.setattr(adapters, "EXAMPLES_ROOT", examples)
    with pytest.raises(ReferenceDuplicateError):
        loadWoundProfile("DUP")


def test_duplicate_crystallization_reference_is_detected(tmp_path, monkeypatch):
    examples = tmp_path / "examples"
    examples.mkdir()
    payload = {"crystallization_id": "DUP", "label": "c"}
    (examples / "one.crystallization-profile.json").write_text(json.dumps(payload), encoding="utf-8")
    (examples / "two.crystallization-profile.json").write_text(json.dumps(payload), encoding="utf-8")
    monkeypatch.setattr(adapters, "EXAMPLES_ROOT", examples)
    with pytest.raises(ReferenceDuplicateError):
        loadCrystallizationProfile("DUP")


def test_duplicate_probe_reference_is_detected(tmp_path, monkeypatch):
    examples = tmp_path / "examples"
    examples.mkdir()
    payload = {"probe_set_id": "DUP", "items": [], "primary_outcome": "felt_presence"}
    (examples / "one.observation-probe.json").write_text(json.dumps(payload), encoding="utf-8")
    (examples / "two.observation-probe.json").write_text(json.dumps(payload), encoding="utf-8")
    monkeypatch.setattr(adapters, "EXAMPLES_ROOT", examples)
    with pytest.raises(ReferenceDuplicateError):
        loadProbeSet("DUP")


def test_recovery_offsets_must_match_design():
    p = copy.deepcopy(read("pilot-01-void-x-crystallization.protocol.json"))
    p["design"]["recovery_probes_s"] = [30, 90]
    issues = validate_protocol_semantics(
        p,
        load_condition=find_condition,
        load_probe=find_probe,
        resolve_wound=find_wound,
        resolve_crystallization=find_crystal,
    )
    assert "PROTOCOL_RECOVERY_POLICY_MISMATCH" in codes(issues)


def test_baseline_probe_policy_must_match_design():
    p = copy.deepcopy(read("pilot-01-void-x-crystallization.protocol.json"))
    p["design"]["baseline_probe"] = False
    issues = validate_protocol_semantics(
        p,
        load_condition=find_condition,
        load_probe=find_probe,
        resolve_wound=find_wound,
        resolve_crystallization=find_crystal,
    )
    assert "PROTOCOL_PROBE_POLICY_MISMATCH" in codes(issues)


def test_between_condition_probe_policy_must_match_design():
    p = copy.deepcopy(read("pilot-01-void-x-crystallization.protocol.json"))
    p["design"]["probe_between_blocks"] = False
    issues = validate_protocol_semantics(
        p,
        load_condition=find_condition,
        load_probe=find_probe,
        resolve_wound=find_wound,
        resolve_crystallization=find_crystal,
    )
    assert "PROTOCOL_PROBE_POLICY_MISMATCH" in codes(issues)


def test_immediate_post_policy_must_match_design():
    p = copy.deepcopy(read("pilot-01-void-x-crystallization.protocol.json"))
    p["design"]["immediate_post_probe"] = False
    issues = validate_protocol_semantics(
        p,
        load_condition=find_condition,
        load_probe=find_probe,
        resolve_wound=find_wound,
        resolve_crystallization=find_crystal,
    )
    assert "PROTOCOL_PROBE_POLICY_MISMATCH" in codes(issues)


def test_executable_runtime_policy_is_strict():
    p = read("pilot-01-void-x-crystallization.protocol.json")
    p["execution_policy"]["manual_controls"]["carrier"] = "editable"
    result = validate_instance(p, "experiment-protocol.schema.json")
    assert not result["valid"]


def test_modified_pause_clock_policy_rejected():
    p = copy.deepcopy(read("pilot-01-void-x-crystallization.protocol.json"))
    p["execution_policy"]["pause"]["clock_behavior"] = "not_frozen"
    result = validate_instance(p, "experiment-protocol.schema.json")
    assert not result["valid"]


def test_runtime_schedule_fingerprint_changes_with_runtime_affecting_change():
    p = read("pilot-01-void-x-crystallization.protocol.json")
    original = p["condition_refs"][0]
    c = copy.deepcopy(find_condition(original))
    c["void_profile"]["schedule"]["silent_duration_s"] = 3
    c["void_profile"]["derived_schedule_metrics"]["silence_ratio"] = 0.3
    result = validate_instance(c, "stimulus-condition.schema.json")
    assert result["valid"]
