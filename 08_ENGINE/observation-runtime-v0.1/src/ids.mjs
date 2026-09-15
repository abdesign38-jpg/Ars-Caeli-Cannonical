export function createId(prefix, randomUuid = globalThis.crypto?.randomUUID) {
  if (typeof randomUuid !== "function") {
    throw new Error("A UUID source is required to create runtime IDs.");
  }
  return `${prefix}-${randomUuid()}`;
}
