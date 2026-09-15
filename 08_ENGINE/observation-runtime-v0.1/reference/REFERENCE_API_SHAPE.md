# Reference API Shape — D.1

This is an API target, not mandatory file layout.

```js
const runtime = await ObservationRuntime.open({
  store,
  artifactProvider,
  clock,
});

const session = await runtime.createSession({
  sessionId,
  seriesId,
  participantId,
  protocolId,
});

await runtime.startSession({
  sessionId,
  expectedRevision: session.revision,
});

const attempt = await runtime.armTrial({
  sessionId,
  expectedRevision,
  probeId,
  trialId,
  timingPoint: "pre_protocol_behavioral",
});

await runtime.markStimulusOnset({
  sessionId,
  expectedRevision,
  attemptId: attempt.attemptId,
  presentationSource: "presentation_adapter",
  displayContext,
});

await runtime.captureChoice({
  sessionId,
  expectedRevision,
  attemptId: attempt.attemptId,
  choiceId: "left",
  inputModality: "keyboard",
});

await runtime.commitResolvedAttempt({
  sessionId,
  expectedRevision,
  attemptId: attempt.attemptId,
});

await runtime.recordContextMarker({
  sessionId,
  expectedRevision,
  attemptId: attempt.attemptId,
  marker: {
    source: "participant",
    kind: "phenomenological",
    label: "unexpected_visual_salience",
    data: { intensity_self_rating: 6 },
    note: "Spontaneous report.",
  },
});

await runtime.commitParticipantObservation({
  sessionId,
  expectedRevision,
  observation,
});

await runtime.finalizeSession({
  sessionId,
  expectedRevision,
});

const exported = await runtime.exportSession({ sessionId });

const verified = await ObservationRuntime.verifyImport(exported);
```

## Explicit commands

Recommended runtime commands:

```text
createSession
startSession

armTrial
markStimulusOnset
captureChoice
timeoutAttempt
abortAttempt
flagIntegrity
commitResolvedAttempt

commitParticipantObservation
recordContextMarker

resumeSession
finalizeSession
abortSession

exportSession
verifyImport
```

## Ports

### Clock

```js
{
  nowMonotonicMs(),
  wallTimeRfc3339(),
  performanceTimeOriginMs(),
  runtimeEpochId()
}
```

### ArtifactProvider

```js
{
  loadProbe(id),
  loadTrial(id),
  loadStimulus(id)
}
```

Returned artifacts must include validated document + canonical hash.

### ObservationStore

```js
{
  createSession(...),
  transact(sessionId, expectedRevision, callback),
  loadSession(sessionId),
  listEvents(sessionId),
  loadProjection(sessionId),
  loadArtifactSnapshot(sha256)
}
```

Both MemoryStore and IndexedDBStore implement this contract.

## No hidden side-effect API

Avoid public methods like:

```text
save()
sync()
flush()
```

that make persistence responsibility ambiguous.

Each meaningful runtime command persists its own result atomically.
