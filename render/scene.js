const DEFAULT_FOV_DEGREES = 70;
const DEFAULT_NEAR = 0.1;
const DEFAULT_FAR = 4000;
const DEFAULT_MAX_DPR = 2;
const DEFAULT_LAYER_IDS = Object.freeze(["real", "psy", "fractal", "void"]);
const DEFAULT_COLLIDER_MASK_BY_LAYER = Object.freeze({
  real: "collider-real",
  psy: "collider-real+psy",
  fractal: "collider-real+psy+fractal",
  void: "collider-full",
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getViewportSize(canvas) {
  const width = canvas.clientWidth || window.innerWidth || 1;
  const height = canvas.clientHeight || window.innerHeight || 1;
  return { width, height };
}

function normalizeLayerTag(tags = []) {
  const layerSet = new Set();
  for (const tag of tags) {
    if (typeof tag === "string" && tag.length > 0) {
      layerSet.add(tag);
    }
  }
  if (layerSet.size === 0) {
    layerSet.add("real");
  }
  return [...layerSet];
}

export function createSceneLifecycle(canvas, options = {}) {
  if (!canvas) {
    throw new Error("createSceneLifecycle requires a canvas.");
  }

  const maxDpr = options.maxDpr ?? DEFAULT_MAX_DPR;
  const dpr = clamp(window.devicePixelRatio || 1, 1, maxDpr);
  const viewport = getViewportSize(canvas);

  const camera = {
    fovDegrees: options.fovDegrees ?? DEFAULT_FOV_DEGREES,
    near: options.near ?? DEFAULT_NEAR,
    far: options.far ?? DEFAULT_FAR,
    aspect: viewport.width / viewport.height,
  };

  const scene = {
    createdAt: performance.now(),
    updateCallbacks: new Set(),
  };

  const renderer = {
    canvas,
    context:
      canvas.getContext("webgl2", { antialias: true }) ||
      canvas.getContext("webgl", { antialias: true }),
    dpr,
    width: viewport.width,
    height: viewport.height,
    isContextReady: false,
  };

  renderer.isContextReady = Boolean(renderer.context);

  let animationFrameId = null;
  let lastFrameTime = performance.now();
  let isRunning = false;

  function resize() {
    const nextViewport = getViewportSize(canvas);
    renderer.width = nextViewport.width;
    renderer.height = nextViewport.height;
    camera.aspect = nextViewport.width / nextViewport.height;
    canvas.width = Math.round(nextViewport.width * renderer.dpr);
    canvas.height = Math.round(nextViewport.height * renderer.dpr);
    return { width: nextViewport.width, height: nextViewport.height, dpr: renderer.dpr };
  }

  function tick(now) {
    if (!isRunning) {
      return;
    }

    const deltaMs = now - lastFrameTime;
    lastFrameTime = now;
    for (const callback of scene.updateCallbacks) {
      callback(deltaMs, now);
    }
    animationFrameId = window.requestAnimationFrame(tick);
  }

  function start() {
    if (isRunning) {
      return;
    }
    isRunning = true;
    lastFrameTime = performance.now();
    animationFrameId = window.requestAnimationFrame(tick);
  }

  function stop() {
    isRunning = false;
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function onUpdate(callback) {
    scene.updateCallbacks.add(callback);
    return () => scene.updateCallbacks.delete(callback);
  }

  function dispose() {
    stop();
    scene.updateCallbacks.clear();
    window.removeEventListener("resize", resize);
  }

  resize();
  window.addEventListener("resize", resize);

  return {
    renderer,
    camera,
    scene,
    resize,
    start,
    stop,
    onUpdate,
    dispose,
  };
}

export function createLayerSceneState(options = {}) {
  const layerIds = options.layerIds ?? DEFAULT_LAYER_IDS;
  const colliderMaskByLayer = options.colliderMaskByLayer ?? DEFAULT_COLLIDER_MASK_BY_LAYER;
  const visibilityEntries = new Map();
  let activeLayer = layerIds[0] ?? "real";

  function registerSceneNode(nodeId, nodeConfig = {}) {
    if (!nodeId) {
      return null;
    }
    const layers = normalizeLayerTag(nodeConfig.layers);
    const collidable = nodeConfig.collidable !== false;
    const visible = layers.includes(activeLayer);
    const entry = {
      id: nodeId,
      layers,
      collidable,
      visible,
    };
    visibilityEntries.set(nodeId, entry);
    return { ...entry };
  }

  function setActiveLayer(layerId) {
    if (!layerIds.includes(layerId)) {
      return getSnapshot();
    }
    activeLayer = layerId;
    for (const entry of visibilityEntries.values()) {
      entry.visible = entry.layers.includes(activeLayer);
    }
    return getSnapshot();
  }

  function getVisibleNodeIds() {
    return [...visibilityEntries.values()]
      .filter((entry) => entry.visible)
      .map((entry) => entry.id);
  }

  function getColliderMask() {
    return colliderMaskByLayer[activeLayer] ?? colliderMaskByLayer.real;
  }

  function getCollidableNodeIds() {
    return [...visibilityEntries.values()]
      .filter((entry) => entry.visible && entry.collidable)
      .map((entry) => entry.id);
  }

  function getSnapshot() {
    return {
      activeLayer,
      colliderMask: getColliderMask(),
      visibleNodeIds: getVisibleNodeIds(),
      collidableNodeIds: getCollidableNodeIds(),
    };
  }

  return {
    registerSceneNode,
    setActiveLayer,
    getColliderMask,
    getVisibleNodeIds,
    getCollidableNodeIds,
    getSnapshot,
  };
}

function lerp(min, max, t) {
  return min + (max - min) * t;
}

function clamp01(value) {
  return clamp(Number.isFinite(value) ? value : 0, 0, 1);
}

function createLandmarkLights(phaseId) {
  const activeAtNight = phaseId === "night" || phaseId === "dusk" || phaseId === "dawn";
  return {
    bridgeLights: activeAtNight,
    skylineBloom: activeAtNight,
    palaceSilhouetteBoost: activeAtNight,
  };
}

export function createDayNightSceneController(options = {}) {
  const state = {
    clock: null,
    meterNormalized: 0,
    phase: 0.35,
    phaseId: "day",
    skyBlend: 0.15,
    skySaturation: 0.35,
    skyMotion: 0.18,
    ambientLight: 0.8,
    landmarkLights: createLandmarkLights("day"),
    reducedMotion: Boolean(options.reducedMotion),
    intensityScale: clamp01(options.intensityScale ?? 1),
  };
  const subscribers = new Set();

  function emit(reason = "update") {
    const snapshot = getSnapshot();
    for (const subscriber of subscribers) {
      subscriber(snapshot, reason);
    }
  }

  function recompute(reason = "recompute") {
    const phaseDistanceFromNoon = Math.abs(state.phase - 0.5) * 2;
    const nightFactor = clamp01(1 - Math.abs(state.phase - 0.5) * 2.5);
    const moodIntensity = clamp01((state.meterNormalized * 0.65 + nightFactor * 0.35) * state.intensityScale);
    const motionMultiplier = state.reducedMotion ? 0.35 : 1;
    state.skyBlend = clamp01(lerp(0.1, 0.92, moodIntensity));
    state.skySaturation = clamp01(lerp(0.25, 1, moodIntensity));
    state.skyMotion = clamp01(lerp(0.12, 0.95, moodIntensity * motionMultiplier));
    state.ambientLight = clamp01(lerp(0.95, 0.24, phaseDistanceFromNoon));
    state.landmarkLights = createLandmarkLights(state.phaseId);
    emit(reason);
  }

  function bindClock(clock) {
    state.clock = clock ?? null;
    if (!clock || typeof clock.subscribe !== "function") {
      return () => {};
    }
    return clock.subscribe((snapshot) => {
      state.phase = snapshot.phase;
      state.phaseId = snapshot.phaseId;
      recompute("clock");
    });
  }

  function applyMeterSnapshot(snapshot = {}) {
    state.meterNormalized = clamp01(snapshot.normalized);
    recompute("meter");
  }

  function setComfortOptions(comfort = {}) {
    state.reducedMotion = Boolean(comfort.reducedMotion);
    state.intensityScale = clamp01(comfort.intensityScale ?? state.intensityScale);
    recompute("comfort");
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

  function getSnapshot() {
    return {
      phase: state.phase,
      phaseId: state.phaseId,
      skyBlend: state.skyBlend,
      skySaturation: state.skySaturation,
      skyMotion: state.skyMotion,
      ambientLight: state.ambientLight,
      landmarkLights: { ...state.landmarkLights },
      reducedMotion: state.reducedMotion,
      intensityScale: state.intensityScale,
      meterNormalized: state.meterNormalized,
    };
  }

  return {
    bindClock,
    applyMeterSnapshot,
    setComfortOptions,
    subscribe,
    getSnapshot,
  };
}
