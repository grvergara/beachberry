const DEFAULT_LAYER_ORDER = Object.freeze(["real", "psy", "fractal", "void"]);
const DEFAULT_MANUAL_SWITCH_COOLDOWN_MS = 8_000;
const LAYER_KEY_VIBE_ID = "V04";

const DEFAULT_LAYER_GRAPH = Object.freeze({
  real: ["psy"],
  psy: ["real", "fractal"],
  fractal: ["psy", "void"],
  void: ["fractal"],
});

const DEFAULT_FALLBACK_ROUTES = Object.freeze({
  real: ["real"],
  psy: ["psy", "real"],
  fractal: ["fractal", "psy", "real"],
  void: ["void", "fractal", "psy", "real"],
});

function isFiniteNumber(value) {
  return Number.isFinite(value);
}

function clampToKnownLayer(layer, layerOrder) {
  if (layerOrder.includes(layer)) {
    return layer;
  }
  return layerOrder[0];
}

export function createLayerStateMachine(options = {}) {
  const now = options.now ?? (() => performance.now());
  const layerOrder = options.layerOrder ?? DEFAULT_LAYER_ORDER;
  const layerGraph = options.layerGraph ?? DEFAULT_LAYER_GRAPH;
  const fallbackRoutes = options.fallbackRoutes ?? DEFAULT_FALLBACK_ROUTES;
  const manualCooldownMs = isFiniteNumber(options.manualCooldownMs)
    ? Math.max(0, options.manualCooldownMs)
    : DEFAULT_MANUAL_SWITCH_COOLDOWN_MS;
  const onLayerChanged = options.onLayerChanged ?? (() => {});
  const onLockoutFeedback = options.onLockoutFeedback ?? (() => {});

  const unlockedLayers = new Set([layerOrder[0]]);
  const state = {
    currentLayer: layerOrder[0],
    lastManualSwitchAt: Number.NEGATIVE_INFINITY,
    lastManualLockoutUntil: 0,
    bleedSuggestion: null,
  };

  function getManualCooldownRemainingMs(timeNow = now()) {
    const availableAt = state.lastManualSwitchAt + manualCooldownMs;
    return Math.max(0, availableAt - timeNow);
  }

  function getSnapshot() {
    const timeNow = now();
    return {
      currentLayer: state.currentLayer,
      unlockedLayers: [...unlockedLayers],
      manualCooldownMs,
      manualCooldownRemainingMs: getManualCooldownRemainingMs(timeNow),
      manualSwitchLockedOut: getManualCooldownRemainingMs(timeNow) > 0,
      manualSwitchReadyAt:
        state.lastManualSwitchAt === Number.NEGATIVE_INFINITY
          ? timeNow
          : state.lastManualSwitchAt + manualCooldownMs,
      bleedSuggestion: state.bleedSuggestion,
      fallbackRoute: getFallbackRoute(state.currentLayer),
    };
  }

  function isLayerUnlocked(layerId) {
    return unlockedLayers.has(layerId);
  }

  function unlockLayer(layerId, reason = "unlock") {
    if (!layerOrder.includes(layerId)) {
      return getSnapshot();
    }
    unlockedLayers.add(layerId);
    return {
      ...getSnapshot(),
      unlockReason: reason,
      unlockedLayer: layerId,
    };
  }

  function canTransition(fromLayer, toLayer) {
    const allowedTargets = layerGraph[fromLayer] ?? [];
    return allowedTargets.includes(toLayer);
  }

  function getFallbackRoute(layerId) {
    const route = fallbackRoutes[layerId] ?? [layerOrder[0]];
    return route.filter((entry) => layerOrder.includes(entry));
  }

  function changeLayer(nextLayer, reason = "transition", metadata = {}) {
    const clampedLayer = clampToKnownLayer(nextLayer, layerOrder);
    if (clampedLayer === state.currentLayer) {
      return {
        changed: false,
        reason: "already-active",
        snapshot: getSnapshot(),
      };
    }
    state.currentLayer = clampedLayer;
    const snapshot = getSnapshot();
    onLayerChanged({
      previousLayer: metadata.previousLayer ?? null,
      currentLayer: clampedLayer,
      reason,
      snapshot,
    });
    return {
      changed: true,
      reason,
      snapshot,
    };
  }

  function requestManualSwitch(targetLayer, context = {}) {
    const timeNow = now();
    if (!context.ownedVibes?.includes(LAYER_KEY_VIBE_ID)) {
      onLockoutFeedback({
        code: "missing-layer-key",
        message: "Layer Key required for manual transitions.",
        cooldownRemainingMs: 0,
      });
      return {
        ok: false,
        code: "missing-layer-key",
        snapshot: getSnapshot(),
      };
    }

    const target = clampToKnownLayer(targetLayer, layerOrder);
    if (!isLayerUnlocked(target)) {
      onLockoutFeedback({
        code: "layer-locked",
        message: `${target} layer is not unlocked yet.`,
        cooldownRemainingMs: 0,
      });
      return {
        ok: false,
        code: "layer-locked",
        snapshot: getSnapshot(),
      };
    }

    const cooldownRemainingMs = getManualCooldownRemainingMs(timeNow);
    if (cooldownRemainingMs > 0) {
      state.lastManualLockoutUntil = timeNow + cooldownRemainingMs;
      onLockoutFeedback({
        code: "cooldown",
        message: `Layer switch cooling down (${Math.ceil(cooldownRemainingMs / 1000)}s).`,
        cooldownRemainingMs,
      });
      return {
        ok: false,
        code: "cooldown",
        cooldownRemainingMs,
        snapshot: getSnapshot(),
      };
    }

    if (!canTransition(state.currentLayer, target)) {
      onLockoutFeedback({
        code: "invalid-transition",
        message: `Cannot switch from ${state.currentLayer} to ${target} directly.`,
        cooldownRemainingMs: 0,
      });
      return {
        ok: false,
        code: "invalid-transition",
        snapshot: getSnapshot(),
      };
    }

    const previousLayer = state.currentLayer;
    state.lastManualSwitchAt = timeNow;
    const result = changeLayer(target, "manual-switch", { previousLayer });
    return {
      ok: result.changed,
      code: result.changed ? "switched" : "already-active",
      snapshot: result.snapshot,
    };
  }

  function ensureSafeRoute(preferredLayer = state.currentLayer) {
    const fallbackRoute = getFallbackRoute(preferredLayer).filter((layerId) => isLayerUnlocked(layerId));
    const safeLayer = fallbackRoute.at(-1) ?? layerOrder[0];
    if (state.currentLayer !== safeLayer) {
      changeLayer(safeLayer, "safety-fallback", { previousLayer: state.currentLayer });
    }
    return {
      safeLayer,
      fallbackRoute,
      snapshot: getSnapshot(),
    };
  }

  function applyPuzzleReward(reward = {}) {
    const unlockedLayer = reward.unlockLayer;
    if (unlockedLayer) {
      unlockLayer(unlockedLayer, "puzzle-reward");
    }
    if (reward.unlockLayer && canTransition(state.currentLayer, reward.unlockLayer)) {
      changeLayer(reward.unlockLayer, "puzzle-reward", { previousLayer: state.currentLayer });
    }
    return getSnapshot();
  }

  function setBleedSuggestion(nextSuggestion = null) {
    state.bleedSuggestion = nextSuggestion;
    return getSnapshot();
  }

  return {
    state,
    getSnapshot,
    isLayerUnlocked,
    unlockLayer,
    canTransition,
    getFallbackRoute,
    requestManualSwitch,
    ensureSafeRoute,
    applyPuzzleReward,
    setBleedSuggestion,
  };
}

export {
  DEFAULT_LAYER_ORDER,
  DEFAULT_LAYER_GRAPH,
  DEFAULT_FALLBACK_ROUTES,
  DEFAULT_MANUAL_SWITCH_COOLDOWN_MS,
  LAYER_KEY_VIBE_ID,
};
