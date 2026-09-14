from __future__ import annotations

import json
from pathlib import Path

from validator import validate_instance

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "examples" / "draft-v0.2"


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def test_parameter_metadata_and_null_onset_are_required_by_contract():
    stimulus = read_json(EXAMPLES / "pg.regularity.hex.0001.perceptual-stimulus.json")
    bad = json.loads(json.dumps(stimulus))
    bad["parameters"][0].pop("unit", None)
    assert not validate_instance(bad, "draft-v0.2/perceptual-stimulus.schema.json")["valid"]

    record = read_json(EXAMPLES / "pg01-trial-0001.behavioral-record.json")
    record["timing_trace"]["stimulus_onset_ms"] = None
    assert validate_instance(record, "draft-v0.2/behavioral-record.schema.json")["valid"]


def test_probe_has_reviewed_v2_clean_semantics():
    probe = read_json(EXAMPLES / "pg01-geometric-regularity.behavioral-probe.json")
    assert probe["analysis_role"] in {"calibration", "primary", "secondary", "exploratory"}
    assert probe["analysis_role"] == "exploratory"
    assert "behavioral_measured" not in {probe["analysis_role"]}
    assert probe["evidence_role"] == "experimental_operationalization"
    assert probe["response_semantics"] == "presentation_slot"
    assert all("position" not in choice for choice in probe["choices"])
    assert all(isinstance(choice["response_order"], int) and choice["response_order"] >= 0 for choice in probe["choices"])
    assert "response_order" in probe["choices"][0]
    assert "target_slot" in probe["choices"][0]
    assert probe["has_correct_answer"] is True
    assert "correct_choice_id" not in probe

    stimulus = read_json(EXAMPLES / "pg.regularity.hex.0001.perceptual-stimulus.json")
    assert stimulus["parameters"][0]["evidence_role"] == "experimental_operationalization"


def test_trial_accepts_null_correct_choice_when_probe_has_no_correct_answer():
    trial = read_json(EXAMPLES / "pg01-trial-0001.behavioral-trial.json")
    trial["response_key"]["correct_choice_id"] = None
    trial["scoring_rule_id"] = None
    assert validate_instance(trial, "draft-v0.2/behavioral-trial.schema.json")["valid"]


def test_response_series_reuses_v01_stream_contracts_and_longitudinal_timing_points():
    series = read_json(EXAMPLES / "response-series-v0.2.template.json")
    assert series["schema_version"] == "0.2-draft"
    assert "behavioral_records" in series
    assert isinstance(series["observations"], list)
    assert isinstance(series["engine_records"], list)
    assert isinstance(series["derived_metrics"], list)

    schema_path = ROOT / "contracts" / "draft-v0.2" / "response-series.schema.json"
    schema = read_json(schema_path)
    for key in ("observations", "engine_records", "derived_metrics"):
        ref = schema["properties"][key].get("$ref")
        assert ref is not None and "response-series.schema.json" in ref
        assert "type" not in schema["properties"][key]

    record = series["behavioral_records"][0]
    assert record["timing_point"] in {"calibration", "standalone", "pre_protocol_behavioral", "post_recovery_behavioral"}
    assert "stimulus_onset_ms" in record["timing_trace"]
    assert record["timing_trace"]["response_ms"] is not None

    record_schema = read_json(ROOT / "contracts" / "draft-v0.2" / "behavioral-record.schema.json")
    timing_points = record_schema["properties"]["timing_point"]["enum"]
    assert timing_points == ["calibration", "standalone", "pre_protocol_behavioral", "post_recovery_behavioral"]


def test_parameter_roles_preserve_manipulated_vs_constant_contract():
    stimulus = read_json(EXAMPLES / "pg.regularity.hex.0001.perceptual-stimulus.json")
    roles = {p["parameter_id"]: p["role"] for p in stimulus["parameters"]}
    assert roles["regularity_deviation_ratio"] == "manipulated"
    assert roles["sides"] == "held_constant"
    assert roles["radius"] == "held_constant"

    common_schema = read_json(ROOT / "contracts" / "draft-v0.2" / "measurement-common.schema.json")
    assert common_schema["$defs"]["parameter"]["properties"]["role"]["enum"] == ["manipulated", "held_constant", "context", "derived", "control"]
    assert common_schema["$defs"]["parameter"]["properties"]["evidence_role"]["const"] == "experimental_operationalization"


def test_display_context_is_split_and_integrity_reasons_are_required():
    record = read_json(EXAMPLES / "pg01-trial-0001.behavioral-record.json")
    record["provenance"]["display_context"] = {"width_px": 1280, "height_px": 720, "device_pixel_ratio": 1}
    assert not validate_instance(record, "draft-v0.2/behavioral-record.schema.json")["valid"]

    record = read_json(EXAMPLES / "pg01-trial-0001.behavioral-record.json")
    record["integrity"]["reasons"] = []
    assert validate_instance(record, "draft-v0.2/behavioral-record.schema.json")["valid"]


def test_duplicate_reference_probe_uses_tmp_path_not_examples_dir(tmp_path):
    source = read_json(EXAMPLES / "pg.regularity.hex.0001.perceptual-stimulus.json")
    duplicate = tmp_path / "duplicate.perceptual-stimulus.json"
    duplicate.write_text(json.dumps(source), encoding="utf-8")
    assert duplicate.exists()
    assert duplicate.parent != EXAMPLES
