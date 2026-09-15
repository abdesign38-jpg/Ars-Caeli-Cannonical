# CI Plan — AEON Observation Runtime

Create:

```text
.github/workflows/aeon-observation-runtime-integrity.yml
```

## Triggers

```text
08_ENGINE/observation-runtime-v0.1/**
08_ENGINE/experimental-protocol-model/v0.1/contracts/**
08_ENGINE/experimental-protocol-model/v0.1/examples/**
08_ENGINE/experimental-protocol-model/v0.1/measurement_adapters.py
08_ENGINE/experimental-protocol-model/v0.1/measurement_semantic_validator.py
.github/workflows/aeon-observation-runtime-integrity.yml
```

## Job

Ubuntu latest.

### Python gate

Use Python 3.12.

```bash
python -m pip install -r 08_ENGINE/experimental-protocol-model/v0.1/requirements-dev.txt
python -m pip install -r 08_ENGINE/observation-runtime-v0.1/requirements-dev.txt

python 08_ENGINE/observation-runtime-v0.1/tools/validate-contracts.py

cd 08_ENGINE/experimental-protocol-model/v0.1
python validator.py --examples
python validator.py --check-report
python -m pytest -q tests
```

### Node gate

Use Node 24.

```bash
npm ci --prefix 08_ENGINE/observation-runtime-v0.1
npm test --prefix 08_ENGINE/observation-runtime-v0.1
```

Recommended `package.json`:

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/*.test.mjs"
  },
  "dependencies": {
    "canonicalize": "5.0.0"
  },
  "devDependencies": {
    "fake-indexeddb": "6.2.5"
  }
}
```

Commit `package-lock.json`.

## Why a separate workflow

D.1 is a new engine module.

A dedicated workflow makes its failure domain visible while still re-running the D.0 dependency gates that matter.

Do not weaken `AEON Contract Integrity`.

## Optional later browser gate

A real-browser CI run may be added later if D.1 begins depending on browser behaviors not adequately represented by `fake-indexeddb`.

Do not add Playwright merely for decoration.

Add it when a specific browser-only invariant deserves enforcement.
