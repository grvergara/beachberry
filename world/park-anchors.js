export const PARK_ANCHOR_IDS = Object.freeze({
  OUTPOST_PLAYGROUND: "outpost-playground",
  CLIFF_WALK_SPINE: "cliff-walk-spine",
  BAY_OVERLOOK: "bay-overlook",
  VETERANS_OVERLOOK: "veterans-overlook",
  GOLDEN_GATE_OVERLOOK: "golden-gate-overlook",
  CAMPFIRE_CIRCLE: "campfire-circle",
  PRESIDIO_STEPS: "presidio-steps",
  MAIN_LAWN: "main-lawn",
  TRANSIT_EDGE: "transit-edge",
});

export const LANDMARK_TARGET_IDS = Object.freeze({
  GOLDEN_GATE_BRIDGE: "golden-gate-bridge",
  ALCATRAZ_ISLAND: "alcatraz-island",
  SF_SKYLINE: "sf-skyline",
  PALACE_OF_FINE_ARTS: "palace-of-fine-arts",
});

export const PUZZLE_REWARD_IDS = Object.freeze({
  BRIDGE_ECHO: "V01",
  PAINT_WEAVER: "V03",
  LAYER_KEY: "V04",
});

export const PARK_ANCHORS = Object.freeze([
  {
    id: PARK_ANCHOR_IDS.OUTPOST_PLAYGROUND,
    type: "poi",
    name: "Outpost Playground",
    worldPosition: { x: -145, y: 14, z: 120 },
  },
  {
    id: PARK_ANCHOR_IDS.CLIFF_WALK_SPINE,
    type: "path",
    name: "Cliff Walk Spine",
    worldPosition: { x: -60, y: 21, z: 40 },
  },
  {
    id: PARK_ANCHOR_IDS.BAY_OVERLOOK,
    type: "overlook",
    name: "Bay Overlook",
    worldPosition: { x: -20, y: 25, z: -75 },
  },
  {
    id: PARK_ANCHOR_IDS.VETERANS_OVERLOOK,
    type: "overlook",
    name: "Veterans Overlook",
    worldPosition: { x: 55, y: 28, z: -55 },
  },
  {
    id: PARK_ANCHOR_IDS.GOLDEN_GATE_OVERLOOK,
    type: "overlook",
    name: "Golden Gate-facing Overlook",
    worldPosition: { x: -110, y: 30, z: -140 },
  },
  {
    id: PARK_ANCHOR_IDS.CAMPFIRE_CIRCLE,
    type: "poi",
    name: "Campfire Circle",
    worldPosition: { x: 35, y: 18, z: 80 },
  },
  {
    id: PARK_ANCHOR_IDS.PRESIDIO_STEPS,
    type: "transition",
    name: "Presidio Steps",
    worldPosition: { x: 110, y: 12, z: 155 },
  },
  {
    id: PARK_ANCHOR_IDS.MAIN_LAWN,
    type: "poi",
    name: "Main Lawn",
    worldPosition: { x: 5, y: 16, z: 10 },
  },
  {
    id: PARK_ANCHOR_IDS.TRANSIT_EDGE,
    type: "transition",
    name: "Transit Center Edge",
    worldPosition: { x: 145, y: 10, z: 170 },
  },
]);

export const VIEWPOINT_PUZZLE_CONTRACTS = Object.freeze([
  {
    id: "puzzle-bay-overlook",
    overlookAnchorId: PARK_ANCHOR_IDS.BAY_OVERLOOK,
    activationRadius: 22,
    landmarkTargets: [
      {
        id: LANDMARK_TARGET_IDS.GOLDEN_GATE_BRIDGE,
        yawDeg: -32,
        coneToleranceDeg: 10,
        dwellMs: 2200,
      },
    ],
    reward: {
      unlockLayer: "psy",
      grantVibeId: PUZZLE_REWARD_IDS.BRIDGE_ECHO,
      message: "Golden Gate resonance aligned. Psy layer unlocked.",
    },
  },
  {
    id: "puzzle-veterans-overlook",
    overlookAnchorId: PARK_ANCHOR_IDS.VETERANS_OVERLOOK,
    activationRadius: 20,
    landmarkTargets: [
      {
        id: LANDMARK_TARGET_IDS.ALCATRAZ_ISLAND,
        yawDeg: -5,
        coneToleranceDeg: 9,
        dwellMs: 1900,
      },
      {
        id: LANDMARK_TARGET_IDS.SF_SKYLINE,
        yawDeg: 26,
        coneToleranceDeg: 11,
        dwellMs: 2100,
      },
    ],
    reward: {
      unlockLayer: "fractal",
      grantVibeId: PUZZLE_REWARD_IDS.PAINT_WEAVER,
      message: "Overlook sequence complete. Fractal routes now answer your paint.",
    },
  },
  {
    id: "puzzle-golden-gate-overlook",
    overlookAnchorId: PARK_ANCHOR_IDS.GOLDEN_GATE_OVERLOOK,
    activationRadius: 24,
    landmarkTargets: [
      {
        id: LANDMARK_TARGET_IDS.PALACE_OF_FINE_ARTS,
        yawDeg: 18,
        coneToleranceDeg: 9,
        dwellMs: 2400,
      },
      {
        id: LANDMARK_TARGET_IDS.SF_SKYLINE,
        yawDeg: 28,
        coneToleranceDeg: 8,
        dwellMs: 1400,
        optionalParallaxConfirmation: true,
      },
    ],
    reward: {
      unlockLayer: "void",
      grantVibeId: PUZZLE_REWARD_IDS.LAYER_KEY,
      message: "Parallax confirmed. Void gate attunement is now available.",
    },
  },
]);
