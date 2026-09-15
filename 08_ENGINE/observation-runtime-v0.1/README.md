# AEON Phase D.1 Observation Runtime Foundation

This is the executable implementation of the canonical D.1 specification in this package. It consumes the D.0 measurement contracts without rewriting them.

The initial implementation gate establishes the browser-native ES module package, typed runtime errors, the normative session state machine, runtime IDs, and monotonic timing boundaries. Persistence, journal replay, D.0 record construction, export/import verification, and browser adapters will be added behind focused tests.

D.1 remains observational: it does not diagnose, establish causality, score participants, or infer symbolic meaning.
