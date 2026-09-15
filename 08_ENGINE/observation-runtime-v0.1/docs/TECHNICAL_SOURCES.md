# Technical Sources & Rationale

These sources inform implementation mechanics. They do not change AEON's scientific claims.

## High-resolution monotonic time

MDN High precision timing:
https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/High_precision_timing

MDN `performance.now()`:
https://developer.mozilla.org/en-US/docs/Web/API/Performance/now

Relevant implementation consequence:

- use `performance.now()` for within-attempt timing;
- store `performance.timeOrigin`;
- do not treat `Date.now()` as an RT clock;
- do not equate timestamp precision with end-to-end perceptual timing accuracy.

## IndexedDB

MDN IndexedDB basic terminology:
https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology

MDN Using IndexedDB:
https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB

Relevant implementation consequence:

- writes occur inside transactions;
- one logical mutation should be atomic;
- do not depend on asynchronous writes triggered by unload to preserve session state.

## Web Crypto

MDN `crypto.randomUUID()`:
https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID

MDN `SubtleCrypto.digest()`:
https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest

Relevant implementation consequence:

- UUIDv4 is suitable for runtime/event/attempt identity;
- SHA-256 is available for content fingerprints in secure browser contexts;
- hashes are treated as tamper evidence, not signatures.

## IndexedDB testing

fake-indexeddb npm:
https://www.npmjs.com/package/fake-indexeddb

Architecture package pinned version during design:
`6.2.5`

It is a zero-production-dependency test tool used only to exercise IndexedDB code under Node.

## Existing AEON precedent

The current Sound Field runtime already:
- canonicalizes recursively sorted JSON;
- uses Web Crypto SHA-256;
- fetches artifacts with `cache: "no-store"`;
- verifies artifact fingerprints before execution.

D.1 keeps the same conceptual fingerprint pattern without coupling its module to Sound Field.


## RFC 8785 JSON Canonicalization Scheme

RFC 8785:
https://www.rfc-editor.org/rfc/rfc8785.html

Relevant implementation consequence:

- content-addressed hashes must use invariant bytes;
- D.1 uses JCS rather than an ad-hoc cross-language sorted-key serializer;
- JavaScript and Python share golden canonicalization/hash vectors.

## Storage persistence and quota

MDN `StorageManager.persist()`:
https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist

MDN storage quotas/eviction:
https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria

Relevant implementation consequence:

- IndexedDB data is best-effort by default;
- D.1 requests persistent storage when available;
- quota/persistence status is observable runtime context, not hidden infrastructure state.
