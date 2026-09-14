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


def test_probe_has_design_rules_expected_counts_and_clean_choice_semantics():
    probe = read_json(EXAMPLES / "pg01-geometric-regularity.behavioral-probe.json")
    assert "design_rules" in probe
    assert probe["expected_presentation_count"] == 2
    assert "position" in probe["choices"][0]
    assert "response_order" in probe["choices"][0]
    assert "target_slot" in probe["choices"][0]


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
