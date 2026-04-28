const REQUIRED_PUZZLE_COUNT = 3;
const ENDING_REAL = "real";
const ENDING_TOTAL_PSY = "total-psy";
const ENDING_GLITCH_SECRET = "glitch-secret";
const VOID_WHISPER_VIBE_ID = "V06";

const DEFAULT_SECRET_SEED_MATCHER = (seed = "") => {
  const normalized = `${seed}`.trim().toLowerCase();
  return normalized.includes("void") || normalized.endsWith("06");
};

function normalizeEligibility(input = {}) {
  return {
    meterAverage: Number.isFinite(input.meterAverage) ? input.meterAverage : 0,
    highExposureMs: Number.isFinite(input.highExposureMs) ? input.highExposureMs : 0,
    lowExposureMs: Number.isFinite(input.lowExposureMs) ? input.lowExposureMs : 0,
    highExposureRatio: Number.isFinite(input.highExposureRatio) ? input.highExposureRatio : 0,
    lowExposureRatio: Number.isFinite(input.lowExposureRatio) ? input.lowExposureRatio : 0,
    meterIntegral: Number.isFinite(input.meterIntegral) ? input.meterIntegral : 0,
    inventory: new Set(input.inventory ?? []),
    secretFlags: new Set(input.secretFlags ?? []),
    completedPuzzles: Number.isFinite(input.completedPuzzles) ? input.completedPuzzles : 0,
  };
}

export function createEndingMatrixEvaluator(options = {}) {
  const highPsyThreshold = Number.isFinite(options.highPsyThreshold) ? options.highPsyThreshold : 70;
  const groundedThreshold = Number.isFinite(options.groundedThreshold) ? options.groundedThreshold : 42;

  function evaluate(input = {}) {
    const eligibility = normalizeEligibility(input);
    const hasVoidWhisper =
      eligibility.inventory.has(VOID_WHISPER_VIBE_ID) || eligibility.secretFlags.has("void-whisper-unlocked");
    const hasGlitchFlag = eligibility.secretFlags.has("glitch-unlocked");
    const canUseGlitchEnding =
      hasVoidWhisper && hasGlitchFlag && eligibility.highExposureRatio >= 0.6 && eligibility.highExposureMs >= 45_000;

    if (canUseGlitchEnding) {
      return {
        id: ENDING_GLITCH_SECRET,
        title: "You were a glitch",
        reason: "Secret path resolved from Void Whisper unlock and sustained high-psy exposure.",
      };
    }

    if (eligibility.meterAverage >= highPsyThreshold || eligibility.highExposureRatio >= 0.58) {
      return {
        id: ENDING_TOTAL_PSY,
        title: "Total Psy",
        reason: "Run stayed heavily saturated by high-meter play and aggressive vibe routing.",
      };
    }

    if (eligibility.meterAverage <= groundedThreshold || eligibility.lowExposureRatio >= 0.52) {
      return {
        id: ENDING_REAL,
        title: "Real",
        reason: "Run remained mostly grounded with stabilizing meter balance.",
      };
    }

    return {
      id: ENDING_TOTAL_PSY,
      title: "Total Psy",
      reason: "Balanced runs tip to psychedelic finale without meeting secret conditions.",
    };
  }

  return {
    evaluate,
  };
}

export function createVoidWhisperSecretGate(options = {}) {
  const secretSeedMatcher = options.secretSeedMatcher ?? DEFAULT_SECRET_SEED_MATCHER;
  const minExposureMs = Number.isFinite(options.minExposureMs) ? options.minExposureMs : 75_000;
  const minExposureRatio = Number.isFinite(options.minExposureRatio) ? options.minExposureRatio : 0.55;
  const onSecretUnlocked = options.onSecretUnlocked ?? (() => {});

  const state = {
    firstRunSecrecy: true,
    unlockedRuns: 0,
  };

  function getSnapshot() {
    return {
      firstRunSecrecy: state.firstRunSecrecy,
      unlockedRuns: state.unlockedRuns,
    };
  }

  function updateFromRun(input = {}) {
    if (state.firstRunSecrecy && Number.isFinite(input.runIndex) && input.runIndex > 1) {
      state.firstRunSecrecy = false;
    }

    const seedEligible = secretSeedMatcher(input.seed);
    const exposureEligible =
      Number.isFinite(input.highExposureMs) &&
      Number.isFinite(input.highExposureRatio) &&
      input.highExposureMs >= minExposureMs &&
      input.highExposureRatio >= minExposureRatio;
    const shouldUnlock = !state.firstRunSecrecy && seedEligible && exposureEligible;
    if (shouldUnlock) {
      state.unlockedRuns += 1;
      onSecretUnlocked({
        secretFlag: "void-whisper-unlocked",
        seed: input.seed,
      });
      return {
        unlocked: true,
        firstRunSecrecy: state.firstRunSecrecy,
        secretFlag: "void-whisper-unlocked",
      };
    }
    return {
      unlocked: false,
      firstRunSecrecy: state.firstRunSecrecy,
    };
  }

  return {
    state,
    getSnapshot,
    updateFromRun,
  };
}

export function createFinaleGateState(options = {}) {
  const requiredPuzzleCount = Number.isFinite(options.requiredPuzzleCount)
    ? options.requiredPuzzleCount
    : REQUIRED_PUZZLE_COUNT;
  const onGateUnlocked = options.onGateUnlocked ?? (() => {});
  const matrixEvaluator = options.matrixEvaluator ?? createEndingMatrixEvaluator();

  const state = {
    requiredPuzzleCount,
    solvedPuzzleIds: new Set(),
    gateUnlocked: false,
    finaleResolved: false,
    resolvedEnding: null,
  };

  function getSnapshot() {
    return {
      requiredPuzzleCount: state.requiredPuzzleCount,
      solvedPuzzleCount: state.solvedPuzzleIds.size,
      solvedPuzzleIds: [...state.solvedPuzzleIds],
      remainingToUnlock: Math.max(0, state.requiredPuzzleCount - state.solvedPuzzleIds.size),
      gateUnlocked: state.gateUnlocked,
      finaleResolved: state.finaleResolved,
      resolvedEnding: state.resolvedEnding,
    };
  }

  function registerPuzzleCompletion(puzzleId) {
    if (!puzzleId) {
      return getSnapshot();
    }
    if (!state.solvedPuzzleIds.has(puzzleId)) {
      state.solvedPuzzleIds.add(puzzleId);
    }

    const meetsRequirement = state.solvedPuzzleIds.size === state.requiredPuzzleCount;
    if (!state.gateUnlocked && meetsRequirement) {
      state.gateUnlocked = true;
      onGateUnlocked(getSnapshot());
    }
    return getSnapshot();
  }

  function canAccessFinale() {
    return state.gateUnlocked;
  }

  function resetGate() {
    state.solvedPuzzleIds.clear();
    state.gateUnlocked = false;
    state.finaleResolved = false;
    state.resolvedEnding = null;
    return getSnapshot();
  }

  function resolveFinale(eligibilityVector = {}) {
    if (!state.gateUnlocked) {
      return {
        resolved: false,
        reason: "gate-locked",
        snapshot: getSnapshot(),
      };
    }
    const ending = matrixEvaluator.evaluate(eligibilityVector);
    state.finaleResolved = true;
    state.resolvedEnding = ending;
    return {
      resolved: true,
      ending,
      snapshot: getSnapshot(),
    };
  }

  return {
    state,
    getSnapshot,
    registerPuzzleCompletion,
    canAccessFinale,
    resetGate,
    resolveFinale,
  };
}

export {
  REQUIRED_PUZZLE_COUNT,
  ENDING_REAL,
  ENDING_TOTAL_PSY,
  ENDING_GLITCH_SECRET,
  VOID_WHISPER_VIBE_ID,
};
