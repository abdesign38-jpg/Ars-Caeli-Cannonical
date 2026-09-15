import { canonicalizeJson } from "./canonical-json.mjs";
import { ObservationRuntimeError } from "./errors.mjs";
import { guardArtifact } from "./d0-runtime-guards.mjs";

const SCHEMA_IDS = {
  perceptual_stimulus: "https://ars-caeli.local/contracts/v0.2/perceptual-stimulus.schema.json",
  behavioral_probe: "https://ars-caeli.local/contracts/v0.2/behavioral-probe.schema.json",
  behavioral_trial: "https://ars-caeli.local/contracts/v0.2/behavioral-trial.schema.json",
};

async function sha256(canonical) {
  if (!globalThis.crypto?.subtle) {
    throw new ObservationRuntimeError("HASHING_UNAVAILABLE", "WebCrypto SHA-256 is required for artifact identity.");
  }
  const bytes = new TextEncoder().encode(canonical);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createArtifactProvider({ loadProbe, loadTrial, loadStimulus }) {
  async function load(loader, id, artifactType) {
    if (typeof loader !== "function") throw new ObservationRuntimeError("ARTIFACT_NOT_FOUND", `${artifactType} loader is unavailable.`);
    const source = await loader(id);
    const document = source?.document ?? source;
    if (!document) throw new ObservationRuntimeError("ARTIFACT_NOT_FOUND", `${artifactType} not found: ${id}`);
    guardArtifact(artifactType, document);
    const artifactId = document.artifact_id ?? document.probe_id ?? document.trial_id ?? id;
    const canonical = canonicalizeJson(document);
    const sha256Value = await sha256(canonical);
    if (source?.sha256 && source.sha256 !== sha256Value) {
      throw new ObservationRuntimeError("ARTIFACT_HASH_MISMATCH", `Stale hash for ${artifactType}: ${artifactId}`);
    }
    return {
      snapshot_schema_version: "0.1-draft",
      artifact_id: artifactId,
      artifact_type: artifactType,
      canonical_schema_id: SCHEMA_IDS[artifactType],
      sha256: sha256Value,
      document: structuredClone(document),
    };
  }

  return Object.freeze({
    loadProbe: (id) => load(loadProbe, id, "behavioral_probe"),
    loadTrial: (id) => load(loadTrial, id, "behavioral_trial"),
    loadStimulus: (id) => load(loadStimulus, id, "perceptual_stimulus"),
  });
}
