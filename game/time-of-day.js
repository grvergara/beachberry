const DEFAULT_DAY_LENGTH_MS = 180000;
const DEFAULT_TIME_SCALE = 1;

const PHASE_DEFINITIONS = Object.freeze([
  { id: "night", start: 0, end: 0.2 },
  { id: "dawn", start: 0.2, end: 0.3 },
  { id: "day", start: 0.3, end: 0.7 },
  { id: "dusk", start: 0.7, end: 0.8 },
  { id: "night", start: 0.8, end: 1 },
]);

function normalizePhase(raw) {
  if (!Number.isFinite(raw)) {
    return 0;
  }
  const wrapped = raw % 1;
  return wrapped < 0 ? wrapped + 1 : wrapped;
}

function resolvePhaseId(phase) {
  const normalized = normalizePhase(phase);
  const match = PHASE_DEFINITIONS.find((entry) => normalized >= entry.start && normalized < entry.end);
  return match?.id ?? "day";
}

export function createTimeOfDayClock(options = {}) {
  const dayLengthMs = Math.max(20000, options.dayLengthMs ?? DEFAULT_DAY_LENGTH_MS);
  let timeScale = Number.isFinite(options.timeScale) ? Math.max(0, options.timeScale) : DEFAULT_TIME_SCALE;
  let phase = normalizePhase(options.initialPhase ?? 0.35);
  let elapsedMs = 0;
  let phaseId = resolvePhaseId(phase);
  let lastUpdatedAt = performance.now();
  const subscribers = new Set();
  const phaseHooks = new Map();

  function getSnapshot() {
    return {
      phase,
      phaseId,
      timeScale,
      elapsedMs,
      dayLengthMs,
      isNight: phaseId === "night",
      isDay: phaseId === "day",
      lastUpdatedAt,
    };
  }

  function emit(reason = "update") {
    const snapshot = getSnapshot();
    for (const subscriber of subscribers) {
      subscriber(snapshot, reason);
    }
  }

  function emitPhaseHook(nextPhaseId, reason) {
    const hooks = phaseHooks.get(nextPhaseId);
    if (!hooks || hooks.size === 0) {
      return;
    }
    const snapshot = getSnapshot();
    for (const hook of hooks) {
      hook(snapshot, reason);
    }
  }

  function setPhase(nextPhase, reason = "set-phase") {
    const normalized = normalizePhase(nextPhase);
    phase = normalized;
    elapsedMs = normalized * dayLengthMs;
    lastUpdatedAt = performance.now();
    const previousPhaseId = phaseId;
    phaseId = resolvePhaseId(normalized);
    emit(reason);
    if (phaseId !== previousPhaseId) {
      emitPhaseHook(phaseId, reason);
    }
    return getSnapshot();
  }

  function update(deltaMs, reason = "tick") {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0 || timeScale <= 0) {
      return getSnapshot();
    }
    const previousPhaseId = phaseId;
    elapsedMs += deltaMs * timeScale;
    phase = normalizePhase(elapsedMs / dayLengthMs);
    lastUpdatedAt = performance.now();
    phaseId = resolvePhaseId(phase);
    emit(reason);
    if (phaseId !== previousPhaseId) {
      emitPhaseHook(phaseId, reason);
    }
    return getSnapshot();
  }

  function subscribe(listener, emitImmediately = true) {
    if (typeof listener !== "function") {
      return () => {};
    }
    subscribers.add(listener);
    if (emitImmediately) {
      listener(getSnapshot(), "subscribe");
    }
    return () => subscribers.delete(listener);
  }

  function registerPhaseHook(targetPhaseId, hook) {
    if (!targetPhaseId || typeof hook !== "function") {
      return () => {};
    }
    if (!phaseHooks.has(targetPhaseId)) {
      phaseHooks.set(targetPhaseId, new Set());
    }
    const hooks = phaseHooks.get(targetPhaseId);
    hooks.add(hook);
    return () => hooks.delete(hook);
  }

  function setTimeScale(nextTimeScale) {
    if (!Number.isFinite(nextTimeScale)) {
      return getSnapshot();
    }
    timeScale = Math.max(0, nextTimeScale);
    emit("time-scale");
    return getSnapshot();
  }

  return {
    getSnapshot,
    subscribe,
    update,
    setPhase,
    setTimeScale,
    registerPhaseHook,
  };
}
