const MIN_METER = 0;
const MAX_METER = 100;
const DEFAULT_RESIDUAL_FLOOR = 6;
const DEFAULT_BLEED_THRESHOLDS = Object.freeze([
  { minValue: 25, suggestLayer: "psy", intensity: "low" },
  { minValue: 55, suggestLayer: "fractal", intensity: "medium" },
  { minValue: 80, suggestLayer: "void", intensity: "high" },
]);

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
  const bleedListeners = new Set();
  const bleedThresholds = [...(options.bleedThresholds ?? DEFAULT_BLEED_THRESHOLDS)].sort(
    (a, b) => a.minValue - b.minValue,
  );

  const state = {
    value: clamp(options.initialValue ?? residualFloor, residualFloor, MAX_METER),
    residualFloor,
    lastUpdatedAt: performance.now(),
    bleedSuggestion: null,
  };

  function emit(reason = "update") {
    const snapshot = getSnapshot();
    for (const listener of listeners) {
      listener(snapshot, reason);
    }
    emitBleedSuggestion(reason, snapshot);
  }

  function computeBleedSuggestion(value) {
    let selected = null;
    for (const threshold of bleedThresholds) {
      if (value >= threshold.minValue) {
        selected = threshold;
      }
    }
    if (!selected) {
      return null;
    }
    return {
      suggestLayer: selected.suggestLayer,
      intensity: selected.intensity,
      thresholdValue: selected.minValue,
      meterValue: value,
      playerAgencyRetained: true,
    };
  }

  function emitBleedSuggestion(reason, snapshot = getSnapshot()) {
    const suggestion = computeBleedSuggestion(snapshot.value);
    const changed =
      state.bleedSuggestion?.suggestLayer !== suggestion?.suggestLayer ||
      state.bleedSuggestion?.intensity !== suggestion?.intensity;
    state.bleedSuggestion = suggestion;
    if (!changed) {
      return;
    }
    for (const listener of bleedListeners) {
      listener(
        {
          suggestion,
          meterValue: snapshot.value,
          playerAgencyRetained: true,
        },
        reason,
      );
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
      bleedSuggestion: state.bleedSuggestion,
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

  function subscribeBleedSuggestion(listener, emitImmediately = true) {
    if (typeof listener !== "function") {
      return () => {};
    }
    bleedListeners.add(listener);
    if (emitImmediately) {
      listener(
        {
          suggestion: computeBleedSuggestion(state.value),
          meterValue: state.value,
          playerAgencyRetained: true,
        },
        "subscribe",
      );
    }
    return () => bleedListeners.delete(listener);
  }

  return {
    state,
    getSnapshot,
    setValue,
    applyDelta,
    subscribe,
    subscribeBleedSuggestion,
  };
}
