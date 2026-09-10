# Required changes to current `validator.py`

Do not replace its `referencing.Registry` implementation; it is correct.

## Add protocol mapping

Current validator explicitly skips the protocol file because no schema existed.

After adding `experiment-protocol.schema.json`:

```python
SCHEMA_BY_EXAMPLE_SUFFIX = {
    ...
    ".protocol.json": "experiment-protocol.schema.json",
}
```

Remove:

```python
if filename == "pilot-01-void-x-crystallization.protocol.json":
    raise ValueError(...)
```

Remove the `validate_examples()` skip:

```python
if example_path.name.endswith("protocol.json"):
    continue
```

`validate_examples()` must now structurally validate the protocol too.

## Important

Do **not** fold semantic validation into generic `validate_instance()`.

Keep two explicit layers:

```text
validate_instance()       -> JSON Schema / structure
semantic_validator.py     -> equations / cross-field invariants / references
compiler.py               -> executable output
```

This separation makes error provenance clear.
