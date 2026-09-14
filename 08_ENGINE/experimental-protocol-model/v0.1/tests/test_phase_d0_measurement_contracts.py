from __future__ import annotations
import copy, json
from pathlib import Path
import pytest
from jsonschema import Draft202012Validator
from validator import validate_examples, validate_instance
from measurement_semantic_validator import validate_measurement_semantics
from measurement_adapters import createResponseSeriesV02Draft, MeasurementReferenceDuplicateError, MeasurementReferenceNotFoundError

ROOT=Path(__file__).resolve().parents[1]
EXAMPLES=ROOT/"examples"
CONTRACTS=ROOT/"contracts"
def read(path): return json.loads(path.read_text(encoding="utf-8"))

def test_recursive_examples_validate():
    results=validate_examples()
    assert len(results)==20
    assert all(result["valid"] for result in results)

def test_all_schemas_self_validate_and_ids_unique():
    ids=[]
    for path in CONTRACTS.rglob("*.schema.json"):
        value=read(path);Draft202012Validator.check_schema(value);ids.append(value["$id"])
    assert len(ids)==len(set(ids))

def test_v01_response_series_rejects_only_added_behavioral_records():
    value=read(EXAMPLES/"response-series.template.json")
    assert validate_instance(value,"response-series.schema.json")["valid"]
    value["behavioral_records"]=[]
    assert not validate_instance(value,"response-series.schema.json")["valid"]

def test_v02_response_series_accepts_behavioral_records():
    path=EXAMPLES/"draft-v0.2/response-series-v0.2.template.json"
    assert validate_instance(read(path),"draft-v0.2/response-series.schema.json")["valid"]

def test_record_rejects_correctness_and_confidence():
    record=read(EXAMPLES/"draft-v0.2/pg01-trial-0001.behavioral-record.json")
    record["correct"]=True
    assert not validate_instance(record,"draft-v0.2/behavioral-record.schema.json")["valid"]
    record=read(EXAMPLES/"draft-v0.2/pg01-trial-0001.behavioral-record.json")
    record["confidence"]=4
    assert not validate_instance(record,"draft-v0.2/behavioral-record.schema.json")["valid"]

def test_semantic_probe_and_stimulus_rules():
    probe=read(EXAMPLES/"draft-v0.2/pg01-geometric-regularity.behavioral-probe.json")
    probe["choices"].append(probe["choices"][0])
    assert "DUPLICATE_CHOICE_ID" in {x.code for x in validate_measurement_semantics(probe)}
    stimulus=read(EXAMPLES/"draft-v0.2/pg.regularity.hex.0001.perceptual-stimulus.json")
    stimulus["parameters"].append(stimulus["parameters"][0])
    assert "DUPLICATE_PARAMETER_ID" in {x.code for x in validate_measurement_semantics(stimulus)}


def test_semantic_probe_requires_consistent_response_semantics_and_behavioral_authority():
    probe=read(EXAMPLES/"draft-v0.2/pg01-geometric-regularity.behavioral-probe.json")
    probe["response_semantics"]="categorical"
    assert "ODDITY_RESPONSE_SEMANTICS" not in {x.code for x in validate_measurement_semantics(probe)}
    probe["task_type"]="odd_one_out"
    codes={x.code for x in validate_measurement_semantics(probe)}
    assert "ODDITY_RESPONSE_SEMANTICS" in codes

    record=read(EXAMPLES/"draft-v0.2/pg01-trial-0001.behavioral-record.json")
    record["operational_authority"]=True
    codes={x.code for x in validate_measurement_semantics(record)}
    assert "BEHAVIORAL_RECORD_NOT_OPERATIONALLY_AUTHORITATIVE" in codes


def test_measurement_graph_rejects_real_reference_errors_without_false_positive_count_mismatch():
    from measurement_semantic_validator import validate_measurement_graph
    probe=read(EXAMPLES/"draft-v0.2/pg01-geometric-regularity.behavioral-probe.json")
    trial=read(EXAMPLES/"draft-v0.2/pg01-trial-0001.behavioral-trial.json")
    record=read(EXAMPLES/"draft-v0.2/pg01-trial-0001.behavioral-record.json")
    stimuli={
        "pg.regularity.hex.0001": read(EXAMPLES/"draft-v0.2/pg.regularity.hex.0001.perceptual-stimulus.json"),
        "pg.regularity.hex.0002": read(EXAMPLES/"draft-v0.2/pg.regularity.hex.0002.perceptual-stimulus.json"),
    }
    issues=validate_measurement_graph(probe=probe, trial=trial, record=record, stimuli_by_id=stimuli)
    assert "PRESENTATION_COUNT_MISMATCH" not in {x.code for x in issues}

    trial["presentations"].append({"slot":2,"stimulus_ref":"missing.stimulus"})
    issues=validate_measurement_graph(probe=probe, trial=trial, record=record, stimuli_by_id=stimuli)
    assert "STIMULUS_REFERENCE_NOT_FOUND" in {x.code for x in issues}


def test_validation_report_requires_exact_current_payload(tmp_path):
    from validator import build_validation_report, validation_report_is_current_and_valid, write_validation_report
    report_path=tmp_path/"validation-report.json"
    write_validation_report(report_path)
    assert validation_report_is_current_and_valid(report_path)

    stale=json.loads(report_path.read_text(encoding="utf-8"))
    stale.reverse()
    report_path.write_text(json.dumps(stale, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    assert not validation_report_is_current_and_valid(report_path)


def test_semantic_trial_record_rules():
    trial=read(EXAMPLES/"draft-v0.2/pg01-trial-0001.behavioral-trial.json")
    trial["presentations"].append(trial["presentations"][0])
    assert "DUPLICATE_SLOT" in {x.code for x in validate_measurement_semantics(trial)}
    record=read(EXAMPLES/"draft-v0.2/pg01-trial-0001.behavioral-record.json")
    record["timing_trace"]["response_ms"]=900
    assert "REACTION_TIME_MISMATCH" in {x.code for x in validate_measurement_semantics(record)}

def test_adaptive_range_and_timestamp_rules():
    probe=read(EXAMPLES/"draft-v0.2/pg01-geometric-regularity.behavioral-probe.json")
    probe["trial_policy"]={"mode":"adaptive","method_id":"m","method_version":"1","min_trials":5,"max_trials":2,"stopping_rule":"x","seed":1}
    assert "ADAPTIVE_RANGE_INVALID" in {x.code for x in validate_measurement_semantics(probe)}
    record=read(EXAMPLES/"draft-v0.2/pg01-trial-0001.behavioral-record.json")
    record["recorded_at"]="not-a-date"
    assert "RECORDED_AT_INVALID" in {x.code for x in validate_measurement_semantics(record)}

def test_symbolic_metadata_has_no_operational_authority():
    stimulus=read(EXAMPLES/"draft-v0.2/pg.regularity.hex.0001.perceptual-stimulus.json")
    stimulus["symbolic_metadata"]={"apl_knowledge_layer":"symbolic","evidence_role":"source_symbolic","operational_authority":True}
    assert not validate_instance(stimulus,"draft-v0.2/perceptual-stimulus.schema.json")["valid"]

def test_adapter_constructor_validates_output():
    value=createResponseSeriesV02Draft({"series_id":"s","session_id":"x","participant_id":"p","protocol_id":"d","started_at":"2026-01-01T00:00:00Z"})
    assert value["schema_version"]=="0.2-draft"

def test_typed_missing_and_duplicate_references(tmp_path, monkeypatch):
    import measurement_adapters as adapters
    with pytest.raises(MeasurementReferenceNotFoundError): adapters.loadPerceptualStimulus("missing")
    source=read(EXAMPLES/"draft-v0.2/pg.regularity.hex.0001.perceptual-stimulus.json")
    duplicate_a=tmp_path/"duplicate-a.perceptual-stimulus.json"
    duplicate_b=tmp_path/"duplicate-b.perceptual-stimulus.json"
    duplicate_a.write_text(json.dumps(source),encoding="utf-8")
    duplicate_b.write_text(json.dumps(source),encoding="utf-8")
    monkeypatch.setattr(adapters, "EXAMPLES", tmp_path)
    with pytest.raises(MeasurementReferenceDuplicateError): adapters.loadPerceptualStimulus(source["stimulus_id"])
