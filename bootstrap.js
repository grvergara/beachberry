import { createSeededRandom, createRunSeed } from "./content/seeds.js";
import { createPickupCollectionLoop, createPlayerController } from "./game/player.js";
import { createTimeOfDayClock } from "./game/time-of-day.js";
import { createVibeMeter } from "./game/vibe-meter.js";
import { createVibeSystem } from "./game/vibes.js";
import { createSpatialAudioMoodController } from "./audio/spatial.js";
import { createPostComposer } from "./render/post.js";
import { createDayNightSceneController, createSceneLifecycle } from "./render/scene.js";
import { createHud } from "./ui/hud.js";
import { createTerrainTilesSystem } from "./world/terrain-tiles.js";

const GAME_ROOT_ID = "game-root";
const JAM_WIDGET_MOUNT_ID = "jam-widget-mount";

export const DEFAULT_FEATURE_FLAGS = Object.freeze({
  echoesEnabled: false,
  reducedMotion: false,
  highContrastUi: false,
  postProcessingEnabled: true,
});

function resolveFeatureFlags(override = {}) {
  return {
    ...DEFAULT_FEATURE_FLAGS,
    ...override,
  };
}

function createRuntimeShell() {
  const gameRoot = document.getElementById(GAME_ROOT_ID);
  const jamWidgetMount = document.getElementById(JAM_WIDGET_MOUNT_ID);

  if (!gameRoot) {
    throw new Error(`Missing required #${GAME_ROOT_ID} element.`);
  }

  const canvas = document.createElement("canvas");
  canvas.id = "game-canvas";
  canvas.setAttribute("aria-label", "Presidio Psy render surface");
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  gameRoot.appendChild(canvas);

  if (!jamWidgetMount) {
    console.warn("Jam widget mount is missing. Embed may be non-compliant.");
  }

  return { gameRoot, canvas, jamWidgetMount };
}

function startRuntime() {
  const { gameRoot, canvas, jamWidgetMount } = createRuntimeShell();
  const runSeed = createRunSeed("presidio");
  const rng = createSeededRandom(runSeed);
  const featureFlags = resolveFeatureFlags(window.__PRESIDIO_FLAGS__);

  const sceneLifecycle = createSceneLifecycle(canvas);
  const clock = createTimeOfDayClock({
    dayLengthMs: 160000,
  });
  const postComposer = createPostComposer({
    distortionFloor: 0.05,
  });
  const dayNightScene = createDayNightSceneController();
  const playerController = createPlayerController(canvas);
  const hud = createHud(gameRoot);
  const spatialAudio = createSpatialAudioMoodController();
  const terrainTiles = createTerrainTilesSystem();
  const vibeMeter = createVibeMeter({ residualFloor: 6, initialValue: 10 });
  const vibeSystem = createVibeSystem({
    rng,
    onSpatialCue: (payload) => hud.emitSpatialCue(payload),
  });
  const pickupLoop = createPickupCollectionLoop({
    playerController,
    vibeMeter,
    vibeSystem,
    hud,
  });

  postComposer.registerPass("residual-floor");
  const stopClockSceneSync = dayNightScene.bindClock(clock);
  const stopClockAudioSync = spatialAudio.bindClock(clock);
  const stopCueAudioSync = spatialAudio.bindSpatialCueSource(hud);
  const stopHudComfortSync = hud.registerComfortChangeHook((comfort) => {
    dayNightScene.setComfortOptions(comfort);
  });
  const stopDayNightHudSync = dayNightScene.subscribe((snapshot) => {
    hud.setDayNightCue({
      phaseId: snapshot.phaseId,
      intensityScale: snapshot.intensityScale,
    });
  });
  vibeSystem.spawnInitialPickups();
  hud.setPrompt("Tap or click to enter the park.");
  hud.setVibeHudState(vibeSystem.getHudState());

  const stopMeterSync = vibeMeter.subscribe((snapshot) => {
    hud.setMeterValue(snapshot.value);
    postComposer.applyMeterSnapshot(snapshot);
    dayNightScene.applyMeterSnapshot(snapshot);
    spatialAudio.applyMeterSnapshot(snapshot);
  });

  sceneLifecycle.onUpdate((deltaMs) => {
    clock.update(deltaMs);
    pickupLoop.tick(deltaMs);
    hud.setVibeHudState(vibeSystem.getHudState());
  });

  let started = false;
  async function bootstrapOnFirstInteraction() {
    if (started) {
      return;
    }
    started = true;
    hud.setPrompt("Explore the park and find your first anomaly.");
    await playerController.requestPointerLock();
    sceneLifecycle.start();
  }

  canvas.addEventListener("pointerdown", bootstrapOnFirstInteraction, { once: true });
  canvas.addEventListener("touchstart", bootstrapOnFirstInteraction, { once: true, passive: true });

  window.presidioPsy = {
    startedAt: performance.now(),
    canvas,
    jamWidgetMount,
    seed: runSeed,
    rng,
    featureFlags,
    systems: {
      sceneLifecycle,
      postComposer,
      terrainTiles,
      playerController,
      vibeMeter,
      vibeSystem,
      clock,
      dayNightScene,
      spatialAudio,
      hud,
      stopMeterSync,
      stopClockSceneSync,
      stopClockAudioSync,
      stopCueAudioSync,
      stopHudComfortSync,
      stopDayNightHudSync,
    },
  };

  console.info("Presidio Psy bootstrap complete.");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startRuntime, { once: true });
} else {
  startRuntime();
}
