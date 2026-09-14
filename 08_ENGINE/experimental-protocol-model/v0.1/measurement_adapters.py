"""Validation-only adapters for AEON Phase D.0 measurement contracts."""
from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

from measurement_semantic_validator import ensure_measurement_graph, ensure_measurement_semantics
from validator import ProtocolValidationError, validate_instance

ROOT = Path(__file__).resolve().parent
EXAMPLES = ROOT / "examples"


class MeasurementReferenceNotFoundError(LookupError):
    pass


class MeasurementReferenceDuplicateError(LookupError):
    pass


def _load(pattern: str, field: str, identifier: str, root: Path | None = None) -> dict[str, Any]:
    search_root = root or EXAMPLES
    matches = []
    for path in sorted(search_root.rglob(pattern)):
        value = json.loads(path.read_text(encoding="utf-8"))
        if value.get(field) == identifier:
            matches.append(value)
    if not matches:
        raise MeasurementReferenceNotFoundError(identifier)
    if len(matches) > 1:
        raise MeasurementReferenceDuplicateError(identifier)
    return copy.deepcopy(matches[0])


def _validated(identifier: str, value: dict[str, Any], schema: str) -> dict[str, Any]:
    result = validate_instance(value, f"draft-v0.2/{schema}")
    if not result["valid"]:
        result["message"] = f"{identifier} failed measurement schema validation"
        raise ProtocolValidationError(result)
    ensure_measurement_semantics(value)
    return value


def loadPerceptualStimulus(identifier: str):
    return _validated(identifier, _load("*.perceptual-stimulus.json", "stimulus_id", identifier), "perceptual-stimulus.schema.json")


def loadBehavioralProbe(identifier: str):
    return _validated(identifier, _load("*.behavioral-probe.json", "probe_id", identifier), "behavioral-probe.schema.json")


def loadBehavioralTrial(identifier: str):
    return _validated(identifier, _load("*.behavioral-trial.json", "trial_id", identifier), "behavioral-trial.schema.json")


def loadBehavioralRecord(identifier: str):
    return _validated(identifier, _load("*.behavioral-record.json", "record_id", identifier), "behavioral-record.schema.json")


def loadMeasurementGraph(*, probe_id: str, trial_id: str, record_id: str) -> dict[str, Any]:
    probe = loadBehavioralProbe(probe_id)
    trial = loadBehavioralTrial(trial_id)
    record = loadBehavioralRecord(record_id)

    stimuli_by_id: dict[str, dict[str, Any]] = {}
    for presentation in trial["presentations"]:
        stimulus_id = presentation["stimulus_ref"]
        stimuli_by_id[stimulus_id] = loadPerceptualStimulus(stimulus_id)

    ensure_measurement_graph(
        probe=probe,
        trial=trial,
        record=record,
        stimuli_by_id=stimuli_by_id,
    )

    return {
        "probe": probe,
        "trial": trial,
        "record": record,
        "stimuli_by_id": stimuli_by_id,
    }


def createResponseSeriesV02Draft(context: dict[str, Any]) -> dict[str, Any]:
    value = {
        "schema_version": "0.2-draft",
        "series_id": context["series_id"],
        "session_id": context["session_id"],
        "participant_id": context["participant_id"],
        "protocol_id": context["protocol_id"],
        "started_at": context["started_at"],
        "observations": [],
        "engine_records": [],
        "derived_metrics": [],
        "behavioral_records": [],
        "interpretation_boundary": "Behavioral records describe observed choices and timing; they do not diagnose, establish causality, or prove symbolic constructs.",
    }
    return _validated(value["series_id"], value, "response-series.schema.json")
