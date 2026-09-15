import test from "node:test";
import assert from "node:assert/strict";

import { canonicalizeJson } from "../src/canonical-json.mjs";

test("canonical JSON uses deterministic RFC 8785 output", () => {
  assert.equal(canonicalizeJson({ b: 2, a: 1 }), '{"a":1,"b":2}');
  assert.equal(canonicalizeJson({ value: 1.0 }), '{"value":1}');
});

test("canonical JSON rejects unsupported values", () => {
  assert.throws(() => canonicalizeJson({ value: 1n }), TypeError);
});
