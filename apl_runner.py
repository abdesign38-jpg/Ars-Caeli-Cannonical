#!/usr/bin/env python3
"""Minimal parser and runner for the structured APL flow format."""

import argparse
import json
import re
from pathlib import Path
from typing import Any


BLOCK_START = re.compile(r"^(?P<kind>[A-Z_]+)\s+(?P<identifier>\S+)$")


def parse_value(raw: str) -> Any:
    """Parse JSON-like APL values while preserving free-form expressions."""
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        if raw.startswith("[") and raw.endswith("]"):
            items = raw[1:-1].strip()
            if not items:
                return []
            return [parse_value(item.strip()) for item in items.split(",")]
        return raw


def add_field(target: dict[str, Any], key: str, value: Any) -> None:
    if key not in target:
        target[key] = value
    elif isinstance(target[key], list):
        target[key].append(value)
    else:
        target[key] = [target[key], value]


def parse_apl(source: str) -> list[dict[str, Any]]:
    entities: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    containers: list[dict[str, Any]] = []

    for line_number, raw_line in enumerate(source.splitlines(), 1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue

        if line == "END":
            if current is None:
                raise ValueError(f"line {line_number}: END without an open block")
            if containers:
                raise ValueError(f"line {line_number}: nested block is not closed")
            entities.append(current)
            current = None
            continue

        if current is None:
            match = BLOCK_START.match(line)
            if not match:
                raise ValueError(f"line {line_number}: expected block header: {line}")
            current = {
                "kind": match.group("kind"),
                "id": match.group("identifier"),
            }
            continue

        if line.endswith("{"):
            key = line[:-1].strip()
            if not key:
                raise ValueError(f"line {line_number}: empty nested block name")
            nested: dict[str, Any] = {}
            add_field(current if not containers else containers[-1], key, nested)
            containers.append(nested)
            continue

        if line == "}":
            if not containers:
                raise ValueError(f"line {line_number}: closing brace without a block")
            containers.pop()
            continue

        key, separator, raw_value = line.partition(" ")
        if not separator:
            raise ValueError(f"line {line_number}: expected KEY VALUE: {line}")
        target = containers[-1] if containers else current
        raw_value = raw_value.strip()
        if raw_value.startswith("="):
            raw_value = raw_value[1:].strip()
        add_field(target, key, parse_value(raw_value))

    if current is not None:
        raise ValueError("input ended before END")
    return entities


def run(path: Path) -> list[dict[str, Any]]:
    return parse_apl(path.read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Parse a structured APL flow")
    parser.add_argument(
        "path",
        nargs="?",
        type=Path,
        default=Path("03_INFRASTRUCTURE/examples/flow-example.apl"),
    )
    parser.add_argument("--json", action="store_true", dest="as_json")
    args = parser.parse_args()

    try:
        entities = run(args.path)
    except (OSError, ValueError) as error:
        parser.error(str(error))

    if args.as_json:
        print(json.dumps(entities, ensure_ascii=False, indent=2))
        return 0

    print(f"APL {args.path}: {len(entities)} blocks")
    for entity in entities:
        fields = ", ".join(key for key in entity if key not in {"kind", "id"})
        suffix = f" [{fields}]" if fields else ""
        print(f"- {entity['kind']} {entity['id']}{suffix}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())