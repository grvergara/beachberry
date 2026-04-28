const MIN_METER = 0;
const MAX_METER = 100;
const DEFAULT_RESIDUAL_FLOOR = 6;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createVibeMeter(options = {}) {
  const residualFloor = clamp(
    Number.isFinite(options.residualFloor) ? options.residualFloor : DEFAULT_RESIDUAL_FLOOR,
    1,
    35,
  );
  const listeners = new Set();

  const state = {
    value: clamp(options.initialValue ?? residualFloor, residualFloor, MAX_METER),
    residualFloor,
    lastUpdatedAt: performance.now(),
  };

  function emit(reason = "update") {
    const snapshot = getSnapshot();
    for (const listener of listeners) {
      listener(snapshot, reason);
    }
  }

  function getSnapshot() {
    const normalized = state.value / MAX_METER;
    const groundedRatio = Math.max(state.residualFloor / MAX_METER, 1 - normalized);
    const psyIntensity = Math.max(state.residualFloor / MAX_METER, normalized);
    return {
      value: state.value,
      normalized,
      residualFloor: state.residualFloor,
      groundedRatio,
      psyIntensity,
      lastUpdatedAt: state.lastUpdatedAt,
    };
  }

  function setValue(nextValue, reason = "set") {
    const bounded = clamp(nextValue, state.residualFloor, MAX_METER);
    if (bounded === state.value) {
      return getSnapshot();
    }
    state.value = bounded;
    state.lastUpdatedAt = performance.now();
    emit(reason);
    return getSnapshot();
  }

  function applyDelta(delta, reason = "delta") {
    return setValue(state.value + delta, reason);
  }

  function subscribe(listener, emitImmediately = true) {
    if (typeof listener !== "function") {
      return () => {};
    }
    listeners.add(listener);
    if (emitImmediately) {
      listener(getSnapshot(), "subscribe");
    }
    return () => listeners.delete(listener);
  }

  return {
    state,
    getSnapshot,
    setValue,
    applyDelta,
    subscribe,
  };
}
