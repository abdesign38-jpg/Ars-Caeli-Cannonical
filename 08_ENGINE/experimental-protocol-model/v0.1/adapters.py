"""Pure file-backed adapters for the AEON experimental protocol contracts."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any, Callable


PACKAGE_ROOT = Path(__file__).resolve().parent
EXAMPLES_ROOT = PACKAGE_ROOT / "examples"


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


def loadWoundProfile(identifier: str) -> dict[str, Any]:
    return _read_examples("*.wound-profile.json", "wound_id", identifier)


def loadCrystallizationProfile(identifier: str) -> dict[str, Any]:
    return _read_examples("*.crystallization-profile.json", "crystallization_id", identifier)


def loadVoidProfile(identifier: str) -> dict[str, Any]:
    return _read_examples("*.profile.json", "void_profile_id", identifier)


def loadStimulusCondition(identifier: str) -> dict[str, Any]:
    return _read_examples("*.stimulus-condition.json", "condition_id", identifier)


def loadProbeSet(identifier: str) -> dict[str, Any]:
    return _read_examples("*.observation-probe.json", "probe_set_id", identifier)


def createResponseSeries(sessionContext: dict[str, Any]) -> dict[str, Any]:
    """Create an empty response series without adding observations or metrics."""

    required_fields = ("session_id", "participant_id", "protocol_id", "started_at")
    missing = [field for field in required_fields if field not in sessionContext]
    if missing:
        raise ValueError(f"Missing session context fields: {', '.join(missing)}")
    return {
        "schema_version": "0.1",
        "series_id": sessionContext.get("series_id", "SERIES-TEMPLATE"),
        "session_id": sessionContext["session_id"],
        "participant_id": sessionContext["participant_id"],
        "protocol_id": sessionContext["protocol_id"],
        "started_at": sessionContext["started_at"],
        "observations": [],
        "engine_records": [],
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
    "loadVoidProfile",
    "loadWoundProfile",
]