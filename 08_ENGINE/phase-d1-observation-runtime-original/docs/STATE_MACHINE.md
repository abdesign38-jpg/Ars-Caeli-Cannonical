# D.1 State Machine

## Persisted states

```text
CREATED
READY
ARMED
OBSERVING
RESOLVED
FINALIZED
ABORTED
```

## Transition table

| Current | Command / event | Next | Notes |
|---|---|---|---|
| none | createSession / session_created | CREATED | seq 0 |
| CREATED | startSession / session_started | READY | creates Response Series projection |
| READY | armTrial / trial_armed | ARMED | resolves and fingerprints artifacts |
| ARMED | markStimulusOnset / stimulus_onset | OBSERVING | onset captured |
| ARMED | abortAttempt / attempt_aborted | RESOLVED | abort-before-onset allowed |
| OBSERVING | captureResponse / response_captured | RESOLVED | first valid response wins |
| OBSERVING | timeout / response_timeout | RESOLVED | requires onset |
| OBSERVING | abortAttempt / attempt_aborted | RESOLVED | onset retained |
| RESOLVED | commitBehavioralRecord / behavioral_record_committed | READY | exactly one record per attempt |
| READY | commitParticipantObservation | READY | projection append |
| any active nonterminal | recordContextMarker | same | journal only |
| ARMED/OBSERVING/RESOLVED | flagIntegrity | same | affects active attempt draft |
| READY | finalizeSession / session_finalized | FINALIZED | only with no unresolved attempt |
| CREATED/READY | abortSession / session_aborted | ABORTED | terminal |

## Invalid examples

Reject:
- response before onset;
- timeout before onset;
- second response after first response;
- record commit while state is ARMED;
- finalize while attempt is active;
- any mutation after FINALIZED or ABORTED;
- command carrying stale expected revision.

Invalid transition:
- emits no event;
- changes no Session State;
- changes no projection;
- writes no artifact.

## Retry

After a committed aborted/timeout/answered record, Session returns to READY.

The same `trial_id` may be armed again only as a new Attempt:
- new UUID;
- incremented attempt ordinal;
- new Behavioral Record ID.

The original attempt remains immutable.

## Recovery

Recovery itself is journaled.

If replay ends:

### ARMED

The prior runtime disappeared before onset.

Disposition:
`abort_and_commit`.

### OBSERVING

Onset exists but no resolution event.

Disposition:
`abort_and_commit`.

### RESOLVED

A response/timeout/abort was captured but the record was not committed.

Disposition:
`reconstruct_commit`.

The runtime must not ask the participant to repeat a captured response merely because projection failed.
