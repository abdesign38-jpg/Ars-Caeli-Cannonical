"""Reference D.1 contract/example validator.

Copy to:
08_ENGINE/observation-runtime-v0.1/tools/validate-contracts.py

It registers D.0 + D.1 schema resources locally. No network $ref retrieval.
"""
from __future__ import annotations

import hashlib
import json

import rfc8785
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource


D1_ROOT = Path(__file__).resolve().parents[1]
D1_CONTRACTS = D1_ROOT / "contracts"
D1_EXAMPLES = D1_ROOT / "examples"
D0_ROOT = D1_ROOT.parent / "experimental-protocol-model" / "v0.1"
D0_CONTRACTS = D0_ROOT / "contracts"

FORMAT_CHECKER = FormatChecker()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def canonical_json_bytes(value: Any) -> bytes:
    return rfc8785.dumps(value)



def sha256_json(value: Any) -> str:
    return hashlib.sha256(
        canonical_json_bytes(value)
    ).hexdigest()


def collect_schemas() -> dict[str, dict[str, Any]]:
    schemas: dict[str, dict[str, Any]] = {}

    for root in (D0_CONTRACTS, D1_CONTRACTS):
        for path in sorted(root.rglob("*.schema.json")):
            schema = read_json(path)
            Draft202012Validator.check_schema(schema)

            schema_id = schema.get("$id")
            if not schema_id:
                raise AssertionError(f"schema missing $id: {path}")
            if schema_id in schemas:
                raise AssertionError(
                    f"duplicate canonical $id: {schema_id}"
                )
            schemas[schema_id] = schema

    return schemas


def build_registry(
    schemas: dict[str, dict[str, Any]],
) -> Registry:
    return Registry().with_resources(
        [
            (schema_id, Resource.from_contents(schema))
            for schema_id, schema in schemas.items()
        ]
    )


def validator_for(
    schema_id: str,
    *,
    schemas: dict[str, dict[str, Any]],
    registry: Registry,
) -> Draft202012Validator:
    return Draft202012Validator(
        schemas[schema_id],
        registry=registry,
        format_checker=FORMAT_CHECKER,
    )


def require_valid(
    value: Any,
    schema_id: str,
    *,
    schemas: dict[str, dict[str, Any]],
    registry: Registry,
    label: str,
) -> None:
    errors = sorted(
        validator_for(
            schema_id,
            schemas=schemas,
            registry=registry,
        ).iter_errors(value),
        key=lambda error: list(error.absolute_path),
    )
    if errors:
        rendered = "\n".join(
            f"{label}: {list(error.absolute_path)}: {error.message}"
            for error in errors
        )
        raise AssertionError(rendered)


def validate_artifact_snapshots(
    export: dict[str, Any],
    *,
    schemas: dict[str, dict[str, Any]],
    registry: Registry,
) -> None:
    schema_by_type = {
        "perceptual_stimulus":
            "https://ars-caeli.local/contracts/v0.2/perceptual-stimulus.schema.json",
        "behavioral_probe":
            "https://ars-caeli.local/contracts/v0.2/behavioral-probe.schema.json",
        "behavioral_trial":
            "https://ars-caeli.local/contracts/v0.2/behavioral-trial.schema.json",
    }

    seen_hashes: set[str] = set()

    for snapshot in export["artifact_snapshots"]:
        expected_hash = sha256_json(snapshot["document"])
        if expected_hash != snapshot["sha256"]:
            raise AssertionError(
                f"artifact hash mismatch: {snapshot['artifact_id']}"
            )

        if snapshot["sha256"] in seen_hashes:
            raise AssertionError(
                f"duplicate artifact snapshot hash: {snapshot['sha256']}"
            )
        seen_hashes.add(snapshot["sha256"])

        schema_id = schema_by_type[snapshot["artifact_type"]]
        if snapshot["canonical_schema_id"] != schema_id:
            raise AssertionError(
                "artifact canonical_schema_id mismatch: "
                + snapshot["artifact_id"]
            )

        require_valid(
            snapshot["document"],
            schema_id,
            schemas=schemas,
            registry=registry,
            label=snapshot["artifact_id"],
        )


def validate_journal_semantics(
    journal: list[dict[str, Any]],
) -> None:
    if not journal:
        raise AssertionError("journal may not be empty")

    session_id = journal[0]["session_id"]

    for expected_seq, event in enumerate(journal):
        if event["seq"] != expected_seq:
            raise AssertionError(
                f"journal sequence gap at {expected_seq}"
            )
        if event["session_id"] != session_id:
            raise AssertionError(
                f"journal session mismatch at seq {expected_seq}"
            )


def validate_export_hashes(export: dict[str, Any]) -> None:
    manifest = export["manifest"]

    expected = {
        "session_sha256": sha256_json(export["session"]),
        "response_series_sha256":
            sha256_json(export["response_series"]),
        "journal_sha256": sha256_json(export["journal"]),
        "artifact_snapshots_sha256":
            sha256_json(export["artifact_snapshots"]),
    }

    for field, value in expected.items():
        if manifest[field] != value:
            raise AssertionError(
                f"export manifest mismatch: {field}"
            )


def main() -> int:
    schemas = collect_schemas()
    registry = build_registry(schemas)

    marker = read_json(
        D1_EXAMPLES / "context-marker.unexpected.json"
    )
    require_valid(
        marker,
        "https://ars-caeli.local/contracts/observation-runtime/v0.1/context-marker.schema.json",
        schemas=schemas,
        registry=registry,
        label="context-marker.unexpected.json",
    )

    abort_journal = read_json(
        D1_EXAMPLES / "journal.abort-before-onset.json"
    )
    for index, event in enumerate(abort_journal):
        require_valid(
            event,
            "https://ars-caeli.local/contracts/observation-runtime/v0.1/runtime-event.schema.json",
            schemas=schemas,
            registry=registry,
            label=f"journal.abort-before-onset.json[{index}]",
        )
    validate_journal_semantics(abort_journal)

    export = read_json(
        D1_EXAMPLES / "session-export.normal.json"
    )
    require_valid(
        export,
        "https://ars-caeli.local/contracts/observation-runtime/v0.1/session-export.schema.json",
        schemas=schemas,
        registry=registry,
        label="session-export.normal.json",
    )

    validate_journal_semantics(export["journal"])
    validate_artifact_snapshots(
        export,
        schemas=schemas,
        registry=registry,
    )
    validate_export_hashes(export)

    print(
        json.dumps(
            {
                "d1_schema_count": len(
                    list(D1_CONTRACTS.glob("*.schema.json"))
                ),
                "d1_example_count": len(
                    list(D1_EXAMPLES.glob("*.json"))
                ),
                "status": "valid",
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
