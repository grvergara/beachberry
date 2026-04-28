const POINTER_SENSITIVITY = 0.0018;
const TOUCH_SENSITIVITY = 0.0025;

function getMovementVector(activeKeys) {
  const x = (activeKeys.has("KeyD") ? 1 : 0) - (activeKeys.has("KeyA") ? 1 : 0);
  const z = (activeKeys.has("KeyS") ? 1 : 0) - (activeKeys.has("KeyW") ? 1 : 0);
  return { x, z };
}

export function createPlayerController(targetElement, options = {}) {
  if (!targetElement) {
    throw new Error("createPlayerController requires a target element.");
  }

  const state = {
    lookDelta: { x: 0, y: 0 },
    moveVector: { x: 0, z: 0 },
    usingPointerLock: false,
    controlMode: "keyboard",
  };

  const activeKeys = new Set();
  let lastTouch = null;
  const onModeChange = options.onModeChange ?? (() => {});

  function setControlMode(mode) {
    if (state.controlMode !== mode) {
      state.controlMode = mode;
      onModeChange(mode);
    }
  }

  function onMouseMove(event) {
    if (!state.usingPointerLock) {
      return;
    }
    state.lookDelta.x += event.movementX * POINTER_SENSITIVITY;
    state.lookDelta.y += event.movementY * POINTER_SENSITIVITY;
    setControlMode("pointer");
  }

  function onTouchStart(event) {
    if (event.touches.length === 0) {
      return;
    }
    const touch = event.touches[0];
    lastTouch = { x: touch.clientX, y: touch.clientY };
    setControlMode("touch");
  }

  function onTouchMove(event) {
    if (!lastTouch || event.touches.length === 0) {
      return;
    }
    const touch = event.touches[0];
    state.lookDelta.x += (touch.clientX - lastTouch.x) * TOUCH_SENSITIVITY;
    state.lookDelta.y += (touch.clientY - lastTouch.y) * TOUCH_SENSITIVITY;
    lastTouch = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd() {
    lastTouch = null;
  }

  function onKeyDown(event) {
    activeKeys.add(event.code);
    state.moveVector = getMovementVector(activeKeys);
    setControlMode("keyboard");
  }

  function onKeyUp(event) {
    activeKeys.delete(event.code);
    state.moveVector = getMovementVector(activeKeys);
  }

  function onPointerLockChange() {
    state.usingPointerLock = document.pointerLockElement === targetElement;
  }

  async function requestPointerLock() {
    if (!targetElement.requestPointerLock) {
      return false;
    }
    try {
      await targetElement.requestPointerLock();
      return true;
    } catch {
      state.usingPointerLock = false;
      return false;
    }
  }

  function consumeLookDelta() {
    const delta = { ...state.lookDelta };
    state.lookDelta.x = 0;
    state.lookDelta.y = 0;
    return delta;
  }

  targetElement.addEventListener("mousemove", onMouseMove);
  targetElement.addEventListener("touchstart", onTouchStart, { passive: true });
  targetElement.addEventListener("touchmove", onTouchMove, { passive: true });
  targetElement.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  document.addEventListener("pointerlockchange", onPointerLockChange);

  function dispose() {
    targetElement.removeEventListener("mousemove", onMouseMove);
    targetElement.removeEventListener("touchstart", onTouchStart);
    targetElement.removeEventListener("touchmove", onTouchMove);
    targetElement.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    document.removeEventListener("pointerlockchange", onPointerLockChange);
  }

  return {
    state,
    requestPointerLock,
    consumeLookDelta,
    dispose,
  };
}
