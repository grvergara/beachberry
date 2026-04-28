function createElement(tag, className, textContent = "") {
  const element = document.createElement(tag);
  element.className = className;
  if (textContent) {
    element.textContent = textContent;
  }
  return element;
}

export function createHud(rootElement) {
  if (!rootElement) {
    throw new Error("createHud requires a root element.");
  }

  const hudRoot = createElement("aside", "hud-shell");
  const meterShell = createElement("section", "hud-meter-shell");
  const meterLabel = createElement("h2", "hud-meter-label", "Vibe Meter");
  const meterValue = createElement("output", "hud-meter-value", "0%");
  meterValue.setAttribute("aria-live", "polite");
  meterShell.append(meterLabel, meterValue);

  const promptShell = createElement("section", "hud-prompts");
  const promptLabel = createElement("h2", "hud-prompts-label", "Prompts");
  const promptText = createElement("p", "hud-prompts-text", "Walk to discover your first Vibe.");
  const pickupFeedback = createElement("p", "hud-pickup-feedback", "");
  pickupFeedback.setAttribute("aria-live", "polite");
  const vibesShell = createElement("div", "hud-vibes");
  promptShell.append(promptLabel, promptText);
  promptShell.append(pickupFeedback, vibesShell);

  const settingsShell = createElement("section", "hud-settings-panel");
  const settingsLabel = createElement("h2", "hud-settings-label", "Settings");
  const settingsSlot = createElement("div", "hud-settings-slots");
  settingsShell.append(settingsLabel, settingsSlot);

  hudRoot.append(meterShell, promptShell, settingsShell);
  rootElement.appendChild(hudRoot);
  const cueHooks = new Set();

  function setMeterValue(percent) {
    const bounded = Math.max(0, Math.min(100, percent));
    meterValue.textContent = `${Math.round(bounded)}%`;
  }

  function setPrompt(text) {
    promptText.textContent = text;
  }

  function setPickupFeedback(text) {
    pickupFeedback.textContent = text || "";
  }

  function setVibeHudState(vibeHudState = {}) {
    const temporary = vibeHudState.activeTemporary ?? null;
    const persistent = vibeHudState.persistentVibes ?? [];
    const entries = [];
    if (temporary) {
      const remainingSeconds = Math.max(
        0,
        Math.ceil((temporary.expiresAt - performance.now()) / 1000),
      );
      entries.push(`${temporary.icon} ${temporary.name} ${remainingSeconds}s`);
    }
    for (const vibe of persistent) {
      entries.push(`${vibe.icon} ${vibe.name}`);
    }
    vibesShell.textContent = entries.join(" | ");
  }

  function emitSpatialCue(payload) {
    for (const hook of cueHooks) {
      hook(payload);
    }
  }

  function registerSpatialCueHook(hook) {
    if (typeof hook !== "function") {
      return () => {};
    }
    cueHooks.add(hook);
    return () => cueHooks.delete(hook);
  }

  function mountSettingsSlot(node) {
    if (node) {
      settingsSlot.appendChild(node);
    }
  }

  function dispose() {
    hudRoot.remove();
  }

  return {
    element: hudRoot,
    setMeterValue,
    setPrompt,
    setPickupFeedback,
    setVibeHudState,
    emitSpatialCue,
    registerSpatialCueHook,
    mountSettingsSlot,
    dispose,
  };
}
