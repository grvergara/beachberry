import { randomInRange } from "../content/seeds.js";

const PICKUP_RADIUS = 3;

const BASE_PICKUP_CATALOG = Object.freeze([
  {
    id: "V01",
    name: "Bridge Echo",
    type: "temporary",
    durationMs: 45_000,
    cooldownMs: 90_000,
    icon: "bridge",
    meterDelta: 18,
    onboarding: true,
    spatialCue: "bridge-echo",
  },
  {
    id: "V02",
    name: "Clarity Burst",
    type: "temporary",
    durationMs: 20_000,
    cooldownMs: 60_000,
    icon: "clarity",
    meterDelta: -30,
    onboarding: true,
    spatialCue: "clarity-burst",
  },
  {
    id: "V03",
    name: "Paint Weaver",
    type: "temporary",
    durationMs: 25_000,
    icon: "paint",
    meterDelta: 10,
    charges: 3,
    onboarding: false,
    spatialCue: "paint-weaver",
  },
  {
    id: "V04",
    name: "Layer Key",
    type: "persistent",
    icon: "key",
    meterDelta: 8,
    onboarding: false,
    spatialCue: "layer-key",
  },
  {
    id: "V05",
    name: "Fractal Pulse",
    type: "temporary",
    durationMs: 30_000,
    cooldownMs: 120_000,
    icon: "pulse",
    meterDelta: 40,
    onboarding: false,
    spatialCue: "fractal-pulse",
  },
  {
    id: "V06",
    name: "Void Whisper",
    type: "persistent",
    icon: "void",
    meterDelta: 5,
    onboarding: false,
    spatialCue: "void-whisper",
  },
]);

const FIRST_RUN_SPAWN_POINTS = Object.freeze([
  { x: -28, y: 0, z: -12 },
  { x: 16, y: 0, z: -4 },
]);

function nowMs(optionsNow) {
  return typeof optionsNow === "function" ? optionsNow() : performance.now();
}

function clonePickupSpawn(source, position) {
  return {
    id: `${source.id}-${Math.random().toString(36).slice(2, 8)}`,
    vibeId: source.id,
    name: source.name,
    icon: source.icon,
    position,
    radius: PICKUP_RADIUS,
    collected: false,
  };
}

export function createVibeSystem(options = {}) {
  const catalog = options.catalog ?? BASE_PICKUP_CATALOG;
  const rng = options.rng;
  const onSpatialCue = options.onSpatialCue ?? (() => {});

  const pickupById = new Map();
  const cooldownUntilByVibe = new Map();
  const persistentVibes = new Set();

  const state = {
    activeTemporary: null,
    pickups: [],
  };

  function getCatalogEntry(vibeId) {
    return catalog.find((item) => item.id === vibeId);
  }

  function spawnInitialPickups() {
    const starters = catalog.filter((item) => item.onboarding).slice(0, FIRST_RUN_SPAWN_POINTS.length);
    const spawned = starters.map((source, index) => {
      const base = FIRST_RUN_SPAWN_POINTS[index];
      const jitter = rng
        ? { x: randomInRange(rng, -2.5, 2.5), z: randomInRange(rng, -2.5, 2.5) }
        : { x: 0, z: 0 };
      return clonePickupSpawn(source, {
        x: base.x + jitter.x,
        y: base.y,
        z: base.z + jitter.z,
      });
    });

    state.pickups = spawned;
    pickupById.clear();
    for (const pickup of spawned) {
      pickupById.set(pickup.id, pickup);
    }
    return spawned;
  }

  function canActivateTemporary(vibe, timeNow) {
    const cooldownUntil = cooldownUntilByVibe.get(vibe.id) ?? 0;
    return cooldownUntil <= timeNow;
  }

  function collectPickup(pickupId) {
    const pickup = pickupById.get(pickupId);
    if (!pickup || pickup.collected) {
      return null;
    }

    const vibe = getCatalogEntry(pickup.vibeId);
    if (!vibe) {
      return null;
    }

    const timeNow = nowMs(options.now);
    pickup.collected = true;

    if (vibe.type === "persistent") {
      persistentVibes.add(vibe.id);
    } else if (canActivateTemporary(vibe, timeNow)) {
      // Only one temporary effect can be active; collecting a new one replaces the previous.
      state.activeTemporary = {
        id: vibe.id,
        name: vibe.name,
        icon: vibe.icon,
        startedAt: timeNow,
        expiresAt: timeNow + (vibe.durationMs ?? 0),
      };
      if (vibe.cooldownMs) {
        cooldownUntilByVibe.set(vibe.id, timeNow + vibe.cooldownMs);
      }
    }

    onSpatialCue({
      type: "pickup-collected",
      vibeId: vibe.id,
      cue: vibe.spatialCue,
      position: pickup.position,
    });

    return {
      pickup,
      vibe,
      meterDelta: vibe.meterDelta ?? 0,
      activeTemporary: state.activeTemporary,
      persistentVibes: [...persistentVibes],
    };
  }

  function findPickupInRange(position) {
    for (const pickup of state.pickups) {
      if (pickup.collected) {
        continue;
      }
      const dx = pickup.position.x - position.x;
      const dz = pickup.position.z - position.z;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq <= pickup.radius * pickup.radius) {
        return pickup;
      }
    }
    return null;
  }

  function update() {
    const currentTime = nowMs(options.now);
    if (state.activeTemporary && currentTime >= state.activeTemporary.expiresAt) {
      state.activeTemporary = null;
    }
  }

  function getHudState() {
    return {
      activeTemporary: state.activeTemporary,
      persistentVibes: [...persistentVibes].map((id) => getCatalogEntry(id)).filter(Boolean),
    };
  }

  return {
    catalog,
    state,
    spawnInitialPickups,
    collectPickup,
    findPickupInRange,
    update,
    getHudState,
    getPickups: () => state.pickups,
  };
}
