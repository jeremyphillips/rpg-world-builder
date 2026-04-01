---
name: ""
overview: ""
todos: []
isProject: false
---

# Phase 1: Combat / encounter folder ownership and import boundaries

Reference: [docs/reference/combat-encounter-refactor-reference.md](../../docs/reference/combat-encounter-refactor-reference.md)

This pass is a **folder ownership and import boundary refactor**, not a semantic rename pass.

## Architectural intent


| Layer                                  | Ownership                                    |
| -------------------------------------- | -------------------------------------------- |
| `src/features/mechanics/domain/combat` | Shared engine / runtime / state / resolution |
| `src/features/encounter`               | Feature / workflow / UI composition          |


**Invariant (this phase):** Code inside `src/features/mechanics/domain/combat` **must not** depend on `src/features/encounter`. Encounter may temporarily re-export from combat to reduce churn; combat must not import through encounter shims.

## Deliverables

1. Rename shared mechanics engine folder: `src/features/mechanics/domain/encounter` → `src/features/mechanics/domain/combat`.
2. Move runtime board/space: `src/features/encounter/space` → `src/features/mechanics/domain/combat/space`.
3. Fix cross-layer dependency inversions required for the move (see below).
4. Update imports/exports and pass verification.

## Guardrails (hard rules)

- **Do not** rename runtime types (`EncounterState`, `EncounterSpace`, etc.).
- **Do not** rename encounter feature folders, routes, or components that remain feature-owned.
- **Do not** change user-facing labels or copy.
- **Do not** pull in Phase 2+ work unless required to unblock this phase.
- **Do not** reorganize unrelated helpers/components just because they are nearby.
- **Do not** leave engine code importing from `src/features/encounter`.
- **Minimal semantic change** — mechanical ownership pass only.

## Required dependency fixes (before or during the move)

### 1. `area-grid-action.ts` → combat resolution

**Problem:** Engine code imports a pure helper from `src/features/encounter/helpers/actions/area-grid-action.ts` (engine → feature inversion).

**Fix:**

- Move to: `src/features/mechanics/domain/combat/resolution/action/area-grid-action.ts` (after `encounter` folder is `combat`, or create file in `encounter` then rename with folder — follow execution order).
- Update engine consumers to import from the combat path.
- Optional **thin temporary re-export** at old encounter path:
  - no logic; one-line pass-through only;
  - comment: temporary Phase 1 shim;
  - **combat engine code must not import through the shim.**

### 2. `ViewerCombatantPresentationKind` → combat-owned types

**Problem:** Space files import from encounter domain; moving space under combat would create combat → encounter dependency.

**Fix:**

- Add: `src/features/mechanics/domain/combat/presentation/view.types.ts` exporting `ViewerCombatantPresentationKind`.
- Space (and any other combat modules) import from combat presentation types.
- Encounter-owned types may re-export or import from combat for a single source of truth.

### 3. Barrel cycles

- Prefer **deep imports** inside combat modules.
- **Do not** import from root `combat` barrel inside `combat/space`.
- Add `export * from './space'` to `combat/index.ts` **only if** cycle-safe; if in doubt, keep `combat/space` as an explicit subpath import for this phase.

## Execution order

1. Create/finalize combat-owned landing spots:
  - `resolution/action/area-grid-action.ts` (under mechanics domain — path becomes `combat/...` after step 3, or add under `encounter` then mv with folder)
  - `presentation/view.types.ts`
2. Update blocking imports so engine-owned files no longer depend on encounter-owned files for these seams.
3. `git mv` `src/features/mechanics/domain/encounter` → `src/features/mechanics/domain/combat`
4. `git mv` `src/features/encounter/space` → `src/features/mechanics/domain/combat/space`
5. Rewrite imports:
  - `@/features/mechanics/domain/encounter` → `@/features/mechanics/domain/combat`
  - `@/features/encounter/space` → `@/features/mechanics/domain/combat/space`
6. Update encounter feature files that used **relative** imports into `space` to use the combat-owned path (`@/features/mechanics/domain/combat/space/...`).
7. Update barrels/exports only as far as safe (see barrel rules above).
8. Run verification; fix stragglers.

**Note:** Step 1 file paths: if `area-grid-action` is created before the folder rename, it may briefly live at `.../encounter/resolution/action/area-grid-action.ts` and move with `git mv` of the parent folder; alternatively create files only after step 3. Prefer whichever avoids duplicate work — the user’s order favors landing spots first: implement by adding files under `encounter`, then single `git mv` renames folder to `combat` (paths update in bulk).

## Verification

### Stage A

- Typecheck (`tsc` / project script as used in repo).
- Targeted tests around moved combat/space files if needed.

### Stage B

- Full test suite.

### Grep / structural checks

- No remaining `@/features/mechanics/domain/encounter`.
- No `src/features/encounter/space` directory.
- No imports from `src/features/encounter` anywhere under `src/features/mechanics/domain/combat`.

## Definition of done

- Engine folder is `combat`; runtime `space` lives under `.../combat/space`.
- Old engine import paths are gone.
- Engine code does not depend on encounter feature code (shims are encounter-boundary-only, one-way).
- Temporary re-exports are thin and commented.
- Typecheck passes; full tests pass.
- No semantic/type renaming beyond folder/import ownership.

## Follow-up (not this pass)

- Renaming runtime types (`EncounterState`, etc.).
- Moving `src/features/encounter/domain` into combat presentation/selectors.
- Extracting reusable client combat UI into `src/features/combat`.
- Intents/events.
- Broader helper folder cleanup.

---

## Implementation todos

- Add `combat/presentation/view.types.ts` and wire `ViewerCombatantPresentationKind`; update encounter view types to use combat as source of truth.
- Move `area-grid-action.ts` into `combat/resolution/action`; thin re-export at encounter helpers; fix engine imports to combat only.
- `git mv` mechanics/domain/encounter → combat; rewrite all `@/.../encounter` imports.
- `git mv` encounter/space → mechanics/domain/combat/space; rewrite space imports + encounter relative `../space` imports.
- Verify barrels (optional `export * from './space'` only if cycle-safe).
- Stage A + Stage B verification + grep checks.

