import test from "node:test";
import assert from "node:assert/strict";

import { createContextMarker } from "../src/context-marker.mjs";

const markerId = "11111111-1111-4111-8111-111111111111";

test("creates an open observation marker with no projection policy", () => {
  const marker = createContextMarker({
    markerId,
    source: "participant",
    kind: "phenomenological",
    label: "unexpected_visual_salience",
    data: { intensity_self_rating: 6, nested: { observed: true } },
    note: "Spontaneous report.",
  });

  assert.deepEqual(marker, {
    marker_schema_version: "0.1-draft",
    marker_id: markerId,
    source: "participant",
    kind: "phenomenological",
    label: "unexpected_visual_salience",
    data: { intensity_self_rating: 6, nested: { observed: true } },
    note: "Spontaneous report.",
    interpretation_policy: "none_at_capture",
    projection_policy: "journal_only",
  });
});

test("rejects invalid marker metadata and oversized payloads", () => {
  assert.throws(() => createContextMarker({
    markerId,
    source: "analysis",
    kind: "unexpected",
    label: "x",
  }), { code: "MARKER_INVALID" });

  assert.throws(() => createContextMarker({
    markerId,
    source: "runtime",
    kind: "technical",
    label: "large",
    data: { value: "x".repeat(65536) },
  }), { code: "PAYLOAD_LIMIT_EXCEEDED" });
});
