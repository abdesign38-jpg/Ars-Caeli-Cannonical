"""Semantic integrity rules for AEON Experimental Protocol Model v0.1.

Reference implementation for GitHub Coder. Schema validation must run before
these functions. These rules never auto-correct source data.
"""
from __future__ import annotations
from dataclasses import dataclass, asdict
from math import isclose
from typing import Any, Callable

TOL = 1e-9

@dataclass(frozen=True)
class SemanticIssue:
    code: str
    path: str
    message: str
    expected: Any = None
    actual: Any = None
    severity: str = "error"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

class SemanticValidationError(ValueError):
    def __init__(self, issues: list[SemanticIssue], label: str):
        self.issues = issues
        super().__init__(f"{label} failed semantic validation with {len(issues)} error(s)")


class ReferenceNotFoundError(LookupError):
    """A requested canonical reference does not exist."""


class ReferenceDuplicateError(LookupError):
    """A requested canonical reference resolves to more than one file."""

def _eq(a: Any, b: Any) -> bool:
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return isclose(float(a), float(b), rel_tol=TOL, abs_tol=TOL)
    return a == b

def _issue(issues, code, path, message, expected=None, actual=None):
    issues.append(SemanticIssue(code, path, message, expected, actual))

def recompute_fixed_periodic(void_profile: dict[str, Any]) -> dict[str, Any]:
    s = void_profile["schedule"]
    cycle = float(s["cycle_duration_s"])
    active = float(s["active_duration_s"])
    silent = float(s["silent_duration_s"])
    block = float(s["block_duration_s"])
    return {
        "pattern": "fixed_periodic",
        "cycle_order": s["cycle_order"],
        "cycle_anchor": s["cycle_anchor"],
        "phase_offset_s": s["phase_offset_s"],
        "block_duration_s": block,
        "cycle_duration_s": cycle,
        "active_duration_s": active,
        "silent_duration_s": silent,
        "silence_ratio": silent / cycle,
        "scheduled_silence_ratio": silent / cycle,
        "event_rate_per_min": 60.0 / cycle,
        "mean_gap_ms": silent * 1000.0,
        "gap_cv": 0.0,
        "temporal_predictability": 1.0,
        "whole_cycles": int(round(block / cycle)),
    }

def validate_void_profile_semantics(
    void_profile: dict[str, Any],
    *,
    executable: bool = False,
    require_whole_cycles: bool = False,
) -> list[SemanticIssue]:
    issues: list[SemanticIssue] = []
    s = void_profile.get("schedule", {})
    pattern = s.get("pattern")

    if executable and pattern != "fixed_periodic":
        _issue(
            issues, "UNSUPPORTED_EXECUTION_PATTERN", "schedule.pattern",
            "Only fixed_periodic is executable in v0.1.",
            "fixed_periodic", pattern
        )
        return issues

    if pattern != "fixed_periodic":
        return issues

    required_keys = {
        "cycle_duration_s": "schedule.cycle_duration_s",
        "active_duration_s": "schedule.active_duration_s",
        "silent_duration_s": "schedule.silent_duration_s",
        "block_duration_s": "schedule.block_duration_s",
    }
    for key, path in required_keys.items():
        if key not in s:
            _issue(issues, "VOID_SCHEDULE_FIELD_MISSING", path,
                   f"Executable fixed_periodic schedule requires {key}.", None, None)
            return issues

    for key, expected in (
        ("cycle_order", "active_then_silence"),
        ("cycle_anchor", "condition_start"),
        ("phase_offset_s", 0),
    ):
        if key not in s:
            _issue(issues, "VOID_SCHEDULE_FIELD_MISSING", f"schedule.{key}",
                   f"Executable fixed_periodic schedule requires {key}.", expected, None)
            continue
        if not _eq(s[key], expected):
            _issue(issues, "VOID_CYCLE_SEMANTICS_INVALID", f"schedule.{key}",
                   f"{key} must use the v0.1 executable value.", expected, s[key])

    cycle = float(s["cycle_duration_s"])
    active = float(s["active_duration_s"])
    silent = float(s["silent_duration_s"])
    block = float(s["block_duration_s"])

    if active <= 0:
        _issue(issues, "VOID_ACTIVE_DURATION_INVALID", "schedule.active_duration_s",
               "Executable periodic Void requires positive active duration.", "> 0", active)

    if not _eq(active + silent, cycle):
        _issue(issues, "VOID_CYCLE_MISMATCH", "schedule",
               "active_duration_s + silent_duration_s must equal cycle_duration_s.",
               cycle, active + silent)

    if require_whole_cycles:
        q = block / cycle
        if not isclose(q, round(q), rel_tol=TOL, abs_tol=TOL):
            _issue(issues, "VOID_BLOCK_NOT_WHOLE_CYCLES", "schedule.block_duration_s",
                   "Pilot execution requires an integer number of complete cycles.",
                   "integer block/cycle ratio", q)

    if s.get("seed") is not None:
        _issue(issues, "VOID_SEED_INVALID", "schedule.seed",
               "fixed_periodic must not use a random seed.", None, s.get("seed"))

    if s.get("explicit_events", []) != []:
        _issue(issues, "VOID_EXPLICIT_EVENTS_INVALID", "schedule.explicit_events",
               "fixed_periodic must not contain explicit event overrides.", [], s.get("explicit_events"))

    derived = void_profile["derived_schedule_metrics"]
    calc = recompute_fixed_periodic(void_profile)
    checks = [
        ("silence_ratio", "VOID_SILENCE_RATIO_MISMATCH"),
        ("event_rate_per_min", "VOID_EVENT_RATE_MISMATCH"),
        ("mean_gap_ms", "VOID_MEAN_GAP_MISMATCH"),
        ("gap_cv", "VOID_GAP_CV_MISMATCH"),
        ("temporal_predictability", "VOID_PREDICTABILITY_MISMATCH"),
    ]
    for key, code in checks:
        if not _eq(derived[key], calc[key]):
            _issue(issues, code, f"derived_schedule_metrics.{key}",
                   f"Stored {key} disagrees with recomputed schedule value.",
                   calc[key], derived[key])

    return issues

def validate_condition_semantics(
    condition: dict[str, Any],
    *,
    resolve_wound: Callable[[str], Any] | None = None,
    resolve_crystallization: Callable[[str], Any] | None = None,
    executable: bool = False,
) -> list[SemanticIssue]:
    issues = validate_void_profile_semantics(
        condition["void_profile"],
        executable=executable,
        require_whole_cycles=executable,
    )
    vp = condition["void_profile"]
    calc = recompute_fixed_periodic(vp) if vp["schedule"]["pattern"] == "fixed_periodic" else None

    if calc is not None and not _eq(condition["timing"]["exposure_s"], calc["block_duration_s"]):
        _issue(issues, "CONDITION_EXPOSURE_MISMATCH", "timing.exposure_s",
               "Condition exposure must equal Void block duration.",
               calc["block_duration_s"], condition["timing"]["exposure_s"])

    if calc is not None:
        for item in condition["manipulated_variables"]:
            if item["name"] == "void.temporal_occupancy.silence_ratio":
                if not _eq(item["value"], calc["silence_ratio"]):
                    _issue(issues, "CONDITION_MANIPULATION_MISMATCH",
                           "manipulated_variables.void.temporal_occupancy.silence_ratio",
                           "Declared manipulated silence ratio disagrees with schedule.",
                           calc["silence_ratio"], item["value"])

    held = condition["held_constant"]
    signal = condition["signal"]
    actual = {
        "cycle_duration_s": calc["cycle_duration_s"] if calc else None,
        "event_rate_per_min": calc["event_rate_per_min"] if calc else None,
        "temporal_predictability": calc["temporal_predictability"] if calc else None,
        "gap_cv": calc["gap_cv"] if calc else None,
        "carrier_source": signal["carrier"]["source"],
        "carrier_hz": signal["carrier"]["hz"],
        "modulation_mode": signal["modulation"]["mode"],
        "modulation_hz": signal["modulation"]["hz"],
        "harmonic_b_rule": signal.get("harmonic_b_rule"),
    }
    for key, actual_value in actual.items():
        if key in held and actual_value is not None and not _eq(held[key], actual_value):
            _issue(issues, "CONDITION_HELD_CONSTANT_MISMATCH", f"held_constant.{key}",
                   f"Held constant {key} disagrees with executable condition state.",
                   actual_value, held[key])

    refs = condition.get("hypothesis_refs", {})
    if resolve_wound and refs.get("wound_profile_id"):
        try:
            resolve_wound(refs["wound_profile_id"])
        except ReferenceDuplicateError as exc:
            _issue(issues, "REFERENCE_DUPLICATE", "hypothesis_refs.wound_profile_id",
                   str(exc), refs["wound_profile_id"], None)
        except (ReferenceNotFoundError, LookupError) as exc:
            _issue(issues, "REFERENCE_NOT_FOUND", "hypothesis_refs.wound_profile_id",
                   str(exc), refs["wound_profile_id"], None)

    if resolve_crystallization:
        for i, cid in enumerate(refs.get("crystallization_profile_ids", [])):
            try:
                resolve_crystallization(cid)
            except ReferenceDuplicateError as exc:
                _issue(issues, "REFERENCE_DUPLICATE",
                       f"hypothesis_refs.crystallization_profile_ids.{i}",
                       str(exc), cid, None)
            except (ReferenceNotFoundError, LookupError) as exc:
                _issue(issues, "REFERENCE_NOT_FOUND",
                       f"hypothesis_refs.crystallization_profile_ids.{i}",
                       str(exc), cid, None)
    return issues

def validate_protocol_semantics(
    protocol: dict[str, Any],
    *,
    load_condition: Callable[[str], dict[str, Any]],
    load_probe: Callable[[str], dict[str, Any]],
    resolve_wound: Callable[[str], Any] | None = None,
    resolve_crystallization: Callable[[str], Any] | None = None,
) -> list[SemanticIssue]:
    issues: list[SemanticIssue] = []
    refs = protocol["condition_refs"]
    sequence = protocol["design"]["sequence"]

    if len(refs) != len(set(refs)):
        _issue(issues, "REFERENCE_DUPLICATE", "condition_refs",
               "condition_refs must resolve uniquely.", "unique IDs", refs)

    if refs != sequence:
        _issue(issues, "PROTOCOL_SEQUENCE_MISMATCH", "condition_refs",
               "condition_refs must exactly equal design.sequence.", sequence, refs)

    design = protocol["design"]
    execution_policy = protocol["execution_policy"]
    if design.get("probe_between_blocks") is not True or execution_policy.get("between_conditions", {}).get("next_condition_trigger") != "required_probe_saved_or_skipped":
        _issue(issues, "PROTOCOL_PROBE_POLICY_MISMATCH", "design.probe_between_blocks",
               "Pilot 01 requires probe between blocks to be enabled and the runtime policy must request a saved or skipped probe before the next condition.",
               True, design.get("probe_between_blocks"))
    if design.get("baseline_probe") is not True or execution_policy.get("baseline", {}).get("probe_trigger") != "before_first_condition":
        _issue(issues, "PROTOCOL_PROBE_POLICY_MISMATCH", "design.baseline_probe",
               "Pilot 01 requires baseline probe policy to match protocol execution baseline semantics.",
               True, design.get("baseline_probe"))
    if design.get("immediate_post_probe") is not True or execution_policy.get("post_exposure", {}).get("immediate_post_trigger") != "final_condition_end":
        _issue(issues, "PROTOCOL_PROBE_POLICY_MISMATCH", "design.immediate_post_probe",
               "Pilot 01 requires immediate post-probe semantics to match protocol execution policy.",
               True, design.get("immediate_post_probe"))
    if design.get("recovery_probes_s") != execution_policy.get("recovery", {}).get("probe_offsets_s"):
        _issue(issues, "PROTOCOL_RECOVERY_POLICY_MISMATCH", "design.recovery_probes_s",
               "Design recovery probes must match execution_policy.recovery.probe_offsets_s.",
               execution_policy.get("recovery", {}).get("probe_offsets_s"), design.get("recovery_probes_s"))

    conditions = []
    for i, cid in enumerate(refs):
        try:
            c = load_condition(cid)
            conditions.append(c)
        except ReferenceDuplicateError as exc:
            _issue(issues, "REFERENCE_DUPLICATE", f"condition_refs.{i}", str(exc), cid, None)
        except (ReferenceNotFoundError, LookupError) as exc:
            _issue(issues, "REFERENCE_NOT_FOUND", f"condition_refs.{i}", str(exc), cid, None)

    sequence_ids = set()
    for i, c in enumerate(conditions, start=1):
        if c["order_control"]["position"] != i:
            _issue(issues, "PROTOCOL_ORDER_POSITION_MISMATCH",
                   f"conditions.{c['condition_id']}.order_control.position",
                   "Condition position must match protocol sequence position.",
                   i, c["order_control"]["position"])
        sequence_ids.add(c["order_control"]["sequence_id"])

        issues.extend(validate_condition_semantics(
            c,
            resolve_wound=resolve_wound,
            resolve_crystallization=resolve_crystallization,
            executable=True,
        ))

        if not _eq(protocol["design"]["block_duration_s"], c["timing"]["exposure_s"]):
            _issue(issues, "CONDITION_EXPOSURE_MISMATCH",
                   f"conditions.{c['condition_id']}.timing.exposure_s",
                   "Protocol block duration must equal condition exposure.",
                   protocol["design"]["block_duration_s"], c["timing"]["exposure_s"])

        if c["signal"] != protocol["controlled_signal"]:
            _issue(issues, "PROTOCOL_SIGNAL_MISMATCH",
                   f"conditions.{c['condition_id']}.signal",
                   "Pilot 01 requires every condition signal to equal controlled_signal.",
                   protocol["controlled_signal"], c["signal"])

    if len(sequence_ids) > 1:
        _issue(issues, "PROTOCOL_SEQUENCE_ID_MISMATCH", "conditions.order_control.sequence_id",
               "All conditions in one protocol sequence must share one sequence_id.",
               "single sequence_id", sorted(sequence_ids))

    expected_envelope = {
        "active_gain": 1.0, "silent_gain": 0.0, "ramp_ms": 20, "ramp_shape": "linear"
    }
    for c in conditions:
        if c.get("gate_envelope") != expected_envelope:
            _issue(issues, "CONDITION_GATE_ENVELOPE_MISMATCH",
                   f"conditions.{c['condition_id']}.gate_envelope",
                   "Pilot 01 requires one shared gate envelope.", expected_envelope,
                   c.get("gate_envelope"))

    try:
        probe = load_probe(protocol["probe_set_ref"])
    except ReferenceDuplicateError as exc:
        _issue(issues, "REFERENCE_DUPLICATE", "probe_set_ref", str(exc),
               protocol["probe_set_ref"], None)
        probe = None
    except (ReferenceNotFoundError, LookupError) as exc:
        _issue(issues, "REFERENCE_NOT_FOUND", "probe_set_ref", str(exc),
               protocol["probe_set_ref"], None)
        probe = None

    if probe:
        primary = protocol["primary_outcome"]["id"]
        if probe["primary_outcome"] != primary:
            _issue(issues, "PROTOCOL_PRIMARY_OUTCOME_MISMATCH", "primary_outcome.id",
                   "Protocol primary outcome must match probe-set primary outcome.",
                   probe["primary_outcome"], primary)
        item_ids = {item["id"] for item in probe["items"]}
        if primary not in item_ids:
            _issue(issues, "PROTOCOL_PRIMARY_OUTCOME_MISMATCH", "primary_outcome.id",
                   "Primary outcome must exist among probe items.", sorted(item_ids), primary)

    return issues

def ensure_semantically_valid(issues: list[SemanticIssue], label: str) -> None:
    errors = [x for x in issues if x.severity == "error"]
    if errors:
        raise SemanticValidationError(errors, label)
