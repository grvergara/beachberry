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
  const finaleMessageText = createElement("p", "hud-finale-message", "");
  finaleMessageText.setAttribute("aria-live", "polite");
  const endingRevealTitle = createElement("h3", "hud-ending-title", "");
  const endingRevealBody = createElement("p", "hud-ending-body", "");
  endingRevealBody.setAttribute("aria-live", "polite");
  puzzleProgressShell.append(puzzleProgressLabel, puzzleProgressRing);
  const vibesShell = createElement("div", "hud-vibes");
  promptShell.append(promptLabel, promptText);
  promptShell.append(
    puzzlePromptText,
    puzzleProgressShell,
    puzzleSuccessText,
    finaleStatusText,
    finaleMessageText,
    endingRevealTitle,
    endingRevealBody,
    pickupFeedback,
    vibesShell,
  );

  const settingsShell = createElement("section", "hud-settings-panel");
  const settingsLabel = createElement("h2", "hud-settings-label", "Settings");
  const settingsSlot = createElement("div", "hud-settings-slots");
  const comfortShell = createElement("div", "hud-comfort-controls");
  const reducedMotionLabel = createElement("label", "hud-reduced-motion-label");
  const reducedMotionToggle = document.createElement("input");
  reducedMotionToggle.type = "checkbox";
  reducedMotionToggle.className = "hud-reduced-motion-toggle";
  reducedMotionLabel.append(reducedMotionToggle, document.createTextNode(" Reduced motion"));
  const intensityLabel = createElement("label", "hud-intensity-label", "Intensity");
  const intensitySlider = document.createElement("input");
  intensitySlider.type = "range";
  intensitySlider.className = "hud-intensity-slider";
  intensitySlider.min = "0";
  intensitySlider.max = "1";
  intensitySlider.step = "0.05";
  intensitySlider.value = "1";
  intensityLabel.appendChild(intensitySlider);
  const dayNightCue = createElement("p", "hud-day-night-cue", "Sun icon indicates daytime.");
  dayNightCue.setAttribute("aria-live", "polite");
  comfortShell.append(reducedMotionLabel, intensityLabel, dayNightCue);
  settingsShell.append(settingsLabel, settingsSlot);
  settingsShell.appendChild(comfortShell);

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

  const paintShell = createElement("section", "hud-paint-panel");
  const paintLabel = createElement("h2", "hud-paint-label", "Paint Weaver");
  const paintStatusText = createElement("p", "hud-paint-status", "Paint mode offline");
  const paintChargeText = createElement("p", "hud-paint-charges", "Charges: 0/0");
  const paintInvalidText = createElement("p", "hud-paint-invalid", "");
  paintInvalidText.setAttribute("aria-live", "polite");
  paintShell.append(paintLabel, paintStatusText, paintChargeText, paintInvalidText);

  hudRoot.append(meterShell, promptShell, layerShell, paintShell, settingsShell);
  rootElement.appendChild(hudRoot);
  const cueHooks = new Set();
  const layerControlHooks = new Set();
  const comfortHooks = new Set();
  const comfortState = {
    reducedMotion: false,
    intensityScale: 1,
  };

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

  function setFinaleMessage(text) {
    finaleMessageText.textContent = text || "";
  }

  function revealEnding(ending = {}) {
    if (!ending?.id) {
      endingRevealTitle.textContent = "";
      endingRevealBody.textContent = "";
      return;
    }
    endingRevealTitle.textContent = `Ending: ${ending.title ?? ending.id}`;
    endingRevealBody.textContent = ending.reason ?? "";
  }

  function resetFinaleReveal() {
    finaleStatusText.textContent = "";
    finaleMessageText.textContent = "";
    endingRevealTitle.textContent = "";
    endingRevealBody.textContent = "";
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
    if (vibeHudState.paintMode) {
      setPaintModeState(vibeHudState.paintMode);
    }
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

  function formatPaintInvalidReason(reason) {
    switch (reason) {
      case "outside-bounds":
      case "invalid-endpoint":
      case "invalid-placement":
        return "Paint can only be placed on valid walkable terrain.";
      case "no-charges":
        return "Paint Weaver is out of charges.";
      case "meter-too-low":
        return "Meter is too low to sustain paint paths.";
      case "paint-unavailable":
        return "Paint Weaver is inactive.";
      default:
        return "";
    }
  }

  function setPaintModeState(paintState = {}) {
    const enabled = Boolean(paintState.enabled);
    const charges = Number.isFinite(paintState.charges) ? paintState.charges : 0;
    const maxCharges = Number.isFinite(paintState.maxCharges) ? paintState.maxCharges : 0;
    const activePlacements = Number.isFinite(paintState.activePlacements) ? paintState.activePlacements : 0;
    paintStatusText.textContent = enabled
      ? `Paint mode online${activePlacements > 0 ? ` (${activePlacements} active path${activePlacements === 1 ? "" : "s"})` : ""}`
      : "Paint mode offline";
    paintChargeText.textContent = `Charges: ${charges}/${maxCharges}`;
    if (paintState.lastInvalidReason) {
      paintInvalidText.textContent = formatPaintInvalidReason(paintState.lastInvalidReason);
    } else if (!enabled) {
      paintInvalidText.textContent = "";
    }
  }

  function setPaintInvalidPlacementFeedback(feedback = {}) {
    paintInvalidText.textContent = formatPaintInvalidReason(feedback.reason);
  }

  function setDayNightCue(snapshot = {}) {
    const phaseId = snapshot.phaseId ?? "day";
    const icon = phaseId === "night" ? "Moon" : phaseId === "dusk" || phaseId === "dawn" ? "Twilight" : "Sun";
    const intensity = Number.isFinite(snapshot.intensityScale) ? snapshot.intensityScale : comfortState.intensityScale;
    if (comfortState.reducedMotion) {
      dayNightCue.textContent = `${icon} phase active. Reduced motion enabled; rely on palette and landmark glow cues.`;
      return;
    }
    dayNightCue.textContent = `${icon} phase active. Visual intensity ${Math.round(intensity * 100)}%.`;
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

  function emitComfortChange() {
    const snapshot = {
      reducedMotion: comfortState.reducedMotion,
      intensityScale: comfortState.intensityScale,
    };
    for (const hook of comfortHooks) {
      hook(snapshot);
    }
  }

  function registerComfortChangeHook(hook) {
    if (typeof hook !== "function") {
      return () => {};
    }
    comfortHooks.add(hook);
    hook({
      reducedMotion: comfortState.reducedMotion,
      intensityScale: comfortState.intensityScale,
    });
    return () => comfortHooks.delete(hook);
  }

  function getComfortOptions() {
    return {
      reducedMotion: comfortState.reducedMotion,
      intensityScale: comfortState.intensityScale,
    };
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

  reducedMotionToggle.addEventListener("change", () => {
    comfortState.reducedMotion = reducedMotionToggle.checked;
    emitComfortChange();
    setDayNightCue({
      phaseId: "day",
      intensityScale: comfortState.intensityScale,
    });
  });

  intensitySlider.addEventListener("input", () => {
    const parsed = Number.parseFloat(intensitySlider.value);
    comfortState.intensityScale = Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : 1;
    emitComfortChange();
    setDayNightCue({
      phaseId: "day",
      intensityScale: comfortState.intensityScale,
    });
  });

  return {
    element: hudRoot,
    setMeterValue,
    setPrompt,
    setPuzzlePrompt,
    setPickupFeedback,
    setPuzzleProgress,
    setPuzzleSuccessMessage,
    setFinaleStatus,
    setFinaleMessage,
    revealEnding,
    resetFinaleReveal,
    setVibeHudState,
    setPaintModeState,
    setPaintInvalidPlacementFeedback,
    setLayerState,
    setLayerLockoutFeedback,
    setDayNightCue,
    emitSpatialCue,
    registerSpatialCueHook,
    registerLayerControlHook,
    registerComfortChangeHook,
    getComfortOptions,
    mountSettingsSlot,
    dispose,
  };
}
