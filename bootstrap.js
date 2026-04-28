import { createRunSeed, createSeededAnomalyPlacement, createSeededRandom } from "./content/seeds.js";
import { createEndingMatrixEvaluator, createFinaleGateState, createVoidWhisperSecretGate } from "./game/endings.js";
import { createPickupCollectionLoop, createPlayerController } from "./game/player.js";
import { createTimeOfDayClock } from "./game/time-of-day.js";
import { createVibeMeter } from "./game/vibe-meter.js";
import { createVibeSystem } from "./game/vibes.js";
import { createSpatialAudioMoodController } from "./audio/spatial.js";
import { createPostComposer } from "./render/post.js";
import { createDayNightSceneController, createSceneLifecycle } from "./render/scene.js";
import { createHud } from "./ui/hud.js";
import { PARK_ANCHORS } from "./world/park-anchors.js";
import { createTerrainTilesSystem } from "./world/terrain-tiles.js";

const GAME_ROOT_ID = "game-root";
const JAM_WIDGET_MOUNT_ID = "jam-widget-mount";
const RUN_COUNTER_STORAGE_KEY = "presidio-psy.run-counter";

function getPersistedRunCounter() {
  if (typeof window === "undefined" || !window.localStorage) {
    return 0;
  }
  const parsed = Number.parseInt(window.localStorage.getItem(RUN_COUNTER_STORAGE_KEY) ?? "0", 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function bumpPersistedRunCounter() {
  const next = getPersistedRunCounter() + 1;
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(RUN_COUNTER_STORAGE_KEY, `${next}`);
  }
  return next;
}

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
  let runSeed = createRunSeed("presidio");
  let rng = createSeededRandom(runSeed);
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
  const vibeMeter = createVibeMeter({ residualFloor: 6, initialValue: 10, runSeed });
  const vibeSystem = createVibeSystem({
    rng,
    onSpatialCue: (payload) => hud.emitSpatialCue(payload),
  });
  const endingMatrix = createEndingMatrixEvaluator();
  const finaleGate = createFinaleGateState({
    matrixEvaluator: endingMatrix,
    onGateUnlocked: (snapshot) => {
      hud.setFinaleStatus(snapshot.solvedPuzzleCount, snapshot.requiredPuzzleCount);
      hud.setFinaleMessage("Finale gate attuned. Step into the marker when ready.");
    },
  });
  const secretGate = createVoidWhisperSecretGate({
    onSecretUnlocked: ({ secretFlag }) => {
      vibeMeter.addSecretFlag(secretFlag);
      hud.setFinaleMessage("A hidden signal has been recorded in this run.");
    },
  });
  const fixedAnchors = PARK_ANCHORS.map((anchor) => ({
    id: anchor.id,
    type: anchor.type,
    position: anchor.worldPosition,
  }));
  const anomalySlots = [
    { slotId: "cliff-walk-a", position: { x: -72, y: 20, z: 36 } },
    { slotId: "main-lawn-a", position: { x: 10, y: 16, z: 22 } },
    { slotId: "campfire-a", position: { x: 28, y: 18, z: 74 } },
    { slotId: "bay-overlook-a", position: { x: -16, y: 25, z: -70 } },
    { slotId: "transit-edge-a", position: { x: 132, y: 11, z: 160 } },
  ];
  let runIndex = bumpPersistedRunCounter();
  let anomalyLayout = createSeededAnomalyPlacement({
    seed: runSeed,
    fixedAnchors,
    movableSlots: anomalySlots,
  }).buildLayout({ count: 4, prefix: "anomaly" });
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
  hud.setFinaleStatus(0, 3);
  hud.setFinaleMessage(`Run ${runIndex} initialized with seed ${runSeed}.`);

  function mountRunControls() {
    const shell = document.createElement("div");
    shell.className = "hud-run-controls";
    const label = document.createElement("label");
    label.className = "hud-run-seed-label";
    label.textContent = "Run seed";
    const seedInput = document.createElement("input");
    seedInput.className = "hud-run-seed-input";
    seedInput.type = "text";
    seedInput.value = runSeed;
    seedInput.placeholder = "presidio-void-06";
    const startButton = document.createElement("button");
    startButton.type = "button";
    startButton.className = "hud-run-start-button";
    startButton.textContent = "Start new run";
    label.appendChild(seedInput);
    shell.append(label, startButton);
    hud.mountSettingsSlot(shell);
    return { seedInput, startButton };
  }

  function applyRunSeed(nextSeed) {
    runSeed = nextSeed?.trim() ? nextSeed.trim() : createRunSeed("presidio");
    rng = createSeededRandom(runSeed);
    vibeMeter.resetRunAggregation(runSeed);
    vibeSystem.spawnInitialPickups();
    finaleGate.resetGate();
    anomalyLayout = createSeededAnomalyPlacement({
      seed: runSeed,
      fixedAnchors,
      movableSlots: anomalySlots,
    }).buildLayout({ count: 4, prefix: "anomaly" });
    hud.setVibeHudState(vibeSystem.getHudState());
    hud.resetFinaleReveal();
    hud.setFinaleStatus(0, 3);
    hud.setFinaleMessage(`Run ${runIndex} started with seed ${runSeed}.`);
    if (window.presidioPsy) {
      window.presidioPsy.seed = runSeed;
      window.presidioPsy.rng = rng;
      window.presidioPsy.runIndex = runIndex;
      window.presidioPsy.anomalyLayout = anomalyLayout;
    }
  }

  const runControls = mountRunControls();
  runControls.startButton.addEventListener("click", () => {
    runIndex += 1;
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(RUN_COUNTER_STORAGE_KEY, `${runIndex}`);
    }
    applyRunSeed(runControls.seedInput.value);
  });

  const stopMeterSync = vibeMeter.subscribe((snapshot) => {
    hud.setMeterValue(snapshot.value);
    postComposer.applyMeterSnapshot(snapshot);
    dayNightScene.applyMeterSnapshot(snapshot);
    spatialAudio.applyMeterSnapshot(snapshot);
  });

  sceneLifecycle.onUpdate((deltaMs) => {
    clock.update(deltaMs);
    pickupLoop.tick(deltaMs);
    const runSummary = vibeMeter.updateRunAggregation(deltaMs);
    const collectedVibeIds = vibeSystem
      .getPickups()
      .filter((pickup) => pickup.collected)
      .map((pickup) => pickup.vibeId);
    vibeMeter.registerCollectedVibes(collectedVibeIds);
    const secretUpdate = secretGate.updateFromRun({
      runIndex,
      seed: runSeed,
      highExposureMs: runSummary.highExposureMs,
      highExposureRatio: runSummary.highExposureRatio,
    });
    if (secretUpdate.unlocked) {
      vibeMeter.addSecretFlag(secretUpdate.secretFlag);
    }
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
    runIndex,
    anomalyLayout,
    featureFlags,
    registerPuzzleCompletion: (puzzleId) => {
      const snapshot = finaleGate.registerPuzzleCompletion(puzzleId);
      hud.setFinaleStatus(snapshot.solvedPuzzleCount, snapshot.requiredPuzzleCount);
      if (snapshot.gateUnlocked) {
        const runSummary = vibeMeter.getRunSummary();
        const resolved = finaleGate.resolveFinale({
          ...runSummary,
          completedPuzzles: snapshot.solvedPuzzleCount,
        });
        if (resolved.resolved) {
          hud.revealEnding(resolved.ending);
        }
      }
      return snapshot;
    },
    startNewRun: (nextSeed) => {
      runIndex += 1;
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(RUN_COUNTER_STORAGE_KEY, `${runIndex}`);
      }
      applyRunSeed(nextSeed);
      return {
        runIndex,
        seed: runSeed,
        anomalyLayout,
      };
    },
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
      finaleGate,
      endingMatrix,
      secretGate,
    },
  };

  console.info("Presidio Psy bootstrap complete.");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startRuntime, { once: true });
} else {
  startRuntime();
}
