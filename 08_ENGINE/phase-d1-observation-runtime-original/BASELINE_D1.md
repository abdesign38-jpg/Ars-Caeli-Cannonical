# Baseline & Dependency Pin — Phase D.1

D.1 architecture was designed against the immutable D.0 closure commit:

```text
b8b1a4eea2e9e5fc8e254b20340c8b3a66d367a2
fix(protocol): close final D.0 reviewed-v2 micro-closure
```

D.0 contracts consumed by D.1:

```text
08_ENGINE/experimental-protocol-model/v0.1/
  contracts/response-series.schema.json
  contracts/draft-v0.2/measurement-common.schema.json
  contracts/draft-v0.2/perceptual-stimulus.schema.json
  contracts/draft-v0.2/behavioral-probe.schema.json
  contracts/draft-v0.2/behavioral-trial.schema.json
  contracts/draft-v0.2/behavioral-record.schema.json
  contracts/draft-v0.2/response-series.schema.json
```

Important existing D.0 properties used by D.1:

- behavioral records have `answered | timeout | aborted`;
- behavioral timing points include calibration, standalone, pre-protocol and post-recovery;
- records preserve monotonic onset/response timing;
- records preserve perceptual-stimulus, response-input and timing integrity;
- behavioral evidence is `behavioral_measured`;
- raw record has no correctness/accuracy field;
- v0.2 Response Series reuses stable participant/engine/derived streams by `$ref`;
- Probe, Trial and Stimulus definitions are design/operationalization artifacts;
- symbolic metadata, if present, has zero operational authority.

D.1 must treat those as dependencies, not silently redefine them.
