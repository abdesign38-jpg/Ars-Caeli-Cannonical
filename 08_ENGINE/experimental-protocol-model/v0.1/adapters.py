"""Pure file-backed adapters for the AEON experimental protocol contracts."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

from semantic_validator import (
    ensure_semantically_valid,
    validate_condition_semantics,
    validate_protocol_semantics,
)
from validator import ProtocolValidationError, validate_instance


PACKAGE_ROOT = Path(__file__).resolve().parent
EXAMPLES_ROOT = PACKAGE_ROOT / "examples"
COMPILED_ROOT = PACKAGE_ROOT / "compiled"


class AdapterLookupError(LookupError):
    """Raised when an adapter ID does not identify exactly one example."""


def _read_examples(pattern: str, id_field: str, identifier: str) -> dict[str, Any]:
    matches = []
    for path in sorted(EXAMPLES_ROOT.glob(pattern)):
        with path.open(encoding="utf-8") as stream:
            value = json.load(stream)
        if value.get(id_field) == identifier:
            matches.append(value)
    if not matches:
        raise AdapterLookupError(f"Unknown {id_field}: {identifier}")
    if len(matches) > 1:
        raise AdapterLookupError(f"Duplicate {id_field}: {identifier}")
    return copy.deepcopy(matches[0])


def _ensure_schema(value: dict[str, Any], schema_name: str, label: str) -> None:
    result = validate_instance(value, schema_name)
    if not result["valid"]:
        result["message"] = f"{label} failed schema validation."
        raise ProtocolValidationError(result)


def loadWoundProfile(identifier: str) -> dict[str, Any]:
    value = _read_examples("*.wound-profile.json", "wound_id", identifier)
    _ensure_schema(value, "wound-profile.schema.json", identifier)
    return value


def loadCrystallizationProfile(identifier: str) -> dict[str, Any]:
    value = _read_examples("*.crystallization-profile.json", "crystallization_id", identifier)
    _ensure_schema(value, "crystallization-profile.schema.json", identifier)
    return value


def loadVoidProfile(identifier: str) -> dict[str, Any]:
    value = _read_examples("*.profile.json", "void_profile_id", identifier)
    _ensure_schema(value, "void-profile.schema.json", identifier)
    return value


def loadStimulusCondition(identifier: str) -> dict[str, Any]:
    value = _load_raw_condition(identifier)
    _ensure_schema(value, "stimulus-condition.schema.json", identifier)
    issues = validate_condition_semantics(
        value,
        resolve_wound=loadWoundProfile,
        resolve_crystallization=loadCrystallizationProfile,
        executable=True,
    )
    ensure_semantically_valid(issues, identifier)
    return value


def loadProbeSet(identifier: str) -> dict[str, Any]:
    value = _read_examples("*.observation-probe.json", "probe_set_id", identifier)
    _ensure_schema(value, "observation-probe.schema.json", identifier)
    return value


def _load_raw_condition(identifier: str) -> dict[str, Any]:
    return _read_examples("*.stimulus-condition.json", "condition_id", identifier)


def _load_raw_protocol(identifier: str) -> dict[str, Any]:
    return _read_examples("*.protocol.json", "protocol_id", identifier)


def loadExperimentProtocol(identifier: str) -> dict[str, Any]:
    value = _load_raw_protocol(identifier)
    _ensure_schema(value, "experiment-protocol.schema.json", identifier)
    issues = validate_protocol_semantics(
        value,
        load_condition=_load_raw_condition,
        load_probe=loadProbeSet,
        resolve_wound=loadWoundProfile,
        resolve_crystallization=loadCrystallizationProfile,
    )
    ensure_semantically_valid(issues, identifier)
    return value


def _read_compiled(path: Path, schema_name: str) -> dict[str, Any]:
    if not path.is_file():
        raise AdapterLookupError(f"Unknown compiled artifact: {path.name}")
    value = json.loads(path.read_text(encoding="utf-8"))
    _ensure_schema(value, schema_name, path.name)
    if value.get("execution_status") != "validated":
        raise AdapterLookupError(f"Compiled artifact is not executable: {path.name}")
    return copy.deepcopy(value)


def loadExecutableStimulusCondition(identifier: str) -> dict[str, Any]:
    return _read_compiled(
        COMPILED_ROOT / "conditions" / f"{identifier}.executable.json",
        "executable-stimulus.schema.json",
    )


def loadExecutableProtocol(identifier: str) -> dict[str, Any]:
    return _read_compiled(
        COMPILED_ROOT / "protocols" / f"{identifier}.executable.json",
        "executable-protocol.schema.json",
    )


def createResponseSeries(sessionContext: dict[str, Any]) -> dict[str, Any]:
    """Create an empty response series without adding observations or metrics."""

    required_fields = ("series_id", "session_id", "participant_id", "protocol_id", "started_at")
    missing = [field for field in required_fields if not sessionContext.get(field)]
    if missing:
        raise ValueError(
            "RESPONSE_SERIES_ID_REQUIRED / missing session context fields: "
            + ", ".join(missing)
        )
    return {
        "schema_version": "0.1",
        "series_id": sessionContext["series_id"],
        "session_id": sessionContext["session_id"],
        "participant_id": sessionContext["participant_id"],
        "protocol_id": sessionContext["protocol_id"],
        "started_at": sessionContext["started_at"],
        "observations": [],
        "engine_records": [],
        "derived_metrics": [],
        "derived_metrics": [],
        "interpretation_boundary": (
            "Derived response metrics characterize this observed series; "
            "they do not diagnose a wound, prove a symbolic crystallization, "
            "or establish signal causality."
        ),
    }


__all__ = [
    "AdapterLookupError",
    "createResponseSeries",
    "loadCrystallizationProfile",
    "loadProbeSet",
    "loadStimulusCondition",
    "loadExecutableProtocol",
    "loadExecutableStimulusCondition",
    "loadExperimentProtocol",
    "loadVoidProfile",
    "loadWoundProfile",
]