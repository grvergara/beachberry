---
name: "speckit-orch"
description: "Run speckit implementation via an orchestrator that launches a fresh subagent per task phase; each phase agent has strict phase scope, self-validates, and commits to the working branch."
compatibility: "Requires spec-kit project structure with .specify/ directory; orchestrator must be able to launch Task subagents (generalPurpose)."
metadata:
  author: "beachberry"
  source: "Derived from speckit-implement with orchestrated multi-agent strategy"
---


## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Strategy overview

This skill mirrors **speckit-implement** for prerequisites, checklists, context loading, ignore-file verification, and extension hooks. The **execution strategy** differs:

- **Orchestrator (you, the agent running this skill)**: Runs global steps once, parses `tasks.md` into phases, and for **each phase in order** launches **one fresh subagent** via the **Task** tool. You do **not** implement phase work yourself unless no Task tool is available (fallback: single-agent mode, see end).
- **Phase agent (each Task invocation)**: A **new** subagent with **no prior conversation**. Its scope is **strictly** the tasks in that single phase. It implements, **validates** its own work, updates `tasks.md` checkboxes for **that phase only**, then **commits and pushes** to the **working branch** named by the orchestrator.

Isolation rule: A phase agent **must not** read or modify work belonging to other phases except shared files when unavoidable (e.g. `tasks.md` only the lines for its phase; imports in shared modules only if the phase explicitly requires it).

## Pre-Execution Checks

**Check for extension hooks (before implementation)**:

- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_implement` key
- If the YAML cannot be parsed or is invalid, skip hook checking silently and continue normally
- Filter out hooks where `enabled` is explicitly `false`. Treat hooks without an `enabled` field as enabled by default.
- For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
  - If the hook has no `condition` field, or it is null/empty, treat the hook as executable
  - If the hook defines a non-empty `condition`, skip the hook and leave condition evaluation to the HookExecutor implementation
- For each executable hook, output the following based on its `optional` flag:
  - **Optional hook** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Pre-Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Mandatory hook** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Pre-Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}
    
    Wait for the result of the hook command before proceeding to the Outline.
    ```
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently

## Outline (orchestrator)

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse `FEATURE_DIR` and `AVAILABLE_DOCS`. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g. `'I'\''m Groot'` (or double-quote if possible: `"I'm Groot"`).

2. **Check checklists status** (if `FEATURE_DIR/checklists/` exists): same procedure as **speckit-implement** (table of totals, PASS/FAIL, stop and ask user if incomplete unless they confirm proceed).

3. **Load implementation context** (orchestrator reads for planning and for composing phase prompts):
   - **REQUIRED**: `tasks.md` (full list and phases)
   - **REQUIRED**: `plan.md`
   - **IF EXISTS**: `data-model.md`, `contracts/`, `research.md`, `quickstart.md`

4. **Project Setup Verification** (run **once** before delegating any phase): same ignore-file detection and creation logic as **speckit-implement** (git, Docker, ESLint, Prettier, Python, etc.). If you create or change ignore files here, you may commit them as a separate small commit on the working branch before the first phase, or include them in the first phase agent brief if the first phase is Setup.

5. **Resolve working branch**: Determine the current git branch (`git branch --show-current`) and treat it as the **working branch** for all phase agents. Every phase agent **must** commit to this branch only (no branch switching unless the user explicitly required it in `$ARGUMENTS`).

6. **Parse `tasks.md`**:
   - Identify **task phases** (e.g. Setup, Tests, Core, Integration, Polish — use the headings actually present in the file).
   - For each phase, collect: task IDs, descriptions, file paths, `[P]` markers, and dependency notes **within that phase**.
   - Define **strict phase boundaries**: ordered list `Phase 1 … Phase N`.

7. **Per-phase loop** (for each phase in order):

   a. **Brief**: Print the phase name, task IDs included, and working branch.

   b. **Launch a fresh phase agent** using the **Task** tool:
   - `subagent_type`: **generalPurpose** (must be able to edit files and run shell).
   - **Prompt** must include **all** of the following, adapted with concrete paths and task lists:
     - Repository root path; **working branch** name; **phase name** and **exact list of task IDs and descriptions** this run may implement.
     - **Scope rule**: Implement and modify files **only** as required by these tasks. Do not start tasks from other phases. If a dependency on another phase is missing, **report blocker** and stop without half-implementing.
     - **Docs**: Absolute paths to `plan.md`, `tasks.md`, and any other files in `AVAILABLE_DOCS` relevant to this phase.
     - **Execution rules**: Respect TDD order within the phase; same-file tasks sequential; `[P]` tasks may be parallelized inside the subagent if it can do so safely.
     - **Validation (mandatory before commit)**: Run project-appropriate checks from `plan.md` or repo conventions (e.g. lint, unit tests). Fix failures within phase scope or report failure.
     - **tasks.md**: Mark completed items as `[X]` **only** for tasks in this phase.
     - **Git**: `git status` clean for intended changes; then `git add` (only phase-related paths), `git commit` with message prefix `phase(<PhaseName>): ` and a short summary; `git push` to `origin` on the **working branch** (use `git push -u origin <branch>` if upstream missing). One commit per phase preferred; if the phase is empty, skip commit and report.
     - **Return to orchestrator**: Summary bullet list: files touched, commands run for validation, commit SHA if any, any tasks left incomplete with reason.

   c. **Orchestrator verification** after each subagent returns:
   - Confirm every task in that phase is `[X]` in `tasks.md`, or reconcile with the subagent’s stated exceptions.
   - Confirm a new commit exists on the working branch for that phase when work was expected (optional fast check: `git log -1 --oneline`).
   - If verification fails: **stop** the pipeline; do not launch the next phase until resolved (user intervention or rerun).

8. **After all phases**: Same **Completion validation** as **speckit-implement** (required tasks done, tests, alignment with spec/plan). Orchestrator performs this using the repo state after the last phase.

9. **Check for extension hooks** (`hooks.after_implement`): same output rules as **speckit-implement**.

## Fallback (no Task tool)

If the Task tool is unavailable, state that limitation once, then execute **speckit-implement** behavior: phase-by-phase yourself in one session, still validating after each phase and committing per phase to the working branch.

## Notes

- **Fresh subagent per phase** limits context bleed and keeps accountability per phase; the orchestrator carries no implementation detail across phases except git history and updated `tasks.md`.
- Orchestrator **should not** bulk-edit application code between phases; it may fix merge conflicts or checklist typos if the user asks, otherwise defer to the relevant phase agent.

Note: If `tasks.md` is incomplete, suggest running **speckit-tasks** first, same as **speckit-implement**.
