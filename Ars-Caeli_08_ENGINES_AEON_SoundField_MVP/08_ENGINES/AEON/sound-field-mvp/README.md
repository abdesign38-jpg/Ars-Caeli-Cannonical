# AEON Sound Field MVP

**Status:** Experimental MVP  
**Version:** 0.1.0  
**System:** Ars Caeli / AEON  

This prototype explores how selected Ars Caeli cognitive-physics constructs can be translated into reproducible synthetic audio parameters for experimentation and observation.

## Purpose

The MVP provides a browser-based sound field generator with:

- synthetic audio via Web Audio API;
- reproducible parameter controls;
- live waveform / spectrum visualization;
- an experimental mapping layer for selected Ars Caeli constructs;
- subjective observation logging;
- JSON session export.

## Canonical basis

The current interface references:

- `ACSPEC-100` — Tiempo
- `ACSPEC-105` — Resonancia
- `ACSPEC-106` — Presencia

The definitions remain sourced from the canonical Markdown files in `04_PHYSICS/`.

## Important boundary

The audio mappings in this MVP are **experimental interpretations**, not canonical definitions and not causal claims.

Current working mappings:

- Tiempo → pulse / modulation rate
- Resonancia → delay feedback / audible persistence
- Presencia → harmonic density / stereo-field width

These mappings should remain outside the canonical ACSPEC definitions until supported by explicit experimental evidence and a formal Ars Caeli versioning decision.

## Run locally

Open `index.html` in a modern browser and press **START**.

Audio starts only after a user gesture because of browser Web Audio policies.

## Session output

`EXPORT JSON` creates a local experiment record containing:

- current stimulus parameters;
- selected canonical references;
- mapping-status caveat;
- subjective observations;
- timestamps.

## Repository rule

This engine consumes Ars Caeli canonical definitions; it does not replace them. Canonical Markdown and JSON remain the source of truth.
