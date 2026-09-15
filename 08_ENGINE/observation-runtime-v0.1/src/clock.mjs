export function systemClock() {
  const epochId = globalThis.crypto?.randomUUID?.() ?? `epoch-${Date.now()}`;
  const origin = globalThis.performance?.timeOrigin ?? Date.now();

  return Object.freeze({
    nowMonotonicMs: () => globalThis.performance?.now?.() ?? Date.now() - origin,
    wallTimeRfc3339: () => new Date().toISOString(),
    performanceTimeOriginMs: () => origin,
    runtimeEpochId: () => epochId,
  });
}
