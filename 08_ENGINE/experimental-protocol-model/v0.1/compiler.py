"""Deterministic compiler for validated AEON protocol source contracts.

Reference implementation for GitHub Coder. Adapt imports to the repository
package style if needed, but preserve the validation order and output contract.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
from pathlib import Path
from typing import Any

from validator import ProtocolValidationError, validate_instance
from semantic_validator import (
    ReferenceDuplicateError,
    ReferenceNotFoundError,
    ensure_semantically_valid,
    recompute_fixed_periodic,
    validate_condition_semantics,
    validate_protocol_semantics,
)

PACKAGE_ROOT = Path(__file__).resolve().parent
EXAMPLES_ROOT = PACKAGE_ROOT / "examples"
COMPILED_ROOT = PACKAGE_ROOT / "compiled"
COMPILER_VERSION = "0.1"

def canonical_json_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")

def sha256_of(value: Any) -> str:
    return hashlib.sha256(canonical_json_bytes(value)).hexdigest()

def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))

def _lookup(pattern: str, id_field: str, identifier: str) -> dict[str, Any]:
    matches = []
    for path in sorted(EXAMPLES_ROOT.glob(pattern)):
        value = _read_json(path)
        if value.get(id_field) == identifier:
            matches.append(value)
    if not matches:
        raise ReferenceNotFoundError(f"Unknown {id_field}: {identifier}")
    if len(matches) > 1:
        raise ReferenceDuplicateError(f"Duplicate {id_field}: {identifier}")
    return copy.deepcopy(matches[0])

def load_raw_condition(identifier: str) -> dict[str, Any]:
    return _lookup("*.stimulus-condition.json", "condition_id", identifier)

def load_raw_wound(identifier: str) -> dict[str, Any]:
    return _lookup("*.wound-profile.json", "wound_id", identifier)

def load_raw_crystallization(identifier: str) -> dict[str, Any]:
    return _lookup("*.crystallization-profile.json", "crystallization_id", identifier)

def load_raw_probe(identifier: str) -> dict[str, Any]:
    return _lookup("*.observation-probe.json", "probe_set_id", identifier)

def load_raw_protocol(identifier: str) -> dict[str, Any]:
    return _lookup("*.protocol.json", "protocol_id", identifier)

def load_schema_valid_condition(identifier: str) -> dict[str, Any]:
    value = load_raw_condition(identifier)
    ensure_schema(value, "stimulus-condition.schema.json", identifier)
    return value

def load_schema_valid_probe(identifier: str) -> dict[str, Any]:
    value = load_raw_probe(identifier)
    ensure_schema(value, "observation-probe.schema.json", identifier)
    return value

def load_schema_valid_wound(identifier: str) -> dict[str, Any]:
    value = load_raw_wound(identifier)
    ensure_schema(value, "wound-profile.schema.json", identifier)
    return value

def load_schema_valid_crystallization(identifier: str) -> dict[str, Any]:
    value = load_raw_crystallization(identifier)
    ensure_schema(value, "crystallization-profile.schema.json", identifier)
    return value

def ensure_schema(value: dict[str, Any], schema_name: str, label: str) -> None:
    result = validate_instance(value, schema_name)
    if not result["valid"]:
        result["message"] = f"{label} failed schema validation; compilation blocked."
        raise ProtocolValidationError(result)

def compile_condition(source: dict[str, Any]) -> dict[str, Any]:
    ensure_schema(source, "stimulus-condition.schema.json", source.get("condition_id", "condition"))
    issues = validate_condition_semantics(
        source,
        resolve_wound=load_schema_valid_wound,
        resolve_crystallization=load_schema_valid_crystallization,
        executable=True,
    )
    ensure_semantically_valid(issues, source["condition_id"])

    runtime_schedule = recompute_fixed_periodic(source["void_profile"])
    runtime_schedule["gate_envelope"] = copy.deepcopy(source["gate_envelope"])
    compiled = {
        "execution_status": "validated",
        "compiler_version": COMPILER_VERSION,
        "condition_id": source["condition_id"],
        "source_sha256": sha256_of(source),
        "signal": copy.deepcopy(source["signal"]),
        "runtime_schedule": runtime_schedule,
        "experimental_context": {
            "manipulated_variables": copy.deepcopy(source["manipulated_variables"]),
            "held_constant": copy.deepcopy(source["held_constant"]),
            "timing": copy.deepcopy(source["timing"]),
            "order_control": copy.deepcopy(source["order_control"]),
        },
        "hypothesis_refs": copy.deepcopy(source["hypothesis_refs"]),
        "blinding": copy.deepcopy(source["blinding"]),
        "measurement_boundary": copy.deepcopy(source["measurement_boundary"]),
        "integrity": {
            "schema_validation": True,
            "semantic_validation": True,
            "reference_validation": True,
        },
    }
    ensure_schema(compiled, "executable-stimulus.schema.json", source["condition_id"])
    return compiled

def compile_protocol(source: dict[str, Any]) -> tuple[dict[str, Any], dict[str, dict[str, Any]]]:
    ensure_schema(source, "experiment-protocol.schema.json", source.get("protocol_id", "protocol"))
    issues = validate_protocol_semantics(
        source,
        load_condition=load_schema_valid_condition,
        load_probe=load_schema_valid_probe,
        resolve_wound=load_schema_valid_wound,
        resolve_crystallization=load_schema_valid_crystallization,
    )
    ensure_semantically_valid(issues, source["protocol_id"])

    compiled_conditions = {}
    fingerprints = {}
    for condition_id in source["condition_refs"]:
        compiled = compile_condition(load_raw_condition(condition_id))
        compiled_conditions[condition_id] = compiled
        fingerprints[condition_id] = sha256_of(compiled)

    compiled_protocol = {
        "execution_status": "validated",
        "compiler_version": COMPILER_VERSION,
        "protocol_id": source["protocol_id"],
        "source_sha256": sha256_of(source),
        "primary_outcome": copy.deepcopy(source["primary_outcome"]),
        "controlled_signal": copy.deepcopy(source["controlled_signal"]),
        "runtime_policy": copy.deepcopy(source["execution_policy"]),
        "probe_set_ref": source["probe_set_ref"],
        "condition_sequence": list(source["condition_refs"]),
        "condition_fingerprints": fingerprints,
        "integrity": {
            "schema_validation": True,
            "semantic_validation": True,
            "reference_validation": True,
            "conditions_compiled": True,
        },
    }
    ensure_schema(compiled_protocol, "executable-protocol.schema.json", source["protocol_id"])
    return compiled_protocol, compiled_conditions

def _write_canonical_pretty(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n",
        encoding="utf-8",
    )

def compile_all(output_root: Path) -> list[Path]:
    written = []
    protocol_paths = sorted(EXAMPLES_ROOT.glob("*.protocol.json"))
    for protocol_path in protocol_paths:
        source = _read_json(protocol_path)
        compiled_protocol, conditions = compile_protocol(source)

        for condition_id, compiled in conditions.items():
            path = output_root / "conditions" / f"{condition_id}.executable.json"
            _write_canonical_pretty(path, compiled)
            written.append(path)

        path = output_root / "protocols" / f"{source['protocol_id']}.executable.json"
        _write_canonical_pretty(path, compiled_protocol)
        written.append(path)
    return written

def compare_trees(expected_root: Path, generated_root: Path) -> list[str]:
    errors = []
    expected_files = {
        p.relative_to(expected_root): p.read_bytes()
        for p in expected_root.rglob("*.json")
    } if expected_root.exists() else {}
    generated_files = {
        p.relative_to(generated_root): p.read_bytes()
        for p in generated_root.rglob("*.json")
    }

    if set(expected_files) != set(generated_files):
        errors.append(
            f"Compiled file set differs. committed={sorted(map(str, expected_files))}; "
            f"generated={sorted(map(str, generated_files))}"
        )
    for rel in sorted(set(expected_files) & set(generated_files)):
        if expected_files[rel] != generated_files[rel]:
            errors.append(f"Stale compiled artifact: {rel}")
    return errors

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=COMPILED_ROOT)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    if args.check:
        import tempfile
        with tempfile.TemporaryDirectory() as temp:
            generated = Path(temp) / "compiled"
            compile_all(generated)
            errors = compare_trees(COMPILED_ROOT, generated)
            if errors:
                print("\n".join(errors))
                return 1
            print("Compiled artifacts are deterministic and up to date.")
            return 0

    compile_all(args.output)
    print(f"Compiled executable artifacts into {args.output}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
