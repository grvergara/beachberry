# Tasks: Presidio Psy

**Input**: Design documents from `/specs/001-presidio-vibe-psy/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`

**Tests**: Manual and profiling validation are defined in `specs/001-presidio-vibe-psy/quickstart.md`; no separate automated test tasks are required by the current spec.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., `US1`, `US2`)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the jam-compliant web game shell and build pipeline.

- [X] T001 Create initial HTML shell with jam widget mount and game root in `index.html`
- [X] T002 Create bootstrap entry and runtime startup wiring in `bootstrap.js`
- [X] T003 Configure Vite project scripts and bundling in `package.json`
- [X] T004 [P] Configure Vite build and dev server defaults in `vite.config.js`
- [X] T005 [P] Add project metadata, scripts, and static-hosting notes in `README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core runtime systems that all stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Initialize renderer, camera, resize handling, and scene lifecycle in `render/scene.js`
- [X] T007 [P] Implement shared post-processing composer skeleton and pass hooks in `render/post.js`
- [X] T008 [P] Define stable park anchor constants and geospatial IDs in `world/park-anchors.js`
- [X] T009 Implement bounded terrain/tiles loading and walkable collision mesh extraction in `world/terrain-tiles.js`
- [X] T010 Implement desktop pointer + mobile touch control routing with graceful fallbacks in `game/player.js`
- [X] T011 [P] Implement deterministic seeded RNG utilities and seed API in `content/seeds.js`
- [X] T012 [P] Implement global HUD scaffold (meter shell, prompts, settings panel slots) in `ui/hud.js`
- [X] T013 Add runtime feature flags and optional echoes opt-in defaults in `bootstrap.js`

**Checkpoint**: Foundation ready; user story phases can proceed.

---

## Phase 3: User Story 1 - First arrival and “real enough” park walk (Priority: P1) 🎯 MVP

**Goal**: Deliver first-play traversal, visible Vibe Meter, and first collectible feedback under fast bootstrap expectations.

**Independent Test**: A new player can load, move, see the meter, collect one Vibe, and understand the core loop within two minutes.

### Implementation for User Story 1

- [X] T014 [US1] Implement vibe meter state model and residual floor behavior in `game/vibe-meter.js`
- [X] T015 [P] [US1] Implement initial pickup catalog and spawn wiring for first-run onboarding in `game/vibes.js`
- [X] T054 [US1] Implement Vibe matrix activation and stacking core (single active temporary ability, persistent stacking) in `game/vibes.js`
- [X] T016 [P] [US1] Implement baseline world saturation/motion response to meter changes in `render/post.js`
- [X] T017 [US1] Integrate meter HUD readout and pickup feedback prompts in `ui/hud.js`
- [X] T057 [P] [US1] Implement Vibe HUD timers/icons and per-Vibe spatial cue hooks in `ui/hud.js`
- [X] T018 [US1] Wire pickup collision/collection loop with meter updates in `game/player.js`
- [X] T019 [US1] Enforce no-login start flow and first-interaction bootstrap sequence in `bootstrap.js`

**Checkpoint**: US1 is fully functional and testable on its own.

---

## Phase 4: User Story 2 - Viewpoint alignment puzzles at real overlooks (Priority: P1)

**Goal**: Ship the exact 3 mandatory viewpoint puzzles with landmark alignment tolerances, rewards, and critical-path gating.

**Independent Test**: Each required overlook puzzle can be solved on touch and pointer input and unlocks the documented reward.

### Implementation for User Story 2

- [X] T020 [P] [US2] Define puzzle contracts (anchors, targets, tolerances, dwell, rewards) in `world/park-anchors.js`
- [X] T021 [US2] Implement viewpoint cone/dwell solver and puzzle state machine in `game/puzzles/viewpoint.js`
- [X] T022 [US2] Integrate puzzle UI prompts, progress ring, and success messaging in `ui/hud.js`
- [X] T023 [US2] Wire puzzle completion gating and finale prerequisite counter (exactly 3) in `game/endings.js`
- [X] T024 [US2] Add player-facing mitigation hooks during high distortion alignment in `game/vibes.js`

**Checkpoint**: US2 works independently with all mandatory puzzle contracts.

---

## Phase 5: User Story 3 - Reality layers and navigation across states (Priority: P2)

**Goal**: Implement layered world states with consistent visibility rules and guaranteed winnable return paths.

**Independent Test**: Player can switch layers, see deterministic visibility changes, and always return to an ending-capable route.

### Implementation for User Story 3

- [ ] T025 [US3] Implement layer graph, transition rules, and safety fallback routes in `game/layers.js`
- [ ] T055 [US3] Enforce Layer Key (V04) manual layer-switch cooldown (8s) and lockout feedback in `game/layers.js`
- [ ] T026 [P] [US3] Implement layer-driven scene visibility toggles and collider masks in `render/scene.js`
- [ ] T027 [P] [US3] Bind meter thresholds to layer bleed suggestions without removing agency in `game/vibe-meter.js`
- [ ] T028 [US3] Integrate layer state indicators and controls in `ui/hud.js`
- [ ] T029 [US3] Connect puzzle rewards to layer unlock progression in `game/puzzles/viewpoint.js`

**Checkpoint**: US3 is independently testable and does not dead-end progression.

---

## Phase 6: User Story 4 - Procedural environment mutation and Vibe painting (Priority: P2)

**Goal**: Add meter-driven visual mutation and temporary traversable paint paths on valid terrain.

**Independent Test**: Same route shows clear low/high meter visual delta; paint creates temporary traversable geometry that expires safely.

### Implementation for User Story 4

- [ ] T030 [P] [US4] Implement mutation uniforms/material modulation pipeline in `render/post.js`
- [ ] T031 [P] [US4] Author shader programs for vegetation/structure stylization in `render/shaders/mutation.glsl`
- [ ] T032 [US4] Implement paint ability state, charges, and expiry rules in `game/vibes.js`
- [ ] T033 [US4] Implement temporary bridge/path generation with collision integration in `world/terrain-tiles.js`
- [ ] T034 [US4] Add paint mode HUD affordances and invalid-placement feedback in `ui/hud.js`

**Checkpoint**: US4 delivers mutation + paint traversal mechanics independently.

---

## Phase 7: User Story 5 - Day/night rhythm and mood swing (Priority: P2)

**Goal**: Add accelerated diurnal cycle with clear mood/readability changes and comfort-aware presentation.

**Independent Test**: Forced time progression shows distinct day/night visuals and audio while preserving UI readability.

### Implementation for User Story 5

- [ ] T035 [US5] Implement accelerated clock and phase event hooks in `game/time-of-day.js`
- [ ] T036 [P] [US5] Bind sky/lighting transitions and landmark night behavior to clock phase in `render/scene.js`
- [ ] T037 [P] [US5] Implement spatial audio mood transitions keyed by meter + day/night in `audio/spatial.js`
- [ ] T038 [US5] Add comfort options (reduced motion/intensity) with non-motion day/night cues in `ui/hud.js`

**Checkpoint**: US5 is independently functional with readable, comfort-aware cycle states.

---

## Phase 8: User Story 7 - Multiple endings and replay seeding (Priority: P2)

**Goal**: Resolve endings from meter/inventory vectors and support seed-driven anomaly replay variation.

**Independent Test**: Three controlled runs produce distinct endings; changed seed moves anomalies while anchors remain fixed.

### Implementation for User Story 7

- [ ] T039 [US7] Implement ending matrix evaluator and finale gate resolution in `game/endings.js`
- [ ] T040 [P] [US7] Implement run-level meter/inventory aggregation for ending eligibility in `game/vibe-meter.js`
- [ ] T041 [P] [US7] Implement seed-driven anomaly placement API preserving fixed anchors in `content/seeds.js`
- [ ] T042 [US7] Integrate finale messaging and ending reveal UI states in `ui/hud.js`
- [ ] T043 [US7] Wire seed selection/start-new-run flow in `bootstrap.js`
- [ ] T056 [US7] Enforce Void Whisper (V06) first-run secrecy and secret unlock gating (seed + exposure condition) in `game/endings.js`

**Checkpoint**: US7 provides replayable seeded runs and all required ending archetypes.

---

## Phase 9: User Story 6 - Optional multiplayer echoes and cooperative sync moments (Priority: P3)

**Goal**: Add optional echo presence and cooperative sync spectacle without impacting solo critical path.

**Independent Test**: Two opted-in clients can trigger one sync event; disabling echoes preserves full solo completion.

### Implementation for User Story 6

- [ ] T044 [US6] Implement ephemeral session ID generation and opt-in handshake in `net/echoes.js`
- [ ] T045 [P] [US6] Implement remote echo pose interpolation and visibility rendering hooks in `render/scene.js`
- [ ] T046 [US6] Implement cooperative sync window detection and spectacle trigger in `net/echoes.js`
- [ ] T047 [US6] Integrate echoes settings, status, and offline fallback messaging in `ui/hud.js`
- [ ] T048 [US6] Enforce non-blocking solo fallback paths for all mandatory objectives in `bootstrap.js`

**Checkpoint**: US6 remains optional and never gates mandatory progression.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Performance hardening, jam compliance verification, and final delivery readiness.

- [ ] T049 [P] Implement dynamic quality scaling and LOD fallback thresholds in `render/scene.js`
- [ ] T050 [P] Optimize bundle size and dependency audit for minimal-file shipping in `package.json`
- [ ] T051 Validate jam compliance checklist and widget/embed behavior in `specs/001-presidio-vibe-psy/quickstart.md`
- [ ] T052 Validate playtest/performance matrix and acceptance outcomes in `specs/001-presidio-vibe-psy/quickstart.md`
- [ ] T053 Document final architecture decisions and deployment steps in `README.md`
- [ ] T058 Validate English-only launch copy across HUD/prompts/endings and block non-English strings in `specs/001-presidio-vibe-psy/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phases 3-9 (User Stories)**: Depend on Phase 2 completion.
- **Phase 10 (Polish)**: Depends on all targeted user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts immediately after Foundational; independent MVP baseline.
- **US2 (P1)**: Starts after Foundational; integrates with US1 meter/input systems.
- **US3 (P2)**: Depends on US2 rewards wiring for unlock progression.
- **US4 (P2)**: Depends on US3 layer rules and terrain systems.
- **US5 (P2)**: Depends on Foundational scene/audio systems; can run alongside US3/US4.
- **US7 (P2)**: Depends on US2/US3 completion signals and US1 meter/inventory data.
- **US6 (P3)**: Depends on stable solo loop from US1-US5 and ending flow from US7.

### Parallel Opportunities

- Setup: `T004`, `T005` parallel after `T001-T003` start.
- Foundational: `T007`, `T008`, `T011`, `T012` parallel with `T006/T009/T010`.
- US1: `T015` and `T016` parallel after `T014`.
- US2: `T020` and `T024` parallel with `T021`.
- US3: `T026` and `T027` parallel after `T025`.
- US4: `T030` and `T031` parallel before integration tasks.
- US5: `T036` and `T037` parallel after `T035`.
- US7: `T040` and `T041` parallel before `T042/T043`.
- US6: `T045` parallel with `T046` once `T044` is ready.
- Polish: `T049` and `T050` can run in parallel.

---

## Parallel Example: User Story 4

```bash
# Run mutation visual tasks in parallel:
Task: "T030 [US4] Implement mutation uniforms/material modulation pipeline in render/post.js"
Task: "T031 [US4] Author shader programs for vegetation/structure stylization in render/shaders/mutation.glsl"

# Then integrate gameplay-facing paint mechanics:
Task: "T032 [US4] Implement paint ability state, charges, and expiry rules in game/vibes.js"
Task: "T033 [US4] Implement temporary bridge/path generation with collision integration in world/terrain-tiles.js"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1 and Phase 2.
2. Deliver US1 core arrival loop.
3. Deliver US2 exact three-puzzle critical path.
4. Validate first-play clarity, puzzle completion, and performance budget before expanding.

### Incremental Delivery

1. Foundation -> US1 -> US2 (core judgeable build).
2. Add US3 + US4 for layered traversal and mutation depth.
3. Add US5 atmosphere cycle.
4. Add US7 endings/replay seeding.
5. Add US6 optional echoes last, preserving solo reliability.
6. Finish with Phase 10 polish and compliance audit.

### Team Parallel Strategy

1. Shared team completes Setup + Foundational.
2. Split streams:
   - Stream A: US1/US2 core gameplay
   - Stream B: US3/US4 systems
   - Stream C: US5 audio/visual cycle + US7 resolver
3. Merge into US6 optional network layer only after solo path is stable.

---

## Notes

- All tasks use explicit file paths from the approved plan module layout.
- No automated test tasks are listed because the current specification requests manual/profiling validation, not TDD/automated suites.
- Keep each user story independently shippable and verifiable through `specs/001-presidio-vibe-psy/quickstart.md`.
