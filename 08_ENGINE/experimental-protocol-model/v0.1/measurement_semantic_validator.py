"""Semantic checks for AEON Phase D.0 measurement contracts."""
from __future__ import annotations
from datetime import datetime
from typing import Any

class MeasurementSemanticIssue:
    def __init__(self, code: str, path: str, message: str): self.code,self.path,self.message=code,path,message

def validate_measurement_semantics(value: dict[str, Any]) -> list[MeasurementSemanticIssue]:
    issues=[]
    def add(code,path,message): issues.append(MeasurementSemanticIssue(code,path,message))
    if "parameters" in value:
        ids=[x.get("parameter_id") for x in value["parameters"]]
        if len(ids)!=len(set(ids)): add("DUPLICATE_PARAMETER_ID","parameters","parameter IDs must be unique")
        if value.get("randomness_used") and value.get("seed") is None: add("SEED_REQUIRED","seed","random stimuli require a seed")
        if not value.get("randomness_used") and value.get("seed") is not None: add("SEED_FORBIDDEN","seed","deterministic stimuli must use null seed")
    if "choices" in value:
        ids=[x.get("choice_id") for x in value["choices"]]
        if len(ids)!=len(set(ids)): add("DUPLICATE_CHOICE_ID","choices","choice IDs must be unique")
        if value.get("task_type")=="odd_one_out" and len(ids)<3: add("ODDITY_CHOICE_COUNT","choices","odd-one-out requires at least three choices")
        if value.get("correct_choice_id") is not None and value["correct_choice_id"] not in ids: add("CORRECT_CHOICE_INVALID","correct_choice_id","correct choice must exist")
        policy=value.get("trial_policy",{})
        if policy.get("mode")=="adaptive" and policy.get("max_trials",0)<policy.get("min_trials",0): add("ADAPTIVE_RANGE_INVALID","trial_policy","max_trials must be >= min_trials")
    if "presentations" in value:
        slots=[x.get("slot") for x in value["presentations"]]
        if len(slots)!=len(set(slots)): add("DUPLICATE_SLOT","presentations","presentation slots must be unique")
        if value.get("response_key",{}).get("correct_choice_id") is None: add("RESPONSE_KEY_MISSING","response_key","response key is required")
    if "response_status" in value:
        if value["response_status"]=="answered" and (value.get("choice_id") is None or value.get("reaction_time_ms") is None): add("ANSWERED_RESPONSE_INCOMPLETE","response","answered records require choice and reaction time")
        if value["response_status"]!="answered" and (value.get("choice_id") is not None or value.get("reaction_time_ms") is not None): add("NONANSWERED_RESPONSE_DATA","response","timeout/aborted records require null choice and RT")
        trace=value.get("timing_trace",{})
        if trace.get("response_ms") is not None and trace.get("response_ms",0)<trace.get("stimulus_onset_ms",0): add("TIMING_ORDER_INVALID","timing_trace","response cannot precede onset")
        if value.get("reaction_time_ms") is not None and trace.get("response_ms") is not None and abs((trace["response_ms"]-trace["stimulus_onset_ms"])-value["reaction_time_ms"])>10: add("REACTION_TIME_MISMATCH","reaction_time_ms","reaction time disagrees with timing trace")
        try: datetime.fromisoformat(value["recorded_at"].replace("Z","+00:00"))
        except (ValueError,TypeError): add("RECORDED_AT_INVALID","recorded_at","recorded_at must be a valid ISO timestamp")
    return issues

def ensure_measurement_semantics(value: dict[str, Any]) -> None:
    issues=validate_measurement_semantics(value)
    if issues: raise ValueError("measurement semantic validation failed: "+", ".join(issue.code for issue in issues))
