# QA Checklist — Phase D.1 Observation Runtime Foundation

## Baseline
- [ ] target D.0 closure SHA recorded
- [ ] D.0 schemas consumed, not copied into production module
- [ ] supported D.0 schema version explicit

## Module boundary
- [ ] D.1 is sibling engine module
- [ ] no D.2 renderer
- [ ] no QUEST+
- [ ] no Sound Field scheduling changes
- [ ] no automatic scoring
- [ ] no symbolic interpretation

## State machine
- [ ] all seven persisted states
- [ ] transition table implemented
- [ ] invalid transitions side-effect free
- [ ] terminal sessions immutable
- [ ] retries preserve prior attempts

## Canonicalization
- [ ] RFC 8785/JCS used for every content-addressed hash
- [ ] canonicalize@5.0.0 pinned
- [ ] rfc8785==0.1.4 pinned
- [ ] shared golden vectors pass in JS and Python
- [ ] no second hand-written canonicalizer

## Clock
- [ ] runtime_epoch_id generated per load
- [ ] performance.timeOrigin stored
- [ ] performance.now used for RT
- [ ] wall clock not used for RT
- [ ] cross-epoch valid RT forbidden

## Journal
- [ ] append-only
- [ ] seq contiguous
- [ ] event_id unique
- [ ] session_id stable
- [ ] event payloads contract validated
- [ ] context markers journal-only

## Behavioral record
- [ ] constructed internally
- [ ] first valid input wins
- [ ] answered flow correct
- [ ] timeout flow correct
- [ ] abort-before-onset correct
- [ ] abort-after-onset correct
- [ ] no correctness/raw score
- [ ] D.0 schema + semantics valid before commit

## Participant observations
- [ ] stable-v0.1 observation item validated
- [ ] participant_reported preserved
- [ ] projected only to observations

## Integrity
- [ ] perceptual stimulus integrity
- [ ] response input integrity
- [ ] timing integrity
- [ ] reasons preserved
- [ ] compromised records retained when structurally valid

## Artifacts
- [ ] Probe/Trial/Stimuli resolved
- [ ] D.0 versions guarded
- [ ] canonical hash computed
- [ ] snapshots immutable
- [ ] same hash deduplicated
- [ ] hash mismatch blocks

## Resource limits
- [ ] marker label max enforced
- [ ] marker note max enforced
- [ ] canonical marker byte limit enforced
- [ ] event byte limit enforced
- [ ] oversize payload fails explicitly, no truncation

## Persistence
- [ ] IndexedDB stores created
- [ ] hashing/validation finishes before transaction opens
- [ ] no unrelated async awaits inside active IndexedDB transaction
- [ ] one logical command = one transaction
- [ ] strict durability requested where supported
- [ ] fallback durability capability recorded
- [ ] persistent storage checked/requested
- [ ] storage quota estimate observable
- [ ] optimistic revision checked inside transaction
- [ ] injected transaction failures leave no partial writes
- [ ] no primary unload save

## Recovery
- [ ] ARMED recovery
- [ ] OBSERVING recovery
- [ ] RESOLVED recovery
- [ ] restart is journaled
- [ ] old epoch never silently continued
- [ ] cached projection rebuildable

## Export/import
- [ ] export schema valid
- [ ] journal included
- [ ] artifact snapshots included
- [ ] component hashes
- [ ] hash boundary says tamper evidence, not signature
- [ ] replay equals embedded projection
- [ ] tampering rejected
- [ ] unknown version rejected

## Exploration
- [ ] participant marker
- [ ] operator marker
- [ ] runtime marker
- [ ] technical/environmental/phenomenological/procedural/unexpected
- [ ] nested JSON data survives
- [ ] no automatic Response Series projection
- [ ] no automatic APL/symbolic mapping

## Input
- [ ] keyboard
- [ ] pointer
- [ ] touch
- [ ] invalid choice ignored/rejected explicitly
- [ ] listeners deterministically cleaned up

## Test hygiene
- [ ] Node built-in runner
- [ ] fake-indexeddb exact version pinned
- [ ] package-lock committed
- [ ] no repository fixture mutation in tests
- [ ] no pycache/pyc
- [ ] conformance corpus shared across Python/JS

## CI
- [ ] D.1 contract validation
- [ ] D.0 validator
- [ ] D.0 report freshness
- [ ] D.0 full pytest
- [ ] D.1 full Node tests
- [ ] workflow watches D.0 dependency files

## Closure
- [ ] normal trial round trip
- [ ] timeout round trip
- [ ] abort-before-onset round trip
- [ ] reload-after-onset recovery
- [ ] reload-after-response reconstruct
- [ ] multi-tab conflict demonstrated
- [ ] journal replay exact
- [ ] marker retention exact
- [ ] artifact identity exact
- [ ] tamper detection demonstrated
- [ ] Sound Field unchanged
- [ ] compiled artifacts unchanged
