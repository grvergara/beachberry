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
  const puzzlePromptText = createElement("p", "hud-puzzle-prompt", "");
  const pickupFeedback = createElement("p", "hud-pickup-feedback", "");
  pickupFeedback.setAttribute("aria-live", "polite");
  const puzzleProgressShell = createElement("div", "hud-puzzle-progress-shell");
  const puzzleProgressLabel = createElement("span", "hud-puzzle-progress-label", "Alignment");
  const puzzleProgressRing = createElement("progress", "hud-puzzle-progress-ring");
  puzzleProgressRing.max = 1;
  puzzleProgressRing.value = 0;
  puzzleProgressRing.setAttribute("aria-label", "Puzzle alignment progress");
  const puzzleSuccessText = createElement("p", "hud-puzzle-success", "");
  puzzleSuccessText.setAttribute("aria-live", "polite");
  const finaleStatusText = createElement("p", "hud-finale-status", "");
  finaleStatusText.setAttribute("aria-live", "polite");
  puzzleProgressShell.append(puzzleProgressLabel, puzzleProgressRing);
  const vibesShell = createElement("div", "hud-vibes");
  promptShell.append(promptLabel, promptText);
  promptShell.append(
    puzzlePromptText,
    puzzleProgressShell,
    puzzleSuccessText,
    finaleStatusText,
    pickupFeedback,
    vibesShell,
  );

  const settingsShell = createElement("section", "hud-settings-panel");
  const settingsLabel = createElement("h2", "hud-settings-label", "Settings");
  const settingsSlot = createElement("div", "hud-settings-slots");
  settingsShell.append(settingsLabel, settingsSlot);

  const layerShell = createElement("section", "hud-layer-panel");
  const layerLabel = createElement("h2", "hud-layer-label", "Reality Layer");
  const layerStateText = createElement("p", "hud-layer-state", "Current: real");
  const layerSuggestionText = createElement("p", "hud-layer-suggestion", "");
  const layerLockoutText = createElement("p", "hud-layer-lockout", "");
  layerLockoutText.setAttribute("aria-live", "polite");
  const layerControls = createElement("div", "hud-layer-controls");
  const layerControlButtons = ["real", "psy", "fractal", "void"].map((layerId) => {
    const button = createElement("button", "hud-layer-button", layerId);
    button.type = "button";
    button.dataset.layerId = layerId;
    layerControls.appendChild(button);
    return button;
  });
  layerShell.append(layerLabel, layerStateText, layerSuggestionText, layerLockoutText, layerControls);

  hudRoot.append(meterShell, promptShell, layerShell, settingsShell);
  rootElement.appendChild(hudRoot);
  const cueHooks = new Set();
  const layerControlHooks = new Set();

  function setMeterValue(percent) {
    const bounded = Math.max(0, Math.min(100, percent));
    meterValue.textContent = `${Math.round(bounded)}%`;
  }

  function setPrompt(text) {
    promptText.textContent = text;
  }

  function setPuzzlePrompt(text) {
    puzzlePromptText.textContent = text || "";
  }

  function setPickupFeedback(text) {
    pickupFeedback.textContent = text || "";
  }

  function setPuzzleProgress(ratio, label = "Alignment") {
    const bounded = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
    puzzleProgressRing.value = bounded;
    puzzleProgressLabel.textContent = label;
  }

  function setPuzzleSuccessMessage(text) {
    puzzleSuccessText.textContent = text || "";
  }

  function setFinaleStatus(solvedCount, requiredCount) {
    const solved = Number.isFinite(solvedCount) ? solvedCount : 0;
    const required = Number.isFinite(requiredCount) ? requiredCount : 3;
    if (solved >= required) {
      finaleStatusText.textContent = "Finale gate attuned. Return to the void marker.";
      return;
    }
    finaleStatusText.textContent = `Finale prerequisite: ${solved}/${required} viewpoints stabilized.`;
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

  function setLayerState(layerState = {}) {
    const currentLayer = layerState.currentLayer ?? "real";
    const unlockedLayers = new Set(layerState.unlockedLayers ?? ["real"]);
    const bleedSuggestion = layerState.bleedSuggestion ?? null;
    layerStateText.textContent = `Current: ${currentLayer}`;
    layerSuggestionText.textContent = bleedSuggestion?.suggestLayer
      ? `Bleed suggests ${bleedSuggestion.suggestLayer} (${bleedSuggestion.intensity ?? "stable"}).`
      : "";
    for (const button of layerControlButtons) {
      const layerId = button.dataset.layerId;
      button.disabled = !unlockedLayers.has(layerId);
      button.setAttribute("aria-pressed", String(layerId === currentLayer));
    }
  }

  function setLayerLockoutFeedback(feedback = {}) {
    if (!feedback.message) {
      layerLockoutText.textContent = "";
      return;
    }
    const cooldownRemainingMs = Number.isFinite(feedback.cooldownRemainingMs)
      ? Math.max(0, feedback.cooldownRemainingMs)
      : 0;
    if (cooldownRemainingMs > 0) {
      layerLockoutText.textContent = `${feedback.message} ${Math.ceil(cooldownRemainingMs / 1000)}s remaining.`;
      return;
    }
    layerLockoutText.textContent = feedback.message;
  }

  function emitLayerControlRequest(payload) {
    for (const hook of layerControlHooks) {
      hook(payload);
    }
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

  function registerLayerControlHook(hook) {
    if (typeof hook !== "function") {
      return () => {};
    }
    layerControlHooks.add(hook);
    return () => layerControlHooks.delete(hook);
  }

  function mountSettingsSlot(node) {
    if (node) {
      settingsSlot.appendChild(node);
    }
  }

  function dispose() {
    hudRoot.remove();
  }

  for (const button of layerControlButtons) {
    button.addEventListener("click", () => {
      emitLayerControlRequest({ targetLayer: button.dataset.layerId });
    });
  }

  return {
    element: hudRoot,
    setMeterValue,
    setPrompt,
    setPuzzlePrompt,
    setPickupFeedback,
    setPuzzleProgress,
    setPuzzleSuccessMessage,
    setFinaleStatus,
    setVibeHudState,
    setLayerState,
    setLayerLockoutFeedback,
    emitSpatialCue,
    registerSpatialCueHook,
    registerLayerControlHook,
    mountSettingsSlot,
    dispose,
  };
}
