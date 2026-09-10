from __future__ import annotations

import copy
import json
from pathlib import Path

import pytest

from semantic_validator import (
    SemanticValidationError,
    ensure_semantically_valid,
    recompute_fixed_periodic,
    validate_condition_semantics,
    validate_protocol_semantics,
)
from adapters import createResponseSeries, loadExecutableStimulusCondition, loadStimulusCondition

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
