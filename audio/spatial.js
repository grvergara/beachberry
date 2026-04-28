function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getNightWeight(phaseId) {
  return phaseId === "night" || phaseId === "dusk" || phaseId === "dawn" ? 1 : 0.2;
}

export function createSpatialAudioMoodController(options = {}) {
  const state = {
    meterNormalized: 0,
    phaseId: "day",
    moodIntensity: 0.1,
    windGain: 0.25,
    droneGain: 0.14,
    shimmerSend: 0.1,
    lowpassHz: 5200,
    lastCueType: null,
  };
  const subscribers = new Set();

  function emit(reason = "update") {
    const snapshot = getSnapshot();
    for (const subscriber of subscribers) {
      subscriber(snapshot, reason);
    }
  }

  function recompute(reason = "recompute") {
    const nightWeight = getNightWeight(state.phaseId);
    state.moodIntensity = clamp(state.meterNormalized * 0.7 + nightWeight * 0.3, 0, 1);
    state.windGain = clamp(0.2 + state.moodIntensity * 0.5, 0, 1);
    state.droneGain = clamp(0.1 + state.moodIntensity * 0.75, 0, 1);
    state.shimmerSend = clamp(0.06 + state.moodIntensity * 0.8, 0, 1);
    state.lowpassHz = Math.round(clamp(7000 - state.moodIntensity * 5000, 1200, 7000));
    emit(reason);
  }

  function applyMeterSnapshot(snapshot = {}) {
    state.meterNormalized = clamp(snapshot.normalized ?? 0, 0, 1);
    recompute("meter");
  }

  function bindClock(clock) {
    if (!clock || typeof clock.subscribe !== "function") {
      return () => {};
    }
    return clock.subscribe((snapshot) => {
      state.phaseId = snapshot.phaseId ?? "day";
      recompute("clock");
    });
  }

  function bindSpatialCueSource(source) {
    if (!source || typeof source.registerSpatialCueHook !== "function") {
      return () => {};
    }
    return source.registerSpatialCueHook((payload = {}) => {
      state.lastCueType = payload.type ?? null;
      if (payload.type === "vibe-collected") {
        state.shimmerSend = clamp(state.shimmerSend + 0.08, 0, 1);
      }
      emit("cue");
    });
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

  function getSnapshot() {
    return {
      meterNormalized: state.meterNormalized,
      phaseId: state.phaseId,
      moodIntensity: state.moodIntensity,
      windGain: state.windGain,
      droneGain: state.droneGain,
      shimmerSend: state.shimmerSend,
      lowpassHz: state.lowpassHz,
      lastCueType: state.lastCueType,
    };
  }

  // Audio graph wiring is intentionally kept lightweight and abstract for
  // deterministic tests in this jam baseline.
  return {
    applyMeterSnapshot,
    bindClock,
    bindSpatialCueSource,
    subscribe,
    getSnapshot,
  };
}
