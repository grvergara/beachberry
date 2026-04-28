const GAME_ROOT_ID = "game-root";
const JAM_WIDGET_MOUNT_ID = "jam-widget-mount";

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

  return { canvas, jamWidgetMount };
}

function startRuntime() {
  const { canvas, jamWidgetMount } = createRuntimeShell();

  window.presidioPsy = {
    startedAt: performance.now(),
    canvas,
    jamWidgetMount,
  };

  console.info("Presidio Psy bootstrap complete.");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startRuntime, { once: true });
} else {
  startRuntime();
}
