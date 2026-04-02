---
name: ""
overview: ""
todos: []
isProject: false
---

# Phase 3 decomposition — reusable client combat UI

**Reads:** [docs/reference/combat-encounter-refactor-reference.md](../../docs/reference/combat-encounter-refactor-reference.md), prior Phase 3 outline in [.cursor/plans/phase_3_combat_client_ui_3f6aeac0.plan.md](./phase_3_combat_client_ui_3f6aeac0.plan.md). **Combat authority / gaps:** [docs/reference/combat/README.md](../../docs/reference/combat/README.md), [docs/reference/combat/roadmap.md](../../docs/reference/combat/roadmap.md).

**Target:** `src/features/combat/{components,hooks,presentation}` owns reusable client combat UI. `**src/features/combat` must not import `src/features/encounter`.** No route/setup moves; no `EncounterState` renames; no whole-drawer moves by default.

---

## 1. Proposed subphases (buildable passes)

Each pass should end with a green typecheck + test run and a grep proving no `features/encounter` imports under `features/combat`.

### Pass 3A — Scaffold reusable combat UI + move lowest-risk primitives

**Goal:** Establish the reusable **client** combat UI layer at `src/features/combat/components`, `src/features/combat/presentation`, and optional empty `src/features/combat/hooks` (**do not populate hooks** unless clearly necessary). Move the lowest-risk prop-driven React combat primitives out of Encounter. This is a **narrow boundary-establishing pass**, not a broad UI refactor.

**Why isolate**

- Create the new client combat UI **ownership boundary** and validate **import direction** (`Encounter` → `combat`; never `combat` → `Encounter`).
- Extract **obvious** prop-driven primitives first.
- **Avoid** grid, drawers, setup flow, route orchestration, and active Ally/Opponent cards in this pass.

**Scaffold (in scope)**

- Create:
  - `src/features/combat/components` — use clear subfolders where useful (e.g. `avatar/`, `cards/`).
  - `src/features/combat/presentation` — present even if empty in 3A (Pass 3B will populate).
  - Optional `src/features/combat/hooks` — **empty** unless a move absolutely requires a tiny hook (unlikely in 3A).
- **Do not** add a giant catch-all barrel if it risks cycles; prefer folder-level or narrow exports; mirror existing app patterns.

**Move list — preferred destinations**


| Source                                                                                                            | Preferred destination                                              |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `[CombatantAvatar.tsx](../../src/features/encounter/components/shared/CombatantAvatar.tsx)`                       | `src/features/combat/components/avatar/CombatantAvatar.tsx`        |
| `[CombatantPreviewCard.tsx](../../src/features/encounter/components/shared/cards/CombatantPreviewCard.tsx)`       | `src/features/combat/components/cards/CombatantPreviewCard.tsx`    |
| `[combatant-badges.tsx](../../src/features/encounter/components/shared/cards/combatant-badges.tsx)`               | `src/features/combat/components/cards/combatant-badges.tsx`        |
| `[CombatActionPreviewCard.tsx](../../src/features/encounter/components/active/cards/CombatActionPreviewCard.tsx)` | `src/features/combat/components/cards/CombatActionPreviewCard.tsx` |


**Consumers and optional compatibility re-exports**

- Update Encounter (and any other) imports to consume **combat-owned** paths.
- **Optional:** temporarily re-export moved symbols from `[encounter/components/index.ts](../../src/features/encounter/components/index.ts)` only if that **materially reduces churn**.
- If re-exports exist: keep them **thin**, add a **temporary** comment, and remember **Encounter may re-export from combat; combat must not import from Encounter.**

**Hard constraints**

- `**src/features/combat/`** must not import from `src/features/encounter/`**** — including routes, setup, `EncounterRuntimeContext`, Encounter hooks, Encounter-only helpers.
- If a candidate **depends on Encounter-owned code**: split (reusable leaf in combat, wrapper in Encounter), **or** leave in Encounter and note the blocker — **do not force** a move that violates the boundary.
- **Minimal prop churn:** do not redesign props unless required to remove Encounter coupling.

**Candidate-specific guidance**

- `**CombatantAvatar`:** Strong move if purely prop-driven. If it relies on Encounter-only image helpers, move a reusable helper into combat/mechanics-appropriate place **or** split the dependency cleanly.
- `**CombatantPreviewCard`:** Strong move; keep presentation-focused; no route or feature workflow dependencies.
- `**combatant-badges`:** Move if truly reusable; audit for Encounter-only formatting or feature semantics — if mixed, split reusable badge rendering from Encounter-specific wrapper logic.
- `**CombatActionPreviewCard`:** Strong move if prop-driven; no Encounter route/context assumptions.

**Explicitly out of scope for 3A**

- Grid, drawers, routes, setup modals, `EncounterRuntimeContext`.
- Ally/Opponent active preview cards, major hook extraction, broad UX redesign.
- Introducing a new generic `helpers` dump under `combat` — use explicit `components` / `presentation` names.

**Suggested execution order**

1. Create `src/features/combat/components` and `presentation` (and optional empty `hooks`).
2. Audit the four candidates for Encounter-only dependencies.
3. Move the cleanest first: `CombatantAvatar`, then `CombatantPreviewCard`.
4. Move `combatant-badges`, then `CombatActionPreviewCard`.
5. Update imports in Encounter consumers; add temporary Encounter re-exports only if worthwhile.
6. Run verification; fix stragglers.

**Verification**

- `rg 'features/encounter' src/features/combat` → empty.
- Moved components are **owned** under `features/combat`, not Encounter.
- No new generic `helpers` destination under combat.
- Full typecheck; targeted tests for moved files if present, then full suite; move/update co-located tests/stories with components where practical.

**Definition of done**

- `src/features/combat/components` exists; selected primitives live under combat ownership; Encounter imports from combat paths; boundary grep clean; typecheck and tests pass; no grid/drawer/setup/route work was pulled into the pass.

**If you hit coupling:** Do not force the move — split leaf vs wrapper, or leave in Encounter and document the blocker briefly.

---

### Pass 3B — Client `combat/presentation` (Encounter helpers)

**Why isolate:** Moves **client-only** formatting/chips/tooltips out of Encounter without mixing them into `**mechanics/domain/combat`** (Phase 2 owns pure derivation).

**In scope**

- Relocate from `[helpers/presentation/](../../src/features/encounter/helpers/presentation/)`:
  - `[build-combatant-preview-chips.ts](../../src/features/encounter/helpers/presentation/build-combatant-preview-chips.ts)`
  - `[combatant-card-tooltips.ts](../../src/features/encounter/helpers/presentation/combatant-card-tooltips.ts)`
  - `[combatant-modal-stats.ts](../../src/features/encounter/helpers/presentation/combatant-modal-stats.ts)`
  - `[helpers/presentation/index.ts](../../src/features/encounter/helpers/presentation/index.ts)` — slim to re-exports/shims or delete after call sites move.
- Keep `[format-turn-duration.ts](../../src/features/encounter/helpers/presentation/format-turn-duration.ts)` as shim re-exporting engine (already Phase 2) unless you consolidate imports to engine only.

**Out of scope**

- Engine modules under `mechanics/domain/combat/presentation` (do not duplicate pure derivation here).

---

### Pass 3C — Action row: primitive + Encounter wrapper

**Why isolate:** `[ActionRow.tsx](../../src/features/encounter/components/active/action-row/ActionRow.tsx)` couples **router/campaign** concerns (`useParams`, `ROUTES`) to presentation; splitting avoids dragging routing into `features/combat`.

**In scope**

- Move `[ActionRowBase.tsx](../../src/features/encounter/components/active/action-row/ActionRowBase.tsx)` → e.g. `combat/components/action-row/ActionRowBase.tsx` (or `CombatActionRowBase`).
- Refactor Encounter-owned row:
  - Either keep `ActionRow` in Encounter and import base from combat, **or**
  - Add `CombatActionRow` in combat that accepts optional `footerHref` / `footerLabel` / `footerOpenInNewTab`; Encounter computes href from `campaignId`.

**Out of scope**

- `[CasterOptionsFields.tsx](../../src/features/encounter/components/active/action-row/CasterOptionsFields.tsx)` until audited (may depend on drawer state shape)—schedule Pass 3E or defer.

---

### Pass 3D — Grid: `CombatGrid` + thin `EncounterGrid` wrapper (milestone)

**Goal:** Extract the reusable grid renderer into `[CombatGrid.tsx](../../src/features/combat/components/grid/CombatGrid.tsx)`; keep `[EncounterGrid.tsx](../../src/features/encounter/components/active/grid/EncounterGrid.tsx)` as an Encounter-owned **thin wrapper/adapter**. This is the centerpiece UI extraction pass for Phase 3.

**Why isolate:** Highest architectural value **and** highest regression risk **and** highest chance of leaking Encounter state shape into reusable UI—keep the pass **PR-sized**, narrowly reviewed, and renderer-boundary–focused.

**Required audit before extraction** (do not copy-paste the whole file into combat):

1. Pure rendering logic vs view-model / visual-state plumbing vs Encounter-specific adaptation vs orchestration that stays outside the renderer.
2. Use that split to decide what lands in `CombatGrid`, grid-local helpers, vs remaining `EncounterGrid`.

**In scope**

- Extract reusable rendering from `[EncounterGrid.tsx](../../src/features/encounter/components/active/grid/EncounterGrid.tsx)` → `[CombatGrid.tsx](../../src/features/combat/components/grid/CombatGrid.tsx)`.
- Move with the grid layer (generic renderer concerns):
  - `[cellVisualState.ts](../../src/features/encounter/components/active/grid/cellVisualState.ts)`
  - `[cellVisualStyles.ts](../../src/features/encounter/components/active/grid/cellVisualStyles.ts)`
  - `[cellVisualState.test.ts](../../src/features/encounter/components/active/grid/cellVisualState.test.ts)`
- `[EncounterGrid.tsx](../../src/features/encounter/components/active/grid/EncounterGrid.tsx)` ends as **thin adapter** only: maps Encounter props/state into the combat grid contract, wires callbacks, preserves outer API where practical to minimize parent churn—not the primary renderer.

`**CombatGrid` should own (renderer-first)**  
Rendering from a prepared grid VM (or normalized contract), cell visual state/styles, token/cell/obstacle display, click/hover callbacks, selection/highlight **visuals**, `renderTokenPopover` (injectable, no Encounter imports).

`**EncounterGrid` should own (adaptation)**  
Adapting feature props into `CombatGrid` props, wiring Encounter-specific callbacks, connecting feature-level selection/target state, minimal compatibility shims—**not** route/layout migration, not `EncounterRuntimeContext` migration here.

**Explicitly out of scope for 3D**

- `[EncounterActiveSidebar.tsx](../../src/features/encounter/components/active/grid/EncounterActiveSidebar.tsx)` — **do not move or refactor** (composition chrome).
- Route/layout changes, drawer orchestration, setup workflow, `EncounterRuntimeContext` migration, broader action/selection redesign, non-grid modals/panels.

**Hard rules**

- `src/features/combat/components/grid/`** must **not** import `src/features/encounter/`** (no context, hooks, routes, setup types, feature wrappers). Split the adapter in Encounter if the current grid imports Encounter.
- **Avoid prop explosion:** do not dump Encounter internals into `CombatGrid`—prefer focused contract + thin wrapper over a “reusable” component with an enormous Encounter-shaped surface.
- **Behavior stable:** preserve user-visible behavior unless required for a clean extraction.
- First-extraction `CombatGrid` does **not** need to be globally perfect—only Encounter-independent, plausibly reusable, cleanly separated from workflow.

**Suggested execution order**

1. Audit `EncounterGrid.tsx` (renderer vs adaptation).
2. Add `CombatGrid.tsx` under `combat/components/grid/`.
3. Move `cellVisual*` + test alongside.
4. Refactor `EncounterGrid` to consume `CombatGrid`.
5. Preserve outer API where practical; update imports/tests.
6. `rg 'features/encounter' src/features/combat/components/grid` → empty.
7. Run targeted grid / `cellVisualState` tests, then full suite.

**Verification**

- **Architectural:** Could `CombatGrid` render on another combat-oriented screen **without** Encounter route/context? If not, boundary is still too Encounter-shaped.
- **If unexpected coupling:** Do not force extraction—extract clearly reusable core first; keep more adaptation in `EncounterGrid`; note what blocked a thinner wrapper.

Details: **§3** below.

---

### Pass 3E — Drawer **panels** only (optional second slice for shells)

**Why isolate:** `[CombatantActionDrawer.tsx](../../src/features/encounter/components/active/drawers/CombatantActionDrawer.tsx)` is large and ties to setup types; extracting **panels** without moving the shell limits blast radius.

**In scope (audit each file before moving)**

- Under `[drawer-modes/](../../src/features/encounter/components/active/drawers/drawer-modes/)`: `AoePlacementPanel`, `CasterOptionsDrawerPanel`, `SingleCellPlacementPanel`, `aoePlacementFormat.ts` — **only if** imports are mechanics/UI/primitives, not `SelectEncounter*` modals.
- `[drawers/helpers/derive-action-unavailable-hint.ts](../../src/features/encounter/components/active/drawers/helpers/derive-action-unavailable-hint.ts)` — move if pure and engine-facing only.

**Explicitly out of scope (default)**

- `[CombatantActionDrawer.tsx](../../src/features/encounter/components/active/drawers/CombatantActionDrawer.tsx)`, `[AllyActionDrawer.tsx](../../src/features/encounter/components/active/drawers/AllyActionDrawer.tsx)`, `[OpponentActionDrawer.tsx](../../src/features/encounter/components/active/drawers/OpponentActionDrawer.tsx)`, `[AttachedEmanationSetupPanel.tsx](../../src/features/encounter/components/active/drawers/AttachedEmanationSetupPanel.tsx)` — orchestration / setup coupling unless proven otherwise.

---

### Pass 3F — Combat log display + optional hooks

**Why isolate:** Log UI is separable from grid; can ship after grid if needed.

**In scope**

- Candidates: `[PresentableEffectsList.tsx](../../src/features/encounter/components/active/combat-log/PresentableEffectsList.tsx)`, `[CombatLogEntry.tsx](../../src/features/encounter/components/active/combat-log/CombatLogEntry.tsx)` → `combat/components/combat-log/` if prop-driven.
- Keep `[CombatLogPanel.tsx](../../src/features/encounter/components/active/combat-log/CombatLogPanel.tsx)`, `[CombatLogModal.tsx](../../src/features/encounter/components/active/combat-log/CombatLogModal.tsx)` in Encounter as shells unless they are thin enough to split.

**Hooks (defer by default)**

- `[useEncounterState.ts](../../src/features/encounter/hooks/useEncounterState.ts)`, `[useEncounterRoster.ts](../../src/features/encounter/hooks/useEncounterRoster.ts)`, `[useEncounterOptions.ts](../../src/features/encounter/hooks/useEncounterOptions.ts)` stay Encounter-owned.
- Extract a `combat` hook **only** if you identify a pure “view model from props/state” slice with zero Encounter imports (optional Pass 3G).

---

## 2. File classification

Legend: **move** | **split** | **keep** | **defer**

### `components/shared`


| File                                                                                                              | Classification | Notes                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `[CombatantAvatar.tsx](../../src/features/encounter/components/shared/CombatantAvatar.tsx)`                       | **move**       | Prop-driven avatar.                                                                                                                                                                                                |
| `[cards/CombatantPreviewCard.tsx](../../src/features/encounter/components/shared/cards/CombatantPreviewCard.tsx)` | **move**       | Generic card chrome.                                                                                                                                                                                               |
| `[cards/combatant-badges.tsx](../../src/features/encounter/components/shared/cards/combatant-badges.tsx)`         | **move**       | Badge rows; depends on mechanics/domain types + encounter domain types for labels—ensure combat imports `mechanics` + `encounter/domain` barrel only if allowed; prefer `mechanics` + `combat` presentation types. |
| `[modals/EncounterEditModal.tsx](../../src/features/encounter/components/shared/modals/EncounterEditModal.tsx)`   | **keep**       | Feature modal.                                                                                                                                                                                                     |
| `[layout/EncounterView.tsx](../../src/features/encounter/components/shared/layout/EncounterView.tsx)`             | **keep**       | Layout shell.                                                                                                                                                                                                      |


### `components/active` (selected)


| File                                                                                                                                                                            | Classification                           | Notes                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `grid/EncounterGrid.tsx`                                                                                                                                                        | **split**                                | Body → `CombatGrid`; wrapper stays Encounter.                                                                              |
| `grid/cellVisualState.ts`, `cellVisualStyles.ts`, `cellVisualState.test.ts`                                                                                                     | **move** (with CombatGrid)               | Pure view helpers tied to grid VM.                                                                                         |
| `grid/EncounterActiveSidebar.tsx`                                                                                                                                               | **keep**                                 | Sidebar composition.                                                                                                       |
| `action-row/ActionRowBase.tsx`                                                                                                                                                  | **move**                                 |                                                                                                                            |
| `action-row/ActionRow.tsx`                                                                                                                                                      | **split**                                | Routing/footer links stay Encounter-side.                                                                                  |
| `action-row/CasterOptionsFields.tsx`                                                                                                                                            | **defer** / **audit**                    | May move in Pass 3E if generic.                                                                                            |
| `cards/CombatActionPreviewCard.tsx`                                                                                                                                             | **move**                                 |                                                                                                                            |
| `cards/AllyCombatantActivePreviewCard.tsx`                                                                                                                                      | **keep** or **split**                    | Uses `useCharacter` + encounter helpers—do not move whole file to combat. Future: generic card + Encounter data providers. |
| `cards/OpponentCombatantActivePreviewCard.tsx`                                                                                                                                  | **keep** or **split**                    | Same pattern without `useCharacter`; could converge with Ally via shared base later (**defer**).                           |
| `drawers/CombatantActionDrawer.tsx`                                                                                                                                             | **keep**                                 | Orchestration shell.                                                                                                       |
| `drawers/AllyActionDrawer.tsx`, `OpponentActionDrawer.tsx`                                                                                                                      | **keep**                                 |                                                                                                                            |
| `drawers/drawer-modes/*`                                                                                                                                                        | **audit** → move panels **or** **defer** | Per-file import check.                                                                                                     |
| `drawers/AttachedEmanationSetupPanel.tsx`                                                                                                                                       | **keep**                                 | Name suggests setup coupling.                                                                                              |
| `combat-log/PresentableEffectsList.tsx`, `CombatLogEntry.tsx`                                                                                                                   | **move** (if clean)                      |                                                                                                                            |
| `combat-log/CombatLogPanel.tsx`, `CombatLogModal.tsx`                                                                                                                           | **keep**                                 | Shells.                                                                                                                    |
| `layout/EncounterActiveHeader.tsx`, `EncounterActiveFooter.tsx`, `EncounterActiveCombatantIdentity.tsx`, `EncounterEnvironmentSummary.tsx`, `EncounterPresentationPovField.tsx` | **keep**                                 | Feature layout / POV / env.                                                                                                |
| `modals/CombatTargetSelectModal.tsx`, `CombatTurnOrderModal.tsx`, `EncounterGameOverModal.tsx`, `TurnOrderList.tsx`                                                             | **keep**                                 | Workflow / feature modals.                                                                                                 |


### `helpers/presentation`


| File                               | Classification                            | Notes                         |
| ---------------------------------- | ----------------------------------------- | ----------------------------- |
| `build-combatant-preview-chips.ts` | **move** → `features/combat/presentation` |                               |
| `combatant-card-tooltips.ts`       | **move**                                  |                               |
| `combatant-modal-stats.ts`         | **move**                                  |                               |
| `format-turn-duration.ts`          | **keep** shim                             | Re-export from engine.        |
| `index.ts`                         | **split**                                 | Re-export from new locations. |


### `hooks`


| File                           | Classification | Notes                                   |
| ------------------------------ | -------------- | --------------------------------------- |
| `useEncounterState.ts`         | **keep**       | Feature state.                          |
| `useEncounterRoster.ts`        | **keep**       |                                         |
| `useEncounterOptions.ts`       | **keep**       |                                         |
| New hooks under `combat/hooks` | **defer**      | Only if a clear reusable slice appears. |


---

## 3. Grid extraction plan

### Files that move with reusable grid

- `[EncounterGrid.tsx](../../src/features/encounter/components/active/grid/EncounterGrid.tsx)` — **implementation** becomes `[CombatGrid.tsx](../../src/features/combat/components/grid/CombatGrid.tsx)` (new).
- `[cellVisualState.ts](../../src/features/encounter/components/active/grid/cellVisualState.ts)`
- `[cellVisualStyles.ts](../../src/features/encounter/components/active/grid/cellVisualStyles.ts)`
- `[cellVisualState.test.ts](../../src/features/encounter/components/active/grid/cellVisualState.test.ts)`

### Encounter-owned wrapper

- `[EncounterGrid.tsx](../../src/features/encounter/components/active/grid/EncounterGrid.tsx)` remains the **default import** for the app: re-export `CombatGrid` or wrap with identical props so parents do not churn in the same pass.

### Prop boundary (current contract to preserve)

`EncounterGrid` today is already largely data-driven. The extracted `CombatGrid` should keep a **focused** contract aligned with existing props (from the current file):

- `grid: GridViewModel` (from `mechanics/domain/combat/space` selectors)
- `zoom`, `pan`, `panPointerHandlers`, `isDragging`, `hasDragMoved`
- `onCellClick`, `onCellHover`
- `renderTokenPopover?: (occupantId: string) => ReactNode` (keeps token UI injectable without importing Encounter)
- `hoveredCellId`, `movementHighlightActive`, `hasMovementRemaining`, `creatureTargetingActive`, `singleCellPlacementPickActive`, `objectAnchorPickActive`

Avoid adding a dozen new props in the first extraction; prefer the **same** surface as today.

### Must NOT appear inside `CombatGrid`

- Imports from `@/features/encounter/*` (any)
- `EncounterRuntimeContext`, encounter routes, setup modals
- Feature hooks (`useEncounterState`, etc.)

Allowed: `mechanics/domain/combat` (VM types), MUI, shared UI primitives, `combat/presentation` if needed for purely visual tokens.

---

## 4. Action drawer / action-row plan

### Row / panel primitives worth extracting

- `**ActionRowBase`** → combat (pure layout: name, badges, second line, footer link props).
- **Optional `CombatActionRow`**: same as today’s `ActionRow` minus `useParams`; parent passes `footerHref` / labels so **combat** stays router-free.
- **Caster options UI** (`CasterOptionsFields`) — extract only after confirming props do not assume Encounter drawer closure state.

### Drawer shells that stay Encounter-owned

- `CombatantActionDrawer`, `AllyActionDrawer`, `OpponentActionDrawer` — **do not move wholesale** (orchestration, selection, resolution wiring).

### Panel candidates (extract only after import audit)

- `AoePlacementPanel`, `CasterOptionsDrawerPanel`, `SingleCellPlacementPanel` — candidate **move** if they only need mechanics types + callbacks + MUI.

### Blockers (typical)

- Types from `[SelectEncounterCombatantModal](../../src/features/encounter/components/setup/modals/SelectEncounterCombatantModal.tsx)` (`CombatantOption`, etc.) inside a panel → **keep panel in Encounter** or introduce a **neutral DTO** in mechanics/combat types (out of scope unless necessary).
- Any `useParams` / campaign navigation inside a panel → **keep in Encounter** or pass `href`/`onNavigate` props from parent.

---

## 5. Risk list


| Risk                                                                  | Mitigation                                                                                                                        |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Prop explosion** on `CombatGrid` / shared cards                     | Keep first extraction **API-compatible** with current components; add props only when splitting real concerns (e.g. footer href). |
| **Fake reusable** components that still need Encounter state shape    | `CombatGrid` must only depend on `GridViewModel` + callbacks; grep `encounter` under `features/combat` after each pass.           |
| **Moving wrappers** (e.g. entire `CombatantActionDrawer`)             | Default **keep shells**; extract **leaf** panels/rows only.                                                                       |
| **Feature hooks inside combat** (`useCharacter`, `useEncounterState`) | Ally card is a prime example—keep data loading in Encounter; pass derived props into combat components.                           |
| **Accidental `encounter` imports in `features/combat`**               | CI-style grep in PR checklist: `rg 'features/encounter' src/features/combat`.                                                     |
| **Barrel cycles**                                                     | Prefer **folder-level** or **narrow** exports from `combat`; avoid one mega-barrel importing everything.                          |


---

## 6. Recommended execution order

1. **Pass 3A** — Scaffold `components` / `presentation` (empty hooks unless necessary) + move avatar, preview card, badges, `CombatActionPreviewCard` per §1 Pass 3A.
2. **Pass 3B** — `combat/presentation` from `helpers/presentation` (chips/tooltips/modal stats).
3. **Pass 3C** — Action row base + Encounter `ActionRow` wrapper / footer props.
4. **Pass 3D** — Grid: audit → `CombatGrid` + move `cellVisual`* + tests + thin `EncounterGrid` adapter (see §1 Pass 3D, §3).
5. **Pass 3E** — Drawer panels (file-by-file audit); skip anything with setup-modal imports.
6. **Pass 3F** — Combat log list/entry components; optional hook extraction **defer**.

This order maximizes **learning** on cheap moves before grid, and keeps **merge risk** contained per pass.

---

## Suggested handoff: one prompt per pass

Each pass can be a separate PR with: (1) file list, (2) forbidden-import grep, (3) test plan, (4) explicit “out of scope” bullet.