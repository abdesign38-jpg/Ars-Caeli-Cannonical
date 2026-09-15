# Open Observation Channel

D.1 intentionally leaves room for phenomena the current model did not predict.

That room is `CONTEXT_MARKER`.

## Marker sources

```text
participant
operator
runtime
```

## Marker kinds

```text
technical
environmental
phenomenological
procedural
unexpected
```

Examples:
- participant spontaneously comments that a figure feels unusually salient;
- browser visibility changed;
- a noise occurred in the room;
- operator notices an accidental interruption;
- runtime detects a storage retry;
- an unexpected bodily or perceptual report is volunteered.

## What D.1 captures

A marker can preserve:
- source;
- time;
- attempt association;
- label;
- open JSON data;
- optional note.

## What D.1 refuses to invent

At capture time a marker is not automatically:
- a dependent variable;
- a diagnosis;
- a causal effect;
- a symbolic correspondence;
- a derived metric.

This is why every marker says:

```text
interpretation_policy = none_at_capture
projection_policy = journal_only
```

The point is not to sterilize the strange.

The point is to prevent the strange from being destroyed by premature naming.

A later reviewed analysis phase may transform selected markers into hypotheses or explicitly derived variables while retaining provenance back to the raw marker.
