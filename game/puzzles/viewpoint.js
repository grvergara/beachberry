import { PARK_ANCHORS, VIEWPOINT_PUZZLE_CONTRACTS } from "../../world/park-anchors.js";

const HIGH_DISTORTION_THRESHOLD = 70;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeYawDegrees(degrees) {
  let value = degrees;
  while (value > 180) {
    value -= 360;
  }
  while (value < -180) {
    value += 360;
  }
  return value;
}

function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

function distanceSq2d(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

export function createViewpointPuzzleSystem(options = {}) {
  const now = options.now ?? (() => performance.now());
  const contracts = options.contracts ?? VIEWPOINT_PUZZLE_CONTRACTS;
  const anchors = options.anchors ?? PARK_ANCHORS;
  const onPuzzleSolved = options.onPuzzleSolved ?? (() => {});
  const onMitigationNeeded = options.onMitigationNeeded ?? (() => {});
  const onMitigationCleared = options.onMitigationCleared ?? (() => {});

  const anchorById = new Map(anchors.map((anchor) => [anchor.id, anchor]));

  const state = {
    activePuzzleId: null,
    solvedPuzzleIds: new Set(),
    puzzleById: new Map(
      contracts.map((contract) => [
        contract.id,
        {
          id: contract.id,
          status: "idle",
          targetIndex: 0,
          targetDwellMs: 0,
          lastUpdateAt: 0,
        },
      ]),
    ),
    cameraYawDeg: 0,
    mitigationActive: false,
  };

  function getPuzzleProgress(contract) {
    const puzzleState = state.puzzleById.get(contract.id);
    if (!puzzleState) {
      return null;
    }
    const target = contract.landmarkTargets[puzzleState.targetIndex] ?? null;
    const dwellRatio = target
      ? clamp(puzzleState.targetDwellMs / Math.max(1, target.dwellMs), 0, 1)
      : 0;
    return {
      id: contract.id,
      status: puzzleState.status,
      targetIndex: puzzleState.targetIndex,
      targetCount: contract.landmarkTargets.length,
      dwellRatio,
      solved: state.solvedPuzzleIds.has(contract.id),
      reward: contract.reward,
      targetId: target?.id ?? null,
    };
  }

  function getSnapshot() {
    return {
      activePuzzleId: state.activePuzzleId,
      solvedPuzzleIds: [...state.solvedPuzzleIds],
      puzzleProgress: contracts.map((contract) => getPuzzleProgress(contract)).filter(Boolean),
      cameraYawDeg: state.cameraYawDeg,
    };
  }

  function updateCameraYaw(lookDelta = { x: 0 }) {
    state.cameraYawDeg = normalizeYawDegrees(state.cameraYawDeg + toDegrees(lookDelta.x ?? 0));
    return state.cameraYawDeg;
  }

  function chooseActivePuzzle(playerPosition) {
    const unresolved = contracts.filter((contract) => !state.solvedPuzzleIds.has(contract.id));
    let closest = null;
    for (const contract of unresolved) {
      const anchor = anchorById.get(contract.overlookAnchorId);
      if (!anchor) {
        continue;
      }
      const distSq = distanceSq2d(playerPosition, anchor.worldPosition);
      const radius = contract.activationRadius ?? 20;
      if (distSq > radius * radius) {
        continue;
      }
      if (!closest || distSq < closest.distSq) {
        closest = { contract, distSq };
      }
    }
    return closest?.contract ?? null;
  }

  function solveCurrentTarget(contract, puzzleState, deltaMs) {
    const target = contract.landmarkTargets[puzzleState.targetIndex];
    if (!target) {
      return null;
    }

    const yawDelta = Math.abs(normalizeYawDegrees(state.cameraYawDeg - target.yawDeg));
    if (yawDelta <= target.coneToleranceDeg) {
      puzzleState.targetDwellMs += deltaMs;
      puzzleState.status = "aligning";
      const complete = puzzleState.targetDwellMs >= target.dwellMs;
      return {
        target,
        aligned: true,
        complete,
      };
    }

    puzzleState.status = "idle";
    puzzleState.targetDwellMs = Math.max(0, puzzleState.targetDwellMs - deltaMs * 0.75);
    return {
      target,
      aligned: false,
      complete: false,
    };
  }

  function tick(input = {}) {
    const tickNow = now();
    const playerPosition = input.playerPosition ?? { x: 0, y: 0, z: 0 };
    const lookDelta = input.lookDelta ?? { x: 0, y: 0 };
    const meterValue = input.meterValue ?? 0;

    updateCameraYaw(lookDelta);

    const activeContract = chooseActivePuzzle(playerPosition);
    if (!activeContract) {
      state.activePuzzleId = null;
      state.mitigationActive = false;
      onMitigationCleared();
      return getSnapshot();
    }

    const puzzleState = state.puzzleById.get(activeContract.id);
    if (!puzzleState) {
      return getSnapshot();
    }

    const deltaMs = puzzleState.lastUpdateAt > 0 ? tickNow - puzzleState.lastUpdateAt : 0;
    puzzleState.lastUpdateAt = tickNow;
    state.activePuzzleId = activeContract.id;

    const targetProgress = solveCurrentTarget(activeContract, puzzleState, deltaMs);
    if (!targetProgress) {
      return getSnapshot();
    }

    const shouldMitigate = meterValue >= HIGH_DISTORTION_THRESHOLD && targetProgress.aligned;
    if (shouldMitigate && !state.mitigationActive) {
      state.mitigationActive = true;
      onMitigationNeeded({
        puzzleId: activeContract.id,
        meterValue,
        targetId: targetProgress.target.id,
      });
    } else if (!shouldMitigate && state.mitigationActive) {
      state.mitigationActive = false;
      onMitigationCleared();
    }

    if (!targetProgress.complete) {
      return getSnapshot();
    }

    puzzleState.targetDwellMs = 0;
    puzzleState.targetIndex += 1;
    if (puzzleState.targetIndex < activeContract.landmarkTargets.length) {
      puzzleState.status = "idle";
      return getSnapshot();
    }

    puzzleState.status = "success";
    state.solvedPuzzleIds.add(activeContract.id);
    onPuzzleSolved({
      puzzleId: activeContract.id,
      solvedCount: state.solvedPuzzleIds.size,
      reward: activeContract.reward,
      targetCount: activeContract.landmarkTargets.length,
    });
    state.activePuzzleId = null;
    state.mitigationActive = false;
    onMitigationCleared();
    return getSnapshot();
  }

  return {
    contracts,
    state,
    tick,
    getSnapshot,
    getPuzzleProgress,
  };
}
