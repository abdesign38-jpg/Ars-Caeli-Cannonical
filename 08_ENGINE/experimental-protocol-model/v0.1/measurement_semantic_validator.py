"""Semantic validation for AEON Phase D.0 closure.

JSON Schema handles local structure. This module handles cross-field and
cross-entity invariants that require resolved references or comparisons.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import math
import re
from typing import Any


RT_SERIALIZATION_EPSILON_MS = 0.001


@dataclass(frozen=True)
class MeasurementSemanticIssue:
    code: str
    path: str
    message: str


def _add(
    issues: list[MeasurementSemanticIssue],
    code: str,
    path: str,
    message: str,
) -> None:
    issues.append(MeasurementSemanticIssue(code, path, message))


_RFC3339_DATE_TIME = re.compile(
    r"^\d{4}-\d{2}-\d{2}T"
    r"\d{2}:\d{2}:\d{2}"
    r"(?:\.\d+)?"
    r"(?:Z|[+-]\d{2}:\d{2})$",
    re.IGNORECASE,
)


def _valid_datetime(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    if _RFC3339_DATE_TIME.fullmatch(value) is None:
        return False

    normalized = value
    if value[-1:] in {"Z", "z"}:
        normalized = value[:-1] + "+00:00"

    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return False

    return parsed.tzinfo is not None


def validate_measurement_semantics(
    value: dict[str, Any],
) -> list[MeasurementSemanticIssue]:
    issues: list[MeasurementSemanticIssue] = []

    if "parameters" in value:
        parameter_ids = [item.get("parameter_id") for item in value["parameters"]]
        if len(parameter_ids) != len(set(parameter_ids)):
            _add(issues, "DUPLICATE_PARAMETER_ID", "parameters", "parameter IDs must be unique")

        if value.get("deterministic") is not True:
            _add(issues, "STIMULUS_NOT_DETERMINISTIC", "deterministic", "Phase D.0 perceptual stimuli must be deterministic")

        if value.get("randomness_used") and value.get("seed") is None:
            _add(issues, "SEED_REQUIRED_FOR_PSEUDORANDOM", "seed", "pseudorandom deterministic stimuli require an explicit seed")

        if not value.get("randomness_used") and value.get("seed") is not None:
            _add(issues, "SEED_FORBIDDEN_WITHOUT_RANDOMNESS", "seed", "seed must be null when randomness_used is false")

    if "choices" in value:
        choices = value["choices"]
        choice_ids = [item.get("choice_id") for item in choices]
        response_orders = [item.get("response_order") for item in choices]
        target_slots = [item.get("target_slot") for item in choices]

        if len(choice_ids) != len(set(choice_ids)):
            _add(issues, "DUPLICATE_CHOICE_ID", "choices", "choice IDs must be unique")

        if len(response_orders) != len(set(response_orders)):
            _add(issues, "DUPLICATE_RESPONSE_ORDER", "choices", "response_order values must be unique")

        semantics = value.get("response_semantics")
        if semantics == "presentation_slot":
            if any(slot is None for slot in target_slots):
                _add(issues, "TARGET_SLOT_REQUIRED", "choices", "presentation_slot responses require target_slot on every choice")
            elif len(target_slots) != len(set(target_slots)):
                _add(issues, "DUPLICATE_TARGET_SLOT", "choices", "target_slot values must be unique")
        elif semantics == "categorical":
            if any(slot is not None for slot in target_slots):
                _add(issues, "TARGET_SLOT_FORBIDDEN", "choices", "categorical responses must use target_slot=null")

        task_type = value.get("task_type")
        expected_count = value.get("expected_presentation_count")

        if task_type == "two_alternative_forced_choice":
            if len(choice_ids) != 2:
                _add(issues, "TWO_AFC_CHOICE_COUNT", "choices", "two-alternative forced choice requires exactly two response choices")
            if semantics == "presentation_slot" and expected_count != 2:
                _add(issues, "TWO_AFC_POSITIONAL_PRESENTATION_COUNT", "expected_presentation_count", "positional 2AFC requires exactly two presentations")

        if task_type == "odd_one_out":
            if semantics != "presentation_slot":
                _add(issues, "ODDITY_RESPONSE_SEMANTICS", "response_semantics", "odd-one-out requires presentation_slot response semantics")
            if expected_count is not None and expected_count < 3:
                _add(issues, "ODDITY_PRESENTATION_COUNT", "expected_presentation_count", "odd-one-out requires at least three presentations")
            if expected_count is not None and len(choice_ids) != expected_count:
                _add(issues, "ODDITY_CHOICE_COUNT", "choices", "odd-one-out choice count must equal expected presentation count")

        if task_type == "same_different":
            if semantics != "categorical":
                _add(issues, "SAME_DIFFERENT_RESPONSE_SEMANTICS", "response_semantics", "same/different requires categorical responses")
            if expected_count != 2:
                _add(issues, "SAME_DIFFERENT_PRESENTATION_COUNT", "expected_presentation_count", "same/different requires exactly two presentations")
            if len(choice_ids) != 2:
                _add(issues, "SAME_DIFFERENT_CHOICE_COUNT", "choices", "same/different requires exactly two response choices")

        policy = value.get("trial_policy", {})
        if policy.get("mode") == "adaptive" and policy.get("max_trials", 0) < policy.get("min_trials", 0):
            _add(issues, "ADAPTIVE_RANGE_INVALID", "trial_policy", "max_trials must be >= min_trials")

    if "presentations" in value:
        slots = [item.get("slot") for item in value["presentations"]]
        if len(slots) != len(set(slots)):
            _add(issues, "DUPLICATE_SLOT", "presentations", "presentation slots must be unique")

    if "response_status" in value:
        answered = value["response_status"] == "answered"
        choice_id = value.get("choice_id")
        reaction_time = value.get("reaction_time_ms")
        trace = value.get("timing_trace", {})
        onset = trace.get("stimulus_onset_ms")
        response = trace.get("response_ms")

        if answered:
            if choice_id is None or reaction_time is None:
                _add(issues, "ANSWERED_RESPONSE_INCOMPLETE", "response", "answered records require choice and reaction time")
            if onset is None or response is None:
                _add(issues, "ANSWERED_TIMING_TRACE_INCOMPLETE", "timing_trace", "answered records require onset and response timestamps")
        else:
            if choice_id is not None or reaction_time is not None:
                _add(issues, "NONANSWERED_RESPONSE_DATA", "response", "timeout/aborted records require null choice and reaction time")
            if response is not None:
                _add(issues, "NONANSWERED_RESPONSE_TIMESTAMP", "timing_trace.response_ms", "timeout/aborted records require response_ms=null")
            if value["response_status"] == "timeout" and onset is None:
                _add(issues, "TIMEOUT_ONSET_REQUIRED", "timing_trace.stimulus_onset_ms", "timeout records require a stimulus onset timestamp")

        if response is not None and onset is not None:
            if reaction_time is not None:
                expected_rt = response - onset
                if not math.isclose(expected_rt, reaction_time, rel_tol=0.0, abs_tol=RT_SERIALIZATION_EPSILON_MS):
                    _add(issues, "REACTION_TIME_MISMATCH", "reaction_time_ms", "reaction_time_ms must equal response_ms - stimulus_onset_ms")
            if response < onset:
                _add(issues, "TIMING_ORDER_INVALID", "timing_trace", "response cannot precede stimulus onset")

        if not _valid_datetime(value.get("recorded_at")):
            _add(issues, "RECORDED_AT_INVALID", "recorded_at", "recorded_at must satisfy JSON Schema date-time format")

        integrity = value.get("integrity", {})
        statuses = [
            integrity.get("perceptual_stimulus_integrity"),
            integrity.get("response_input_integrity"),
            integrity.get("timing_integrity"),
        ]
        if any(status in {"INVALID", "UNKNOWN"} for status in statuses):
            if not integrity.get("reasons"):
                _add(issues, "INTEGRITY_REASON_REQUIRED", "integrity.reasons", "INVALID or UNKNOWN integrity requires at least one reason")

    return issues


def validate_measurement_graph(
    *,
    probe: dict[str, Any],
    trial: dict[str, Any],
    record: dict[str, Any],
    stimuli_by_id: dict[str, dict[str, Any]],
) -> list[MeasurementSemanticIssue]:
    issues: list[MeasurementSemanticIssue] = []

    if trial.get("probe_id") != probe.get("probe_id"):
        _add(issues, "TRIAL_PROBE_REFERENCE_MISMATCH", "trial.probe_id", "trial probe_id must match the resolved probe")

    if record.get("probe_id") != probe.get("probe_id"):
        _add(issues, "RECORD_PROBE_REFERENCE_MISMATCH", "record.probe_id", "record probe_id must match the resolved probe")

    if record.get("trial_id") != trial.get("trial_id"):
        _add(issues, "RECORD_TRIAL_REFERENCE_MISMATCH", "record.trial_id", "record trial_id must match the resolved trial")

    choices = probe.get("choices", [])
    choice_ids = {item["choice_id"] for item in choices}

    if record.get("response_status") == "answered" and record.get("choice_id") not in choice_ids:
        _add(issues, "RECORD_CHOICE_NOT_ALLOWED", "record.choice_id", "record choice_id must be declared by the probe")

    correct_choice_id = trial.get("response_key", {}).get("correct_choice_id")
    scoring_rule_id = trial.get("scoring_rule_id")

    if probe.get("has_correct_answer"):
        if correct_choice_id is None:
            _add(issues, "CORRECT_CHOICE_REQUIRED", "trial.response_key.correct_choice_id", "this probe requires a correct choice in each trial")
        elif correct_choice_id not in choice_ids:
            _add(issues, "CORRECT_CHOICE_INVALID", "trial.response_key.correct_choice_id", "correct choice must exist in probe choice space")
        if scoring_rule_id is None:
            _add(issues, "SCORING_RULE_REQUIRED", "trial.scoring_rule_id", "trials with a correct answer require a scoring rule ID")
    else:
        if correct_choice_id is not None:
            _add(issues, "CORRECT_CHOICE_FORBIDDEN", "trial.response_key.correct_choice_id", "probe declares no correct answer")
        if scoring_rule_id is not None:
            _add(issues, "SCORING_RULE_FORBIDDEN", "trial.scoring_rule_id", "probe declares no correct answer")

    expected_family = probe.get("stimulus_family")
    required_parameters = set(probe.get("required_parameters", []))

    for index, presentation in enumerate(trial.get("presentations", [])):
        stimulus_ref = presentation.get("stimulus_ref")
        stimulus = stimuli_by_id.get(stimulus_ref)

        if stimulus is None:
            _add(issues, "STIMULUS_REFERENCE_NOT_FOUND", f"trial.presentations.{index}.stimulus_ref", f"unknown stimulus_ref: {stimulus_ref}")
            continue

        if stimulus.get("family") != expected_family:
            _add(issues, "STIMULUS_FAMILY_MISMATCH", f"trial.presentations.{index}.stimulus_ref", "stimulus family is not allowed by the probe")

        parameter_ids = {item.get("parameter_id") for item in stimulus.get("parameters", [])}
        missing = sorted(required_parameters.difference(parameter_ids))
        if missing:
            _add(issues, "REQUIRED_PARAMETER_MISSING", f"trial.presentations.{index}.stimulus_ref", "missing required parameters: " + ", ".join(missing))

    if len(trial.get("presentations", [])) != probe.get("expected_presentation_count"):
        _add(issues, "PRESENTATION_COUNT_MISMATCH", "trial.presentations", "trial presentation count must match probe expected_presentation_count")

    if probe.get("response_semantics") == "presentation_slot":
        target_slots = {item.get("target_slot") for item in choices}
        trial_slots = {item.get("slot") for item in trial.get("presentations", [])}
        if target_slots != trial_slots:
            _add(issues, "TARGET_SLOT_PRESENTATION_MISMATCH", "probe.choices", "presentation-slot response targets must match trial slots")

    trial_clock = trial.get("timing_policy", {}).get("clock_source")
    record_clock = record.get("provenance", {}).get("clock_source")
    if trial_clock != record_clock:
        _add(issues, "CLOCK_SOURCE_MISMATCH", "record.provenance.clock_source", "record clock source must match trial timing policy")

    return issues


def ensure_measurement_semantics(value: dict[str, Any]) -> None:
    issues = validate_measurement_semantics(value)
    if issues:
        raise ValueError("measurement semantic validation failed: " + ", ".join(issue.code for issue in issues))


def ensure_measurement_graph(
    *,
    probe: dict[str, Any],
    trial: dict[str, Any],
    record: dict[str, Any],
    stimuli_by_id: dict[str, dict[str, Any]],
) -> None:
    issues = validate_measurement_graph(
        probe=probe,
        trial=trial,
        record=record,
        stimuli_by_id=stimuli_by_id,
    )
    if issues:
        raise ValueError("measurement graph validation failed: " + ", ".join(issue.code for issue in issues))
