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

def test_typed_missing_and_duplicate_references():
    import measurement_adapters as adapters
    with pytest.raises(MeasurementReferenceNotFoundError): adapters.loadPerceptualStimulus("missing")
    source=read(EXAMPLES/"draft-v0.2/pg.regularity.hex.0001.perceptual-stimulus.json")
    duplicate=EXAMPLES/"draft-v0.2/duplicate.perceptual-stimulus.json"
    duplicate.write_text(json.dumps(source),encoding="utf-8")
    try:
        with pytest.raises(MeasurementReferenceDuplicateError): adapters.loadPerceptualStimulus(source["stimulus_id"])
    finally: duplicate.unlink()
