# AEON Sound Field v0.3.1

Symbolic and alchemical session interface for Ars Caeli.

## Design

Version 0.3 replaces the previous technical panel with a complete session experience:

- navigation `Home / Descent / Session / Return / Library / ATLAS`;
- session profile and intention;
- four dimensions of the alchemical method: Underworld, Activation, Dissociation, and Opening;
- animated central mandala/torus;
- visual axis `Descent → Session → Return`;
- bilateral field and return gradient;
- selectable symbolic frequencies;
- Web Audio engine;
- timer;
- local observations;
- local saving;
- session export to ATLAS JSON;
- optional synchronization with Ars-Caeli-Cannonical;
- persistent sessions with session-scoped observations;
- manual microvoid registration and event export to ATLAS.

## Descent, Return, and Microvoids

AEON models a session as a trajectory rather than a fixed state.

Presence may temporarily lose continuity through small operational discontinuities called microvoids.

A microvoid is recorded as a session event:

`Presence → Microvoid → Reorganization → Presence`

AEON microvoids are operational and symbolic events. They are not presented as neurological or physiological measurements. `Descent` is not an inverted `Return`: the return trajectory may differ structurally from the descent trajectory.

## Epistemic Boundary

Three explicit layers are preserved:

1. **Canon:** Markdown/JSON repository documents.
2. **Experimental operationalization:** how the UI converts internal variables into visualization and audio parameters.
3. **Symbolic correspondence:** frequency associations specific to Ars Caeli.

Frequency associations are **not presented as medical, neurophysiological, or therapeutic facts**.

## Files

```text
sound-field-v0.3/
├── index.html
├── styles.css
├── app.js
├── mappings.json
├── module.manifest.json
├── README.md
└── data/
    └── metodo_alquimico_base.json
```

## Local Use

Serve over HTTP:

```bash
python -m http.server 8000
```

then open `http://localhost:8000`.

## GitHub Pages

Publish this folder as a replacement for the previous MVP.
The current public URL preserves the repository path.

## ATLAS

`Export to ATLAS` generates JSON containing:

- session identification,
- engine and version,
- actual duration,
- phase,
- intention,
- active construct,
- dimensions,
- gradient,
- integration index,
- selected symbolic frequency,
- field parameters,
- observations,
- safety.

ATLAS records memory. It does not determine causality. Experiment and participant IDs are editable and do not require personal information.
