"""Draft 2020-12 validation for the AEON experimental protocol contracts."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator
from referencing import Registry, Resource


PACKAGE_ROOT = Path(__file__).resolve().parent
CONTRACTS_ROOT = PACKAGE_ROOT / "contracts"
EXAMPLES_ROOT = PACKAGE_ROOT / "examples"

SCHEMA_BY_EXAMPLE_SUFFIX = {
    ".protocol.json": "experiment-protocol.schema.json",
    ".crystallization-profile.json": "crystallization-profile.schema.json",
    ".observation-probe.json": "observation-probe.schema.json",
    ".stimulus-condition.json": "stimulus-condition.schema.json",
    ".wound-profile.json": "wound-profile.schema.json",
    ".profile.json": "void-profile.schema.json",
    "response-series.template.json": "response-series.schema.json",
}


class ProtocolValidationError(ValueError):
    """Raised when an instance cannot be used by the protocol adapters."""

    def __init__(self, result: dict[str, Any]):
        self.result = result
        super().__init__(result["message"])


def _read_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as stream:
        return json.load(stream)


def _schema_registry() -> Registry:
    resources = []
    for schema_path in CONTRACTS_ROOT.glob("*.schema.json"):
        schema = _read_json(schema_path)
        schema_id = schema.get("$id")
        if schema_id:
            resources.append((schema_id, Resource.from_contents(schema)))
    return Registry().with_resources(resources)


def _validator(schema_name: str) -> Draft202012Validator:
    schema_path = CONTRACTS_ROOT / schema_name
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
    for example_path in sorted(EXAMPLES_ROOT.glob("*.json")):
        results.append(validate_file(example_path))
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--examples", action="store_true", help="Validate every contract example")
    parser.add_argument("--file", type=Path, help="Validate one JSON instance")
    parser.add_argument("--schema", help="Schema filename for --file")
    args = parser.parse_args()

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