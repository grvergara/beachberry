import { createSeededRandom, createRunSeed } from "./content/seeds.js";
import { createPlayerController } from "./game/player.js";
import { createPostComposer } from "./render/post.js";
import { createSceneLifecycle } from "./render/scene.js";
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
  const postComposer = createPostComposer({
    distortionFloor: 0.05,
  });
  const playerController = createPlayerController(canvas);
  const hud = createHud(gameRoot);
  const terrainTiles = createTerrainTilesSystem();

  postComposer.registerPass("residual-floor");
  hud.setMeterValue(0);
  hud.setPrompt("Explore the park and find your first anomaly.");
  sceneLifecycle.start();

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
      hud,
    },
  };

  console.info("Presidio Psy bootstrap complete.");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startRuntime, { once: true });
} else {
  startRuntime();
}
