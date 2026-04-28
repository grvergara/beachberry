import { randomInRange } from "../content/seeds.js";

const PICKUP_RADIUS = 3;
const DEFAULT_PAINT_MAX_CHARGES = 3;
const DEFAULT_PAINT_CHARGE_DURATION_MS = 25_000;
const DEFAULT_PAINT_RECHARGE_MS = 15_000;
const DEFAULT_PAINT_LOW_METER_THRESHOLD = 0.35;

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
    paintMode: {
      enabled: false,
      charges: 0,
      maxCharges: DEFAULT_PAINT_MAX_CHARGES,
      chargeDurationMs: DEFAULT_PAINT_CHARGE_DURATION_MS,
      rechargeMs: DEFAULT_PAINT_RECHARGE_MS,
      lowMeterThreshold: DEFAULT_PAINT_LOW_METER_THRESHOLD,
      activeChargeStartedAt: 0,
      activeChargeExpiresAt: 0,
      lastRechargeAt: 0,
      lastInvalidReason: null,
      activePlacements: [],
    },
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
      if (vibe.id === "V03") {
        state.paintMode.enabled = true;
        state.paintMode.maxCharges = Number.isFinite(vibe.charges) ? Math.max(1, Math.floor(vibe.charges)) : 3;
        state.paintMode.chargeDurationMs = Number.isFinite(vibe.durationMs)
          ? Math.max(1_000, vibe.durationMs)
          : DEFAULT_PAINT_CHARGE_DURATION_MS;
        state.paintMode.charges = state.paintMode.maxCharges;
        state.paintMode.activeChargeStartedAt = 0;
        state.paintMode.activeChargeExpiresAt = 0;
        state.paintMode.lastRechargeAt = timeNow;
        state.paintMode.lastInvalidReason = null;
        state.paintMode.activePlacements = [];
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
      if (state.activeTemporary.id === "V03") {
        state.paintMode.enabled = false;
        state.paintMode.activeChargeStartedAt = 0;
        state.paintMode.activeChargeExpiresAt = 0;
        state.paintMode.activePlacements = [];
      }
      state.activeTemporary = null;
    }

    if (!state.paintMode.enabled) {
      return;
    }

    state.paintMode.activePlacements = state.paintMode.activePlacements.filter(
      (placement) => placement.expiresAt > currentTime,
    );

    const meterSnapshot = options.getMeterSnapshot?.();
    const meterNormalized = Number.isFinite(meterSnapshot?.normalized) ? meterSnapshot.normalized : 1;
    if (meterNormalized < state.paintMode.lowMeterThreshold) {
      state.paintMode.enabled = false;
      state.paintMode.lastInvalidReason = "meter-too-low";
      state.paintMode.activeChargeStartedAt = 0;
      state.paintMode.activeChargeExpiresAt = 0;
      state.paintMode.activePlacements = [];
      if (state.activeTemporary?.id === "V03") {
        state.activeTemporary = null;
      }
      return;
    }

    if (
      state.paintMode.charges < state.paintMode.maxCharges &&
      meterNormalized <= state.paintMode.lowMeterThreshold + 0.05 &&
      currentTime - state.paintMode.lastRechargeAt >= state.paintMode.rechargeMs
    ) {
      state.paintMode.charges += 1;
      state.paintMode.lastRechargeAt = currentTime;
    }
  }

  function getHudState() {
    return {
      activeTemporary: state.activeTemporary,
      persistentVibes: [...persistentVibes].map((id) => getCatalogEntry(id)).filter(Boolean),
      paintMode: {
        enabled: state.paintMode.enabled,
        charges: state.paintMode.charges,
        maxCharges: state.paintMode.maxCharges,
        chargeDurationMs: state.paintMode.chargeDurationMs,
        activeChargeExpiresAt: state.paintMode.activeChargeExpiresAt,
        activePlacements: state.paintMode.activePlacements.length,
        lastInvalidReason: state.paintMode.lastInvalidReason,
      },
    };
  }

  function beginPaintPlacement(position) {
    const currentTime = nowMs(options.now);
    if (!state.paintMode.enabled) {
      state.paintMode.lastInvalidReason = "paint-unavailable";
      return { ok: false, reason: "paint-unavailable" };
    }
    if (state.paintMode.charges <= 0) {
      state.paintMode.lastInvalidReason = "no-charges";
      return { ok: false, reason: "no-charges" };
    }
    state.paintMode.charges -= 1;
    state.paintMode.activeChargeStartedAt = currentTime;
    state.paintMode.activeChargeExpiresAt = currentTime + state.paintMode.chargeDurationMs;
    state.paintMode.lastRechargeAt = currentTime;
    state.paintMode.lastInvalidReason = null;
    const placement = {
      id: `paint-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: currentTime,
      expiresAt: currentTime + state.paintMode.chargeDurationMs,
      position,
    };
    state.paintMode.activePlacements.push(placement);
    return {
      ok: true,
      placement,
      chargesRemaining: state.paintMode.charges,
      expiresAt: placement.expiresAt,
    };
  }

  function invalidatePaintPlacement(reason) {
    state.paintMode.lastInvalidReason = reason || "invalid-placement";
    return getHudState().paintMode;
  }

  return {
    catalog,
    state,
    spawnInitialPickups,
    collectPickup,
    findPickupInRange,
    update,
    beginPaintPlacement,
    invalidatePaintPlacement,
    getHudState,
    getPaintState: () => ({ ...state.paintMode }),
    getPickups: () => state.pickups,
  };
}

export function createHighDistortionMitigationHooks(options = {}) {
  const cooldownMs = Number.isFinite(options.cooldownMs) ? options.cooldownMs : 20_000;
  const meterReduction = Number.isFinite(options.meterReduction) ? options.meterReduction : 22;
  const now = options.now ?? (() => performance.now());
  const canUseClarityBurst = options.canUseClarityBurst ?? (() => false);
  const onApply = options.onApply ?? (() => {});
  const onUnavailable = options.onUnavailable ?? (() => {});

  const state = {
    cooldownUntil: 0,
    lastAppliedAt: 0,
  };

  function getSnapshot() {
    const timeNow = now();
    return {
      available: timeNow >= state.cooldownUntil,
      cooldownRemainingMs: Math.max(0, state.cooldownUntil - timeNow),
      meterReduction,
    };
  }

  function applyDuringAlignment(context = {}) {
    const timeNow = now();
    if (timeNow < state.cooldownUntil) {
      onUnavailable({ reason: "cooldown", snapshot: getSnapshot(), context });
      return null;
    }
    if (!canUseClarityBurst()) {
      onUnavailable({ reason: "missing-clarity", snapshot: getSnapshot(), context });
      return null;
    }

    state.lastAppliedAt = timeNow;
    state.cooldownUntil = timeNow + cooldownMs;
    const payload = {
      meterDelta: -Math.abs(meterReduction),
      snapshot: getSnapshot(),
      context,
    };
    onApply(payload);
    return payload;
  }

  return {
    state,
    getSnapshot,
    applyDuringAlignment,
  };
}
