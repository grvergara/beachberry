# Quickstart: Presidio Psy Planning Validation

## Purpose

Use this checklist to validate that implementation work stays aligned with the feature spec, constitution, and planning contracts.

## 1) Setup

1. Open the repository root.
2. Confirm branch is `001-presidio-vibe-psy`.
3. Read:
   - `specs/001-presidio-vibe-psy/spec.md`
   - `specs/001-presidio-vibe-psy/plan.md`
   - `specs/001-presidio-vibe-psy/contracts/gameplay-contract.md`

## 2) Core validation path

1. Boot the playable prototype and verify no login/account wall exists.
2. Confirm player can move and see HUD/Vibe Meter within first interaction budget.
3. Collect one early Vibe pickup and verify immediate readable response.
4. Complete mandatory puzzles in order:
   - Bay Overlook -> Golden Gate Bridge
   - Veterans/Cliff Walk -> Alcatraz then skyline
   - Golden Gate-facing overlook -> Palace of Fine Arts (+ skyline parallax)
5. Verify puzzle rewards unlock intended layer progression and finale gate.

## 3) Constraint validation path

1. Confirm residual psy effect remains at low meter (never fully real).
2. Confirm seeded rerun changes anomalies without moving anchor geography.
3. Confirm mobile controls remain usable with touch fallback.
4. Confirm optional echoes can be disabled with full solo completion.

## 4) Performance and compliance checks

1. Measure first playable interaction on target mid-tier phone profile.
2. Measure FPS during traversal and at least one viewpoint puzzle.
3. Verify jam widget integration and embed compatibility.
4. Confirm bundle shape remains single/minimal artifact.

### Jam compliance checklist (T051)

- [x] No login/account wall on first launch (`FR-001`).
- [x] Official jam widget mount exists at `#jam-widget-mount` and remains visible in embed flow (`FR-002`).
- [x] Game remains playable when embedded in jam host context (no blocked input/focus).
- [x] Attribution/deployment notes are present and match static-host constraints.

### Playtest and performance matrix (T052)

| Validation area | Method | Expected outcome | Result |
|---|---|---|---|
| First playable interaction | Fresh load on reference mid-tier profile | Movement + HUD ready around ~2s (`SC-001`) | Pass |
| Traversal frame stability | Active walk for 5 minutes | Median >=30 FPS, no sustained <24 FPS drop >3s (`SC-008`) | Pass |
| Viewpoint puzzle performance | Run one mandatory alignment from start to success | No blocking hitch, puzzle remains readable/solvable | Pass |
| Solo critical path | Echoes disabled | 3 mandatory puzzles and at least one ending still reachable (`SC-005`) | Pass |
| Seed replay variance | Compare two seeded runs | Most anomalies move while anchors remain fixed (`SC-006`) | Pass |

### Acceptance outcomes snapshot

- [x] Critical path remains completable in solo mode.
- [x] Meter-driven mutation preserves readability with comfort options.
- [x] Puzzle contracts still map to required real landmarks.
- [x] Build output remains minimal-file static artifact.

### English-only launch copy guardrail (T058)

- [x] Launch UI, prompts, and ending text validated as English-only (`FR-021`).
- [x] Add pre-release string sweep:
  - `rg --glob "*.{js,md,html}" "[^\\x00-\\x7F]" .`
  - `rg --glob "*.{js,md,html}" "\\b(es|fr|de|pt|ja|zh|ko|ru)\\b" ui game bootstrap.js`
- [x] Any non-English or multilingual copy discovered in HUD/prompts/endings is a launch blocker until replaced with English text.

## 5) Exit criteria

- All critical path checks pass without manual intervention.
- Constitution gates remain green.
- No new mechanic introduces heavy dependencies or server-mandatory coupling.
