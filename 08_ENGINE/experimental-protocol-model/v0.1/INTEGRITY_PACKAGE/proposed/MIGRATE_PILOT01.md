# Pilot 01 migration — remove embedded conditions

Current file:
`examples/pilot-01-void-x-crystallization.protocol.json`

## Required change

Delete the entire top-level `"conditions": [...]` array.

Insert:

```json
"condition_refs": [
  "C1_LOW_ASC",
  "C2_MED_ASC",
  "C3_HIGH",
  "C4_MED_DESC",
  "C5_LOW_DESC"
],
```

Keep:

```json
"design": {
  "sequence": [
    "C1_LOW_ASC",
    "C2_MED_ASC",
    "C3_HIGH",
    "C4_MED_DESC",
    "C5_LOW_DESC"
  ]
}
```

The apparent duplication between `condition_refs` and `design.sequence` is intentional:
- `condition_refs` declares dependency membership;
- `design.sequence` declares execution order;
- semantic validation forces them to agree for Pilot 01.

Do not embed conditions again.

## Why

Before this migration, Pilot 01 contains full copies of condition definitions while the same condition IDs also exist as standalone files. That creates two independently editable sources of truth.

After migration:
- standalone `*.stimulus-condition.json` files are canonical;
- protocol resolves by ID;
- duplicate/missing IDs block compilation.
