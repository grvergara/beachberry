<!--
Sync Impact Report
- Version change: (unfilled template) → 1.0.0
- Principles: Initial adoption — I. Single-bundle delivery, II. AI-forward build,
  III. Ultra-light & mobile-first, IV. Psychedelic visuals first, V. Vibe Jam compliance
- Added sections: Cursor Vibe Jam 2026 & delivery window; Tech stack & scope discipline
- Removed sections: None (template placeholders replaced)
- Templates: plan-template.md ✅ | spec-template.md ✅ | tasks-template.md ✅
- Follow-up TODOs: None
-->

# Beachberry (Cursor Vibe Jam 2026) Constitution

## Core Principles

### I. Single-bundle delivery (NON-NEGOTIABLE)

The shipped game MUST be delivered as one self-contained HTML/JS bundle, or at most a
very small number of files (e.g. one HTML plus optional minimal assets only if the jam
rules allow). No multi-page SPAs, no build pipelines that fragment the playable artifact
unless they collapse to a single deployable entry. Rationale: jam deadlines, hosting
simplicity, and alignment with “drop one file and play.”

### II. AI-forward build

Approximately 90–95% of generated code MAY and SHOULD come from AI assistance (agents,
copilots, generators). Human effort focuses on direction, integration, jam rules, and
visual tuning. Rationale: speed to May 1 and honest scope for a vibe-first jam entry.

### III. Ultra-light and mobile-first

First meaningful paint and playable interaction MUST target under ~2 seconds on
typical mobile networks where reasonable; layouts and controls MUST be designed
mobile-first (touch, safe areas, performance). Heavy assets and unnecessary dependencies
are forbidden unless justified in Complexity Tracking. Rationale: accessibility and
jam judging on real devices.

### IV. Psychedelic visuals first (“wow factor”)

Visual impact—psychedelic, cohesive, memorable—has priority over feature count, backend
complexity, or deep systems design. Gameplay MUST stay simple and fun; depth comes from
shader-driven spectacle, post-processing, and motion—not from sprawling mechanics.
Rationale: project identity and jam differentiation.

### V. Vibe Jam compliance (NON-NEGOTIABLE)

The entry MUST satisfy all official Cursor Vibe Jam 2026 rules, including but not limited
to: required widget integration, no login or account wall for play, and any other
published constraints (embed, attribution, size, or content rules). Non-compliance is a
hard failure regardless of technical quality. Rationale: eligibility and fairness.

## Cursor Vibe Jam 2026 and delivery window

- **Event**: Web game for Cursor Vibe Jam 2026.
- **Deadline discipline**: Scope MUST remain shippable before **2026-05-01**; features
  that risk that date MUST be cut or deferred unless recorded and justified in plan
  Complexity Tracking.
- **Simplicity**: One core loop, minimal UI chrome, no gold-plating.

## Tech stack and scope discipline

- **Stack**: **Three.js** for 3D; **custom GLSL shaders** and **post-processing** for
  the primary visual language.
- **Scope**: No alternate render stacks without Complexity Tracking; no server-side
  gameplay requirement for the MVP.
- **Specs and tasks**: Feature specs and tasks MUST state bundle shape, jam compliance
  checkpoints, and performance assumptions explicitly.

## Governance

This constitution supersedes conflicting informal practices for this repository. All
feature plans (`plan.md`), specifications (`spec.md`), and task lists (`tasks.md`) MUST
verify the Constitution Check gates before treating design as final.

**Amendments**: Material changes require updating this file, bumping **Version** per
semantic rules (MAJOR: incompatible removals; MINOR: new principles or material guidance;
PATCH: clarifications only), setting **Last Amended** to the amendment date, and
refreshing the Sync Impact Report comment at the top.

**Compliance**: Implementers and reviewers MUST confirm Vibe Jam rules, bundle
constraints, and mobile/performance targets before merge or submission.

**Version**: 1.0.0 | **Ratified**: 2026-04-28 | **Last Amended**: 2026-04-28
