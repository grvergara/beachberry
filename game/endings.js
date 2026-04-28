const REQUIRED_PUZZLE_COUNT = 3;

export function createFinaleGateState(options = {}) {
  const requiredPuzzleCount = Number.isFinite(options.requiredPuzzleCount)
    ? options.requiredPuzzleCount
    : REQUIRED_PUZZLE_COUNT;
  const onGateUnlocked = options.onGateUnlocked ?? (() => {});

  const state = {
    requiredPuzzleCount,
    solvedPuzzleIds: new Set(),
    gateUnlocked: false,
  };

  function getSnapshot() {
    return {
      requiredPuzzleCount: state.requiredPuzzleCount,
      solvedPuzzleCount: state.solvedPuzzleIds.size,
      solvedPuzzleIds: [...state.solvedPuzzleIds],
      remainingToUnlock: Math.max(0, state.requiredPuzzleCount - state.solvedPuzzleIds.size),
      gateUnlocked: state.gateUnlocked,
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

  return {
    state,
    getSnapshot,
    registerPuzzleCompletion,
    canAccessFinale,
  };
}

export { REQUIRED_PUZZLE_COUNT };
