# Error Model — D.1

Use:

```text
ObservationRuntimeError
```

Fields:

```text
code
message
details
recoverable
```

Minimum codes:

| Code | Default recoverable | Meaning |
|---|---:|---|
| STATE_TRANSITION_INVALID | yes | command not allowed from current state |
| SESSION_NOT_FOUND | no | requested Session absent |
| SESSION_FINALIZED | no | attempted mutation of terminal Session |
| SESSION_CONFLICT | yes | stale revision / concurrent writer |
| ARTIFACT_NOT_FOUND | yes | required D.0 artifact cannot resolve |
| ARTIFACT_HASH_MISMATCH | no | content differs from expected fingerprint |
| ARTIFACT_UNSUPPORTED_VERSION | no | runtime does not support schema version |
| CHOICE_NOT_ALLOWED | yes | input is not a Probe choice |
| RUNTIME_EPOCH_MISMATCH | no for current attempt | onset and response cannot form one valid timing interval |
| DUPLICATE_RECORD_COMMIT | no | same attempt already projected |
| STORE_TRANSACTION_FAILED | yes | storage transaction failed |
| PAYLOAD_LIMIT_EXCEEDED | yes | marker/event exceeds runtime payload bound |
| STORAGE_QUOTA_RISK | yes | storage estimate indicates unsafe remaining quota |
| PROJECTION_DIVERGENCE | no until replay | cache differs from journal-derived projection |
| EXPORT_SCHEMA_INVALID | no | export structure invalid |
| EXPORT_HASH_MISMATCH | no | exported component altered |
| EXPORT_REPLAY_MISMATCH | no | journal does not reproduce embedded projection |
| RECOVERY_FAILED | no | journal cannot be safely replayed |

Do not:
- parse message strings for control flow;
- swallow errors and continue as if valid;
- convert a storage failure into a behavioral timeout;
- convert a timing failure into participant error.

Measurement integrity and software exceptions are separate things.
