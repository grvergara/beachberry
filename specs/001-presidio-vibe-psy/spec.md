# Feature Specification: Presidio Psy

**Feature Branch**: `001-presidio-vibe-psy`  
**Created**: 2026-04-28  
**Status**: Draft  
**Input**: User description: Web psy-fi 3D adventure on the real Presidio Tunnel Tops map (San Francisco); relaxed exploration that bends into a controlled neon-psy rupture as players collect “Vibes” and alter reality; Vibe Jam 2026 constraints (single bundle, fast load, no login, official widget, mobile-friendly); full mechanic set including viewpoint puzzles, reality layers, procedural environment mutation, day/night cycle, optional lightweight multiplayer echoes, multiple endings; target run 15–40 minutes with procedural seeding for Vibe placement.

## Clarifications

### Session 2026-04-27

- Q: What should be the default multiplayer echoes behavior on first launch? → A: Multiplayer echoes disabled by default; player can opt in.
- Q: What launch localization scope should be committed? → A: English-only UI and narrative at launch.
- Q: What player identity model should optional echoes use? → A: Ephemeral random session ID only (no stored history).
- Q: How many viewpoint puzzles are required on the critical path? → A: Exactly 3 required viewpoint puzzles.
- Q: What should be the target median completion time? → A: 25 minutes.
- Q: What minimum runtime performance target should be required on a mid-tier phone? → A: At least 30 FPS.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First arrival and “real enough” park walk (Priority: P1)

A player opens the game on mobile or desktop and within moments can move through a recognizable slice of Presidio Tunnel Tops (paths, overlooks, key landmarks readable at a glance). They see a clear **Vibe Meter** and notice the world subtly respond as the meter moves. They can collect at least one **Vibe** from a visible anomaly and feel a tangible change (movement option, visual layer hint, or puzzle affordance).

**Why this priority**: Without instant readability of place, the meter, and first collection, the fantasy does not land and the jam “wow in seconds” goal fails.

**Independent Test**: Ship only park traversal + meter + one collectible + minimal feedback; a new player should understand where they are and what to chase in under two minutes of play.

**Acceptance Scenarios**:

1. **Given** the experience has finished its initial lightweight bootstrap, **When** the player enters the world, **Then** they can navigate the bounded park area without account creation or login.
2. **Given** the player is moving, **When** the Vibe Meter rises and falls from actions (collection, alignment success, time of day, etc.), **Then** the environment’s saturation, motion, and “psy” intensity change in a way that is reversible when the meter drops (while a subtle residual strangeness remains).
3. **Given** a Vibe pickup exists in the scene, **When** the player reaches and collects it, **Then** they receive readable feedback (meter change, short effect, or new capability state) and the run can continue.

---

### User Story 2 - Viewpoint alignment puzzles at real overlooks (Priority: P1)

At designated overlooks (e.g. Bay-facing and landmark-facing vantage points), the player discovers puzzles that require aiming their view toward recognizable distant landmarks while managing meter-driven distortion. Solving an alignment unlocks a **new layer** of paths, objects, or narrative beats.

Mandatory puzzle set (critical path, exactly three):
- **Puzzle 1 — Bay Overlook**: Align to **Golden Gate Bridge** (reward: unlocks Psy layer + short-flight ability).
- **Puzzle 2 — Veterans Overlook / Cliff Walk**: Align to **Alcatraz** and then stabilize on **SF skyline** in sequence (reward: opens Fractal layer + paint ability).
- **Puzzle 3 — Golden Gate-facing overlook / Presidio Point node**: Align to **Palace of Fine Arts** with skyline parallax confirmation (reward: access to Void layer + finale gate).


**Why this priority**: This is the signature “real map + mind game” hook and differentiates the entry from generic walking sims.

**Independent Test**: Implement one overlook with one alignment target and one reward (layer toggle or path reveal); verify solvable on both touch and pointer-based look controls.

**Acceptance Scenarios**:

1. **Given** the player stands at an overlook puzzle node, **When** they orient their view within the defined tolerance toward the specified landmark for the required dwell time (while meeting any stated Vibe gating), **Then** the puzzle completes and the promised layer or route becomes available.
2. **Given** the meter is high and visuals are heavily distorted, **When** the player uses the documented mitigation (temporary ability, layer switch, or UI aid tied to a Vibe), **Then** they can still complete the alignment without soft-locking progress.

---

### User Story 3 - Reality layers and navigation across states (Priority: P2)

The player can move among **3–4 stacked reality layers** (nominally: more grounded → more psychedelic → fractal-like → void-like). Changing layers reveals or hides routes, collectibles, and puzzle elements. The meter and layer interact so that high meter may auto-suggest or temporarily “bleed” adjacent layers without removing player agency to return.

**Why this priority**: Layers turn exploration into spatial reasoning and replay, and support the “never 100% normal” promise.

**Independent Test**: Two layers only for a slice build: verify occlusion rules, collectible visibility, and that the player can always return to a winnable state.

**Acceptance Scenarios**:

1. **Given** two or more layers exist, **When** the player triggers a layer change via the documented controls or puzzle rewards, **Then** scene elements tied to each layer obey consistent visibility rules (paths, pickups, alignment markers).
2. **Given** the player is on an advanced layer, **When** they choose to descend layers or reduce the meter, **Then** they can still reach at least one valid exit state toward an ending path (no dead-end without feedback).

---

### User Story 4 - Procedural environment mutation and Vibe “painting” (Priority: P2)

Vegetation, benches, and built structures in the park footprint **visually mutate** based on meter level and noise-driven variation. With an earned Vibe that grants “painting,” the player can apply temporary bridges or walkable paths on valid terrain regions, readable as play affordances rather than decoration only.

**Why this priority**: Delivers the “living park” fantasy and supports puzzle routing without expanding raw map size.

**Independent Test**: Fixed seed: meter low vs high screenshots show clear visual delta; painting places a temporary traversable strip that decays or expires per rules.

**Acceptance Scenarios**:

1. **Given** the meter increases through defined thresholds, **When** the player traverses the same route, **Then** vegetation and select structures show progressive stylization (color, motion, silhouette) that remains performant on a mid-tier phone.
2. **Given** the player holds the painting Vibe state, **When** they activate it on terrain validated by the experience rules, **Then** a temporary path or bridge appears and supports collision/travel until its timer or meter condition expires.

---

### User Story 5 - Day/night rhythm and mood swing (Priority: P2)

Time advances faster than real time. **Day** favors clearer navigation and calmer audio/visuals; **night** intensifies psychedelic sky phenomena and landmark-linked lighting behavior. The player can learn to use the cycle for risk/reward (e.g. harder alignment at night with richer rewards).

**Why this priority**: Cheap systemic depth that reinforces the meter and jam “spectacle first” goal.

**Independent Test**: Force time to advance in QA; verify distinct day vs night readability of critical UI and puzzle markers.

**Acceptance Scenarios**:

1. **Given** the diurnal cycle is running, **When** the world enters night according to the in-game clock, **Then** audio and sky treatments shift per the design bible (stars, bridge lights behavior) without hiding mandatory UI.
2. **Given** a player is sensitive to motion, **When** they use documented comfort options if provided (e.g. reduced motion or intensity slider from jam-safe settings), **Then** day/night still communicates state through non-motion cues (palette, icons).

---

### User Story 6 - Optional multiplayer “echoes” and cooperative sync moments (Priority: P3)

When networking is available and the player opts in, other players appear as **semi-transparent echoes**. Lightweight cooperative sync (e.g. simultaneous Vibe states) triggers **large shared spectacle** (portal, pillar, or layer surge) that benefits all participants briefly.

**Why this priority**: Strong differentiation but must remain optional so solo play and judging remain reliable.

**Independent Test**: Two clients in a test harness can see echoes and trigger one co-op spectacle once per documented rule.

**Acceptance Scenarios**:

1. **Given** multiplayer is disabled or offline, **When** the player plays through the full run, **Then** all mandatory puzzles, layers, and endings remain completable.
2. **Given** multiplayer is enabled and another echo is present, **When** both meet the sync condition within a time window, **Then** the cooperative spectacle fires and leaves no permanent progression block after it ends.

---

### User Story 7 - Multiple endings and replay seeding (Priority: P2)

A single run (target **15–40 minutes** for a completionist path) culminates in one of **multiple endings** keyed to meter balance and Vibes collected (including at least: a grounded “Real” outcome, a maximalist “Total Psy” outcome, and a secret “You were a glitch” outcome). New runs can vary collectible placement using a **procedural seed** so routes feel fresh.

**Why this priority**: Endings encode player expression through mechanics; seeding supports replay without new raw content.

**Independent Test**: Drive three runs with controlled meter/Vibe vectors to reach three distinct endings; second device run with different seed shows moved anomalies while landmarks stay fixed.

**Acceptance Scenarios**:

1. **Given** documented ending thresholds, **When** the player reaches the finale gate, **Then** the resolved ending matches their aggregate meter bias and Vibe inventory per the ending matrix.
2. **Given** the player starts a new run with a different seed, **When** they compare anomaly placements to a prior run, **Then** at least the seeded movable elements differ while real-world anchor locations remain consistent.

---

### Edge Cases

- **Low-power device / thermal throttle**: Visuals degrade along a documented LOD path; core movement, meter, and one alignment puzzle remain completable.
- **Permissions denied** (gyro, fullscreen): Controls fall back to touch + on-screen look; desktop falls back if pointer lock is denied mid-session without corrupting camera state.
- **Network loss mid “echo” session**: Solo rules resume instantly; no lost inventory; co-op spectacle cancels safely.
- **Player spikes meter early**: Puzzles remain solvable via abilities, layer shifts, or temporary “clarity” beats—no sequence breaks that require restarting the run.
- **Player avoids all optional Vibes**: Core progression still allows reaching at least one valid ending with clear feedback that others were missed.
- **Jam widget or embed host quirks**: Game remains playable and compliant when embedded in the official jam context (widget visible per rules, no hard dependency on external accounts).

## Requirements *(mandatory)*

### Functional Requirements

#### World and compliance

- **FR-001**: The shipped experience MUST be a **free-to-play web game** with **no login or account wall** to begin or continue play.
- **FR-002**: The entry MUST integrate the **official Cursor Vibe Jam 2026 widget** and satisfy all published jam constraints the team adopts into this repo’s constitution (bundle shape, attribution, embed behavior).
- **FR-003**: The playable map MUST represent the **real Presidio Tunnel Tops** footprint at readable fidelity, bounded to approximately **500 m × 500 m** to protect load and performance budgets.
- **FR-004**: First meaningful interaction (move + see meter respond) MUST occur under the project’s **initial load budget** (constitution: target under ~2 seconds to first playable interaction on typical mobile where reasonable).

#### Locomotion and comfort

- **FR-005**: Players MUST be able to explore in **first-person 3D** on desktop and mobile with **mobile-first** layouts (safe areas, readable HUD).
- **FR-006**: Look controls MUST support **pointer-based look** on desktop where available, with **touch drag** (and optional motion sensors where permitted) on mobile, each with a graceful fallback if a capability is unavailable.

#### Core loop

- **FR-007**: The experience MUST present a persistent **Vibe Meter** whose level is understandable at a glance and drives escalating/receding “psy distortion” of the environment.
- **FR-008**: When the meter decreases, the world MUST trend toward a more grounded presentation, while **never returning to fully mundane** presentation (a subtle residual effect always remains, and no state reaches a mathematically “100% real” baseline).
- **FR-009**: The world MUST contain **collectible Vibes** placed at plausible real-world coordinates within the bounded map, each granting **temporary or persistent** abilities or states documented in the ability matrix (see Supplement).

#### Puzzles and progression

- **FR-010**: At **real overlooks** within the map, the experience MUST include **viewpoint alignment puzzles** that require aiming toward **real distant landmarks** (e.g. suspension bridge toward the ocean, island prison, downtown skyline) within tolerance windows, sometimes gated by meter or Vibe state.
- **FR-023**: The critical path MUST require completion of **exactly 3** viewpoint alignment puzzles before finale gate access.
- **FR-011**: Completing viewpoint puzzles MUST unlock **layer content** (paths, objects, or narrative beats) per puzzle contract.
- **FR-012**: The experience MUST implement **3–4 superposed reality layers** with consistent rules for what exists in each layer and how the player transitions.

#### Systems

- **FR-013**: Park elements (vegetation, select structures, props) MUST **visually mutate** as a function of meter level and procedural variation rules.
- **FR-014**: With the appropriate Vibe, the player MUST be able to **author temporary traversable paths or bridges** on valid terrain according to placement rules and duration caps.
- **FR-015**: The experience MUST run an **accelerated day/night cycle** that measurably changes mood (audio + sky + landmark-related lighting behavior) while preserving critical readability.
- **FR-016**: **Optional lightweight multiplayer** MUST be implementable as a mode where remote players appear as **echo avatars**; the experience MUST default to echoes **disabled** on first launch and require explicit player opt-in; when enabled, defined **cooperative sync events** MUST be possible without blocking solo completion when disabled or offline.
- **FR-022**: Optional echoes networking MUST use only **ephemeral random session IDs** with no persistent player handle and no session history storage.
- **FR-017**: The game MUST support **multiple endings** resolvable in one run, keyed to **meter balance** and **Vibes collected**, including at minimum the three archetypes: grounded “Real”, maximalist “Total Psy”, and secret “Eras un glitch”.
- **FR-018**: New runs MUST accept a **procedural seed** that changes placement of movable anomalies while **not** relocating real anchor geography used for orientation.

#### Sensory presentation

- **FR-019**: Audio MUST use **spatial positioning** for environmental wind and evolving drones that intensify with meter and night state, without requiring copyrighted real-world recordings unless cleared.

#### Build and delivery shape

- **FR-020**: Deliverable MUST match **single-bundle or minimal-file** shipping per constitution: one primary HTML entry with collapsed logic, plus only optional tiny assets if jam rules allow, with **initial transfer budget** aligned to ultra-light goals (project target **under ~8 MB** for first playable payload where feasible).
- **FR-021**: Launch UI and narrative text MUST ship in **English only**; additional languages are explicitly out of scope for this jam submission.
- **FR-024**: All core mechanics (viewpoint puzzles, layer transitions, mutation, day/night, optional echoes) MUST remain **ultra-lightweight**: no heavy runtime dependencies, no server-mandatory systems, and no mechanic may require breaking single/minimal-bundle constraints.

### Key Entities

- **Player run**: Seed, start time, current meter value and history aggregates, owned Vibes, current layer, time-of-day clock, flags for completed puzzles and sync events, ending eligibility vector.
- **Vibe pickup**: Identifier, world position (seed-relative), permanence class (temporary vs persistent effect), effect contract (movement modifier, clarity burst, paint charge, etc.), stacking rules with other Vibes.
- **Reality layer**: Ordinal depth, visibility rules for meshes/pickups/colliders, transition costs (meter/time), audio filter profile.
- **Viewpoint puzzle**: Overlook anchor ID, landmark target(s), tolerance cones/dwell time, optional Vibe gates, reward (layer unlock, bridge token, meter clip).
- **Echo player (optional)**: Ephemeral representation, sync state for co-op spectacle, ephemeral random session ID, no PII, no persisted history.
- **Ending**: Preconditions on meter histogram and inventory bitmask; resulting epilogue variant.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a reference mid-tier phone profile defined in planning, **first playable movement** (walk + HUD visible) occurs within **~2 seconds** of navigation start under the team’s throttled test profile.
- **SC-002**: **≥90%** of shipped source lines are attributable to **AI-assisted generation** with human integration, per the jam’s stated expectation and team tracking method.
- **SC-003**: **≥95%** of playtesters in structured sessions complete **first Vibe collection** and **one viewpoint puzzle** without coaching in under **10 minutes**.
- **SC-004**: A full completionist run (layers + major puzzles + one ending) completes in **15–40 minutes**, with a target median of **25 minutes** across internal playtests.
- **SC-005**: With multiplayer disabled, **100%** of critical path puzzles and **at least one ending per archetype** remain reachable (verified by test matrix).
- **SC-006**: Changing procedural seed alters **≥70%** of anomaly placements versus a baseline screenshot set while **landmark sightlines** from overlooks remain valid for puzzle targets.
- **SC-007**: **Jam compliance checklist** (widget, no login, embed, attribution) passes a pre-submit audit with zero blocking issues.
- **SC-008**: On the reference mid-tier phone profile defined in planning, median runtime frame rate during active traversal and one viewpoint puzzle remains **≥30 FPS** with no sustained drops below **24 FPS** for longer than **3 seconds**.

## Assumptions

- Official jam text remains compatible with a **single-file or near-single-file** deliverable and permits the chosen geodata approach within size rules; any deviation is recorded before submit.
- **Geodata licensing** for the Presidio slice (tiles, height, OSM-derived props) is cleared for competition display and hosting.
- Players understand **English** UI copy; localization is out of scope for this jam submission unless explicitly re-scoped.
- “**Real map**” means believable correlation to paths and overlooks, not survey-grade centimeter accuracy.
- AI line-count reporting uses a simple definition (e.g. generated vs hand-edited file attribution) documented in the plan phase.

## Supplement: Planning inputs for `/speckit-plan` *(technical handoff)*

This section exists so planners and implementers receive the concrete structure requested without mixing jam **product requirements** above with **build blueprints**.

### A. Mechanic state machine (summary)

| Mechanic | States | Key transitions |
|----------|--------|-------------------|
| Vibe Meter | Low / Mid / High / Overdrive (optional) | Pickups ↑; alignment clears ↓; time-of-night biases; certain Vibes clamp or spike |
| Reality layers | Real → Psy → Fractal → Void (3–4) | Puzzle rewards, meter thresholds, dedicated layer item, death/reset of layer-only entities |
| Viewpoint puzzle | Idle → Aligning → Success / Fail cooldown | Gaze within cone + dwell; Vibe-gated “clarity”; fail applies soft penalty (meter flutter) not hard lock |
| Vibe abilities | Inactive → Active → Cooldown / Charges | Pickup grants; duration or meter drain; co-op sync may refresh charges |
| Day/night | Phase clock 0–1 | Accelerated time; night unlocks stronger shaders/audio layers |
| Multiplayer echo | Off / Solo-compatible / Echo-visible | Opt-in flag; presence channel; spectacle window open/closed |
| Ending resolver | Open → Locked-in at finale gate | Evaluate meter integral + inventory + secret flags |

### B. Final title and tone

- **Final title**: *Presidio Psy*  
- **Runner-up alternates**: *Cliff Walk Void*, *Tunnel Tops Fracture*, *Bluff Glitch*  
- **Tone keywords**: hopeful weird, California golden-hour -> neon void, “park that remembers you”, psy-fi awe with legible navigation.

### C. Color and art direction

- **Palette**: late **golden hour amber** + **Pacific teal** + **magenta–violet** accents + **void ink** backgrounds in advanced layers.  
- **Materials**: glossy wet paths at night, chalk-bright playground accents, desaturated fog for “Real” bias ending path.  
- **Sky**: day starts photo-plausible; night introduces **fractal starfields** and **aurora ribbons** tied to meter.  
- **Landmark treatment**: bridge and skyline silhouettes remain **readable anchors** until highest layers, then **controlled glitch** (never unreadable chaos for more than a few seconds without player opt-in intensity).

### D. Recommended module layout (single bundle, logical modules)

Logical files inside one bundle (names indicative):

- `index.html` — shell, jam widget mount, canvas, minimal CSS.  
- `bootstrap.js` — feature detection, asset budget, first frame.  
- `world/terrain-tiles.js` — bounded geodata load, LOD, collision mesh extraction.  
- `world/park-anchors.js` — overlooks, paths, playground, campfire circle anchors (authoring data).  
- `game/player.js` — movement, stamina if any, input routers.  
- `game/vibe-meter.js` — meter dynamics, thresholds, hooks to post stack.  
- `game/vibes.js` — catalog, pickups, ability controllers.  
- `game/layers.js` — layer graph, visibility, transitions.  
- `game/puzzles/viewpoint.js` — cones, dwell timers, gating.  
- `game/time-of-day.js` — clock, curves, bindings to lights/audio.  
- `game/endings.js` — resolver, epilogue scenes.  
- `net/echoes.js` — optional presence + sync spectacle (stubbable).  
- `render/scene.js` — renderer, cameras, resize.  
- `render/shaders/*.glsl` — psy passes, grass mutation, sky fractals.  
- `render/post.js` — bloom, glitch, custom compose order.  
- `audio/spatial.js` — wind beds + drones + one-shot stingers.  
- `content/seeds.js` — RNG, anomaly placement from seed.  
- `ui/hud.js` — meter, prompts, minimal settings (motion reduction).

### E. Three.js component checklist (r168+)

- **Core**: `WebGLRenderer`, tone mapping choice documented, `PMREM` if needed for probes, performance monitor in dev.  
- **World**: instanced meshes for grass/trees; merged static geometry for park props; **LOD** groups tied to camera distance.  
- **Geospatial stack (DECIDED)**: **Flywave.gl is the primary path** (native Three.js integration, modular loading, tighter control for minimal bundle). **3DTilesRendererJS is fallback-only** if Flywave.gl integration is blocked by data/licensing issues; fallback still must honor transfer budget.  
- **Compression**: **Draco** / **KTX2** where meshes/textures appear.  
- **Physics**: **basic collisions** player ↔ terrain ↔ simple props; no deep physics puzzle reliance.  
- **Post**: `EffectComposer` chain with **bloom**, **glitch**, meter-driven uniforms; custom full-screen shader for sky/fractal layer.  
- **Input**: pointer lock + touch; gyro optional.

**Geospatial decision (locked for implementation)**:
- Primary: Flywave.gl (preferred for native Three.js path + modularity + bundle control).
- Fallback (only if blocker): 3DTilesRendererJS + custom heightmap/satellite texture for Tunnel Tops area.
- Scope: only the central playable corridor (Outpost -> Cliff Walk -> Overlooks -> Campfire Circle), with real anchors:
  - Outpost playground
  - Cliff Walk trail spine
  - Bay Overlook
  - Veterans Overlook
  - Golden Gate-facing overlook node
  - Campfire Circle
  - Presidio Steps
  - Main Lawn / picnic lawns
  - Transit/visitor edge near Presidio Transit Center access
- Landmark targets used by mandatory puzzles:
  - Golden Gate Bridge
  - Alcatraz Island
  - San Francisco skyline
  - Palace of Fine Arts

### F. Phased implementation plan (iterative)

1. **Phase 0 — Compliance shell**: HTML entry, widget, resize, settings stub, performance HUD (dev).  
2. **Phase 1 — Park slice**: load bounded geo, walkable collision, day cycle baseline, spatial wind audio.  
3. **Phase 2 — Meter + post stack**: meter HUD, distortion ramps, never-fully-normal residual.  
4. **Phase 3 — Vibes v1**: 3 pickups, 2 temp abilities, 1 persistent, seed placement.  
5. **Phase 4 — Layers**: 3 layers with visibility rules + one puzzle-gated transition to fourth if scoped.  
6. **Phase 5 — Viewpoints**: exactly 3 mandatory overlooks with real landmark alignment contracts + rewards.  
7. **Phase 6 — Mutation + paint**: grass/tree shaders; paint bridge with decay rules.  
8. **Phase 7 — Night suite**: bridge lights behavior, star fractals, stronger drones.  
9. **Phase 8 — Endings**: matrix, finale gate, three endings + secret flag path.  
10. **Phase 9 — Echoes (optional)**: presence, sync spectacle, hard solo fallback.  
11. **Phase 10 — Polish pass**: LOD, bundle crunch, device matrix, jam audit.

## Constitution alignment

This specification adopts **Beachberry Constitution v1.0.0** (`/.specify/memory/constitution.md`): single-bundle delivery, AI-forward build, ultra-light mobile-first targets, psychedelic visuals first within ethical comfort, and non-negotiable Vibe Jam compliance. Conflicts between feature ambition and constitution MUST be resolved in planning via explicit deferrals.
