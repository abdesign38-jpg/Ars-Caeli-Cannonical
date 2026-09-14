"""Draft 2020-12 validation for the AEON experimental protocol contracts."""

from __future__ import annotations

import argparse
import json
import os
import tempfile
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator
from referencing import Registry, Resource


PACKAGE_ROOT = Path(__file__).resolve().parent
CONTRACTS_ROOT = PACKAGE_ROOT / "contracts"
EXAMPLES_ROOT = PACKAGE_ROOT / "examples"
VALIDATION_REPORT_PATH = PACKAGE_ROOT / "validation-report.json"

SCHEMA_BY_EXAMPLE_SUFFIX = {
    ".protocol.json": "experiment-protocol.schema.json",
    ".crystallization-profile.json": "crystallization-profile.schema.json",
    ".observation-probe.json": "observation-probe.schema.json",
    ".stimulus-condition.json": "stimulus-condition.schema.json",
    ".wound-profile.json": "wound-profile.schema.json",
    ".profile.json": "void-profile.schema.json",
    "response-series.template.json": "response-series.schema.json",
    ".perceptual-stimulus.json": "draft-v0.2/perceptual-stimulus.schema.json",
    ".behavioral-probe.json": "draft-v0.2/behavioral-probe.schema.json",
    ".behavioral-trial.json": "draft-v0.2/behavioral-trial.schema.json",
    ".behavioral-record.json": "draft-v0.2/behavioral-record.schema.json",
    "response-series-v0.2.template.json": "draft-v0.2/response-series.schema.json",
}


class ProtocolValidationError(ValueError):
    """Raised when an instance cannot be used by the protocol adapters."""

    def __init__(self, result: dict[str, Any]):
        self.result = result
        super().__init__(result["message"])


class SchemaRegistryError(ValueError):
    """Raised when the recursive schema registry is inconsistent."""


def _read_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as stream:
        return json.load(stream)


def _schema_registry() -> Registry:
    resources = []
    seen_ids = set()
    for schema_path in sorted(CONTRACTS_ROOT.rglob("*.schema.json")):
        schema = _read_json(schema_path)
        Draft202012Validator.check_schema(schema)
        schema_id = schema.get("$id")
        if schema_id:
            if schema_id in seen_ids:
                raise SchemaRegistryError(f"Duplicate schema $id: {schema_id}")
            seen_ids.add(schema_id)
            resources.append((schema_id, Resource.from_contents(schema)))
    return Registry().with_resources(resources)


def _validator(schema_name: str) -> Draft202012Validator:
    schema_path = CONTRACTS_ROOT / schema_name
    if not schema_path.is_file():
        matches = list(CONTRACTS_ROOT.rglob(Path(schema_name).name))
        if len(matches) == 1:
            schema_path = matches[0]
    if not schema_path.is_file():
        raise FileNotFoundError(f"Unknown protocol schema: {schema_name}")
    schema = _read_json(schema_path)
    return Draft202012Validator(schema, registry=_schema_registry())


def validate_instance(instance: dict[str, Any], schema_name: str) -> dict[str, Any]:
    """Validate one instance and return a stable, structured result."""

    errors = []
    for error in sorted(_validator(schema_name).iter_errors(instance), key=lambda item: list(item.path)):
        errors.append(
            {
                "path": ".".join(str(part) for part in error.path) or "$",
                "message": error.message,
                "validator": error.validator,
                "schema_path": ".".join(str(part) for part in error.schema_path),
            }
        )
    return {
        "valid": not errors,
        "schema": schema_name,
        "errors": errors,
    }


def validate_file(path: str | Path, schema_name: str | None = None) -> dict[str, Any]:
    file_path = Path(path)
    resolved_schema = schema_name or _schema_for_example(file_path.name)
    result = validate_instance(_read_json(file_path), resolved_schema)
    return {"file": str(file_path), **result}


def ensure_valid_stimulus_condition(instance: dict[str, Any]) -> dict[str, Any]:
    """Return a condition only when valid, preventing execution otherwise."""

    result = validate_instance(instance, "stimulus-condition.schema.json")
    if not result["valid"]:
        result["message"] = "Invalid STIMULUS_CONDITION; execution blocked."
        raise ProtocolValidationError(result)
    return instance


def _schema_for_example(filename: str) -> str:
    for suffix, schema_name in SCHEMA_BY_EXAMPLE_SUFFIX.items():
        if filename.endswith(suffix):
            return schema_name
    raise ValueError(f"No contract schema mapping for example: {filename}")


def validate_examples() -> list[dict[str, Any]]:
    results = []
    for example_path in sorted(EXAMPLES_ROOT.rglob("*.json")):
        results.append(validate_file(example_path))
    return results


def build_validation_report() -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for result in validate_examples():
        file_path = Path(result["file"]).resolve()
        relative = file_path.relative_to(EXAMPLES_ROOT.resolve()).as_posix()
        normalized.append({
            "file": relative,
            "schema": result["schema"],
            "valid": result["valid"],
            "errors": result["errors"],
        })
    return normalized


def _report_all_valid(report: list[dict[str, Any]]) -> bool:
    return all(item["valid"] for item in report)


def write_validation_report(path: Path = VALIDATION_REPORT_PATH) -> list[dict[str, Any]]:
    report = build_validation_report()
    if not _report_all_valid(report):
        raise ValueError("Refusing to write validation-report.json because one or more examples are invalid.")

    payload = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    path.parent.mkdir(parents=True, exist_ok=True)

    temp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
            delete=False,
        ) as stream:
            stream.write(payload)
            stream.flush()
            os.fsync(stream.fileno())
            temp_path = stream.name
        os.replace(temp_path, path)
        temp_path = None
    finally:
        if temp_path is not None:
            try:
                Path(temp_path).unlink()
            except FileNotFoundError:
                pass
    return report


def validation_report_is_current_and_valid(path: Path = VALIDATION_REPORT_PATH) -> bool:
    if not path.is_file():
        return False
    try:
        persisted = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return False
    current = build_validation_report()
    return isinstance(persisted, list) and persisted == current and _report_all_valid(current)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--examples", action="store_true", help="Validate every contract example")
    parser.add_argument("--file", type=Path, help="Validate one JSON instance")
    parser.add_argument("--schema", help="Schema filename for --file")
    parser.add_argument("--write-report", action="store_true", help="Atomically regenerate validation-report.json from valid examples")
    parser.add_argument("--check-report", action="store_true", help="Fail when validation-report.json is stale or invalid")
    args = parser.parse_args()

    if args.write_report:
        try:
            report = write_validation_report()
        except ValueError as exc:
            print(str(exc))
            return 1
        print(json.dumps({"validation_report_written": str(VALIDATION_REPORT_PATH), "example_count": len(report)}, ensure_ascii=False, indent=2))
        return 0

    if args.check_report:
        current = validation_report_is_current_and_valid()
        print(json.dumps({"validation_report_current_and_valid": current}, ensure_ascii=False, indent=2))
        return 0 if current else 1

    if args.examples:
        results = validate_examples()
    elif args.file:
        results = [validate_file(args.file, args.schema)]
    else:
        parser.error("choose --examples or --file")
    print(json.dumps(results, ensure_ascii=False, indent=2))
    return 0 if all(result["valid"] for result in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())