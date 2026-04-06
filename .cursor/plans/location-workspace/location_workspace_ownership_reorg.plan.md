---
name: Location workspace ownership reorg
overview: Ownership-based subtrees under components/workspace (header, setup, canvas, leftTools, rightRail), subtree __tests__, LocationGridAuthoringSection under workspace/ as orchestrator—not canvas—authoring/draft + authoring/geometry for helpers, mapGrid/ with authoring/ + __tests__ (no mapAuthoring name), no components/mapEditor barrel; incremental migration guidance.
todos:
  - id: subtree-boundaries
    content: Document and adopt workspace/header, setup, canvas, leftTools, rightRail boundaries; keep LocationGridAuthoringSection at workspace root
    status: completed
  - id: subtree-tests
    content: Co-locate subtree-owned tests under __tests__ per subtree (e.g. rightRail/__tests__)
    status: completed
  - id: phased-moves
    content: Execute subtree moves in phases (ownership first, renames later); preserve barrel exports at each step
    status: completed
  - id: readme-plan-bundle
    content: Update .cursor/plans/location-workspace/README.md — link the ownership reorg plan, short subtree summary, reading order
    status: completed
  - id: phase2-refinement
    content: Subtree barrels (leftTools paint/draw, rightRail types/adapters/selection), cell panel + linked modal placement, mapEditor compatibility comment
    status: completed
  - id: phase3-feature-root
    content: authoring/draft + authoring/geometry; LocationGridAuthoringSection under workspace/; remove components/mapEditor barrel (inline in components/index.ts)
    status: completed
  - id: phase4-mapgrid-layout
    content: mapGrid/mapAuthoring → mapGrid/authoring; mapGridCellVisualState.test → __tests__; document target tree
    status: completed
isProject: false
---

# Location workspace: ownership-based structure (refined plan)

This document refines the location editor workspace **folder and responsibility model**. It complements (does not replace) implementation work on **left-map overlay chrome** (toolbar + trays), **unified tray width**, and **domain layout tokens** described elsewhere; those concerns should land first or in parallel **without** depending on every file move below.

## Problem

Under `components/workspace/` and nearby, several concerns are flattened together:

- Top-level workspace shells (`LocationEditorWorkspace`, homebrew/system patch variants)
- Header-owned UI vs free-floating peers
- Left-side map tools (toolbar, trays)
- Right-rail shell, tabs, rail-only panels, selection inspectors
- Canvas/map column presentation (pan/zoom shell)
- Create/setup flow
- Rail-local adapters, types, and tests mixed with shell code

That makes ownership and import direction hard to track and encourages misleading moves (e.g. treating orchestration as “canvas”).

## Objectives

- Reflect **containment and role** in folder structure, not implementation history.
- Reduce scan noise with `**__tests__/`** inside subtrees where tests are owned by that subtree.
- Add `**setup/`** only when create/setup is a real, distinct concern with likely siblings—not a one-off rename for its own sake.
- Keep `**LocationGridAuthoringSection**` at the **correct ownership level** (workspace-level orchestrator, **not** a `canvas/` leaf).
- Avoid a **single giant rename-and-move PR**; prefer **incremental phases** with stable public exports.

---

## Documentation in scope

When this reorg (or a milestone phase) lands, update `**[.cursor/plans/location-workspace/README.md](README.md)`** so the plan bundle stays navigable:

- Add a row or subsection for `**[location_workspace_ownership_reorg.plan.md](location_workspace_ownership_reorg.plan.md)`** (ownership subtrees, `LocationGridAuthoringSection` placement, phased moves).
- Optionally add a **one-paragraph** summary of `header/` · `setup/` · `canvas/` · `leftTools/` · `rightRail/` for onboarding.
- Adjust **reading order** if this plan should be read before/after specific foundation or interaction plans.

Do **not** treat `[docs/reference/location-workspace.md](../../../docs/reference/location-workspace.md)` as a substitute: the README is the **index for Cursor plan files**; the reference doc is runtime behavior for contributors—update the reference doc only when folder paths or contributor guidance there need to stay in sync (separate decision per change).

---

## 1. Prefer ownership-based subtrees inside `workspace/`

Bias toward these subtrees under `[src/features/content/locations/components/workspace/](src/features/content/locations/components/workspace/)`:


| Subtree          | Owns                                                                                                                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `**header/`**    | Header component and **header-contained** children (e.g. ancestry breadcrumbs), plus `index.ts` barrel.                                                                             |
| `**setup/`**     | Create/setup flow UI when that concern is distinct and likely to gain siblings (see §3).                                                                                            |
| `**canvas/`**    | **Presentation shells** for the map column: pan/zoom container, map column layout—**not** full authoring orchestration.                                                             |
| `**leftTools/`** | Left-side map **tool** UI: toolbar, tray shell, paint tray, draw tray, paint-specific small pieces. Concrete name `**leftTools`** (or equivalent) avoids vague names like `chrome`. |
| `**rightRail/`** | Right rail shell, tabs, rail-only panels, selection inspectors, rail-local adapters/types, rail-local `__tests__`.                                                                  |


**Orchestration boundaries:** Route-level and workspace-level **composition** (what appears in the map column vs rail vs header) stays in `**LocationEditHomebrewWorkspace`**, `**LocationEditSystemPatchWorkspace`**, and `**LocationEditRoute**` until a deliberate split. Subtrees own **UI and local wiring**, not the whole app story.

---

## 2. `__tests__` for subtree-owned tests

- Prefer `**workspace/rightRail/__tests__/`** (and similarly for other subtrees) for tests that exist **only** to validate that subtree’s components or adapters.
- **Do not** blindly move tests for pure domain/helpers if colocated `*.test.ts` next to the module remains clearer.
- Goal: **less noise** in the main file list for each subtree, not a new rule that harms discoverability for domain tests.

---

## 3. `setup/` subtree: explicit evaluation

- **Candidate:** `[LocationCreateSetupFormDialog.tsx](src/features/content/locations/components/workspace/LocationCreateSetupFormDialog.tsx)` — if it represents **create/setup** as a product concern distinct from “general workspace shell.”
- **Treat as a real subtree** if you expect near-term siblings (e.g. additional setup steps, templates, import flows).
- If it remains a **single dialog** with no planned siblings, **defer** moving it or move only when a second setup file appears—avoid make-work churn.

---

## 4. `LocationGridAuthoringSection`: workspace-level orchestrator (not `canvas/`)

**Do not move `LocationGridAuthoringSection` into `workspace/canvas/`** unless a future audit shows its responsibility has **shrunk** to pure presentation.

### Why it is not a canvas leaf

From its current role in `[LocationGridAuthoringSection.tsx](src/features/content/locations/components/workspace/LocationGridAuthoringSection.tsx)`, it behaves as a **workspace authoring section / bridge**:

- **Grid dimensions and geometry** drive layout and editors.
- `**draft` / `setDraft`** couple UI to persisted grid state.
- **Host location / campaign context** flows through for authoring behavior.
- **Editor modes** (select, paint, place, draw, erase) change interaction and overlays.
- **Placement / erase / edge callbacks** route user actions into domain updates.
- `**onCellFocusRail`** mediates **right-rail focus**.
- `**leftChromeWidthPx`** couples to **workspace chrome layout** and grid sizing.

That is **orchestration and cross-cutting wiring**, not merely “draw the grid inside a canvas.”

### Placement guidance

- **Now:** Keep `**LocationGridAuthoringSection.tsx` directly under `workspace/`** (or under a future `workspace/authoring/` **only if** multiple orchestration peers appear and justify a subtree).
- `**workspace/canvas/`** stays reserved for **shell/presentation**: e.g. `[LocationEditorCanvas](src/features/content/locations/components/workspace/LocationEditorCanvas.tsx)`, `[LocationEditorMapCanvasColumn](src/features/content/locations/components/workspace/LocationEditorMapCanvasColumn.tsx)`.

Document in code review / ADR if needed: **authoring orchestration stays out of `canvas/`** to preserve orchestration vs presentation boundaries.

---

## 5. `leftTools/` vs vague alternatives

- `**leftTools**` names **what the user sees**: tools anchored to the left of the map.
- Avoid `**chrome`**—it obscures whether something is toolbar, tray, browser chrome, or theme.
- This subtree owns **toolbar + tray shell + paint/draw trays** and small **left-tool-only** fragments (e.g. paint-related controls that are not right-rail panels).

---

## 6. `rightRail/` absorbs rail-local concerns

Consolidate under `**rightRail/`** so workspace root does not mix **shell** with **rail internals**:

- Rail shell: `LocationEditorRightRail`
- Tabs: `LocationEditorRailSectionTabs`
- Rail-only **panels** (map authoring panels, selection, etc.) under e.g. `rightRail/panels/` or `rightRail/selection/` as volume grows
- **Selection inspectors** and rail-heavy UI: `rightRail/selection/` (or similar)
- **Rail-local adapters** (e.g. region metadata draft adapter): `rightRail/adapters/`
- **Rail-local types** (e.g. rail section types): `rightRail/types/`
- `**__tests__/`** for rail-scoped tests

**Linked location modal:** If it is primarily a **rail/map authoring** concern, it can live under `rightRail/linkedLocation/` or `mapEditor/` with a clear rule—prefer **one home** and re-export from `components/index.ts` during migration.

---

## 7. Recommended target tree (guidance, not mandatory one-shot)

Conceptual target under `components/workspace/` (files listed are **examples**; not every file must move in one pass):

```text
workspace/
├── LocationEditorWorkspace.tsx
├── LocationEditHomebrewWorkspace.tsx
├── LocationEditSystemPatchWorkspace.tsx
├── LocationGridAuthoringSection.tsx      # workspace-level authoring orchestrator — NOT under canvas/
├── BuildingFloorStrip.tsx                # or floor/ if volume grows
├── header/
│   ├── LocationEditorHeader.tsx
│   ├── LocationAncestryBreadcrumbs.tsx
│   └── index.ts
├── setup/                                 # if/when setup is a real subtree (see §3)
│   ├── LocationCreateSetupFormDialog.tsx
│   └── index.ts
├── canvas/
│   ├── LocationEditorCanvas.tsx
│   ├── LocationEditorMapCanvasColumn.tsx
│   └── index.ts
├── leftTools/
│   ├── LocationMapEditorToolbar.tsx
│   ├── LocationMapEditorToolTrayShell.tsx
│   ├── paint/
│   │   ├── LocationMapEditorPaintTray.tsx
│   │   ├── RegionPaintActiveRegionSelect.tsx
│   │   └── index.ts
│   ├── draw/
│   │   ├── LocationMapEditorDrawTray.tsx
│   │   └── index.ts
│   └── index.ts
├── rightRail/
│   ├── LocationEditorRightRail.tsx
│   ├── LocationEditorRailSectionTabs.tsx
│   ├── panels/
│   ├── selection/
│   ├── linkedLocation/                    # optional, if ownership is clearly rail-adjacent
│   ├── adapters/
│   ├── types/
│   ├── __tests__/
│   └── index.ts
└── index.ts
```

**Outside `workspace/` (explicitly allowed to stay peer for now):**

- `[components/mapGrid/](src/features/content/locations/components/mapGrid/)`, `[LocationMapCellAuthoringOverlay](src/features/content/locations/components/mapGrid/)`, etc.—**grid rendering and SVG layers** can remain a separate subtree until a later consolidation, to **avoid obscuring orchestration boundaries** with a premature dump into `canvas/`.

**Domain layout tokens** (header height, rail width, toolbar/tray widths) remain in `**domain/mapPresentation/`** (or a sibling domain module), not under `workspace/`, to keep **pure numbers** out of component trees.

---

## 8. Phased move order (incremental, reviewable)

1. **Subtree ownership first:** Introduce `header/`, `canvas/`, `leftTools/`, `rightRail/` folders and move **clear** files with **barrel `index.ts` + re-exports** from old paths if needed.
2. **Rail internals:** Move rail-only panels, selection, adapters, types into `rightRail/`; add `rightRail/__tests__/`.
3. **Left tools:** Move toolbar + trays + tray shell into `leftTools/` with optional `paint/` and `draw/` subfolders once stable.
4. `**setup/`:** Add when the second setup sibling appears or product confirms a setup product line.
5. **Shorten or rename symbols later** once paths stabilize (avoid renaming *and* moving in the same step when avoidable).
6. **Plan bundle README:** Update `[.cursor/plans/location-workspace/README.md](README.md)` in the same milestone as an agreed phase (or when the plan is “active”), so the new structure is discoverable from the bundle index.

---

## 9. Acceptance criteria (this refinement)

- The plan **does not** imply `LocationGridAuthoringSection` belongs under `canvas/`.
- `**__tests__/`** is the preferred home for **subtree-owned** component/adapter tests.
- `**setup/`** is **evaluated** explicitly (real subtree vs defer).
- Target structure reflects **ownership/containment** better than today’s flat mix.
- Plan stays **incremental**: no requirement for a single mega-PR that moves every file.
- `**[.cursor/plans/location-workspace/README.md](README.md)`** lists this plan and stays aligned with subtree ownership guidance for contributors browsing the bundle.

---

## 10. Short rationale summary


| Topic                                                 | Rationale                                                                                                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `**LocationGridAuthoringSection` at workspace level** | It orchestrates modes, draft, host context, callbacks, rail focus, and left chrome coupling—workspace authoring bridge, not a canvas presentation leaf. |
| `**leftTools/` over `chrome/`**                       | Names the user-facing responsibility (tools on the left); avoids ambiguous “chrome.”                                                                    |
| `**rightRail/` for types/adapters/tests**             | Keeps rail-specific glue and verification next to rail UI; separates shell from rail internals.                                                         |
| `**canvas/` narrow scope**                            | Only map column **shells** (pan/zoom, column layout); prevents orchestration from disappearing into a “canvas” catch-all.                               |


---

## 11. Phase 2 refinement (post–first ownership pass)

After `header/`, `canvas/`, `leftTools/`, `rightRail/`, and `setup/` landed, a second pass tightens transitional rough edges **without** a giant rename churn.

### Objectives

- Complete **subtree barrels** where the folder already implies a coherent group (`leftTools/paint`, `leftTools/draw`, `rightRail/types`, `rightRail/adapters`, `rightRail/selection`).
- Resolve **straggler ownership**: rail-only UI moves under `rightRail/`; **orchestrators stay at workspace root** (`LocationGridAuthoringSection` remains next to edit shells—not under `canvas/`).
- Clarify `**rightRail` internal grouping**: `panels/` = mode/tool + cell inspector; `selection/` = selection-driven UI; `linkedLocation/` = linked-location placement modal (distinct from generic map mode panels).
- ~~Make `**components/mapEditor/index.ts` intentional~~** **Superseded (phase 3):** removed the folder; `**components/index.ts`** re-exports toolbar and rail UI directly from `workspace/leftTools` and `workspace/rightRail/...`.

### Recommendations (implemented)


| Item                                           | Decision                                                                | Rationale                                                                                                                                                                        |
| ---------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `**LocationCellAuthoringPanel.tsx**`           | Move to `**rightRail/panels/**`                                         | Used only from the Selection rail (`LocationEditorSelectionPanel`); rail-owned inspector UI, not a shared cross-feature primitive.                                               |
| `**LocationMapEditorLinkedLocationModal.tsx**` | Move to `**rightRail/linkedLocation/**`                                 | Modal for place-mode linked-location picking; separate from paint/draw/place **panels**; keeps `panels/` for consistent “Map rail tool UI” and isolates modal flow.              |
| `**LocationGridAuthoringSection.tsx`**         | **Moved** to `**workspace/LocationGridAuthoringSection.tsx`** (phase 3) | Still a workspace-level authoring orchestrator (draft, modes, callbacks, `leftChromeWidthPx`); **not** under `canvas/`. Co-locates the orchestrator with other workspace shells. |
| `**mapEditor/index.ts`**                       | **Removed** (phase 3)                                                   | Compatibility-only barrel added little value; `**components/index.ts`** inlines re-exports from `workspace/leftTools` and `workspace/rightRail/...`.                             |


### Target structure (phase 2 → phase 3)

```text
components/
├── authoring/
│   ├── draft/                                 # locationGridDraft.types + .utils (+ tests)
│   ├── geometry/                              # hex/square overlay geometry, path overlay, region boundaries (+ tests)
│   └── index.ts                               # re-exports draft types + utils only
├── mapGrid/                                   # grid implementation — see §13
├── workspace/
│   ├── LocationGridAuthoringSection.tsx        # workspace-level orchestrator (phase 3: moved here from components root)
│   ├── LocationEditHomebrewWorkspace.tsx
│   ├── LocationEditSystemPatchWorkspace.tsx
│   ├── LocationEditorWorkspace.tsx
│   ├── BuildingFloorStrip.tsx
│   ├── header/
│   ├── setup/
│   ├── canvas/
│   ├── leftTools/
│   │   ├── paint/index.ts
│   │   ├── draw/index.ts
│   │   └── index.ts
│   └── rightRail/
│       ├── types/index.ts
│       ├── adapters/index.ts
│       ├── selection/index.ts
│       ├── panels/                           # mode panels + cell inspector
│       ├── linkedLocation/                   # linked-location modal
│       ├── __tests__/
│       └── index.ts
```

### Acceptance (phase 2)

- Fewer top-level stragglers; obvious subtree barrels added.
- `rightRail` grouping: panels vs selection vs linkedLocation vs types/adapters is explicit.
- `LocationGridAuthoringSection` remains a **workspace-level** orchestrator (not under `canvas/`).

---

## 12. Phase 3: feature root tightening (authoring helpers + workspace orchestrator)

**Goal:** Reduce noise at `components/` root by grouping **grid-draft** and **geometry/path** helpers under `**authoring/`**, moving `**LocationGridAuthoringSection**` next to other workspace shells, and **removing** the transitional `**components/mapEditor/`** barrel.

### Decisions


| Topic                              | Decision                                                                                                                                                                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rail cell panel**                | `LocationCellAuthoringPanel` stays under `**workspace/rightRail/panels/`** (rail-owned; not a feature-root stray).                                                                                                                                      |
| `**authoring/draft/**`             | Home for `**locationGridDraft.types.ts**`, `**locationGridDraft.utils.ts**`, and `**locationGridDraft.utils.test.ts**`.                                                                                                                                 |
| `**authoring/geometry/**`          | Home for `**hexGridMapOverlayGeometry**`, `**squareGridMapOverlayGeometry**`, `**pathOverlayRendering**`, `**hexRegionBoundaryForAuthoring**`, `**hexRegionBoundarySegments**`; tests under `**authoring/geometry/__tests__/**`.                        |
| `**LocationGridAuthoringSection**` | `**workspace/LocationGridAuthoringSection.tsx**` — still the workspace-level authoring orchestrator / bridge; **not** under `canvas/`; co-location with `LocationEditorWorkspace` and peers clarifies ownership without implying a narrow canvas child. |
| `**components/mapEditor/`**        | **Removed (option B).** Re-exports inlined into `**components/index.ts`** from `workspace/leftTools` and `workspace/rightRail/...`.                                                                                                                     |
| **Scope**                          | No broad filename shortening; `**mapGrid/`** name unchanged in this pass.                                                                                                                                                                               |


### Acceptance (phase 3)

- Feature root lists fewer one-off helpers; draft and geometry modules have stable subtrees.
- Imports updated to `@/features/content/locations/components/authoring/draft/...` and `.../authoring/geometry/...` where applicable.
- No unexplained `mapEditor/` folder under `components/`.

---

## 13. Phase 4: `mapGrid/` layout (`authoring/` + `__tests__/`)

**Goal:** Align `**components/mapGrid/`** with a predictable split: **grid shell + cells + shared presentation** at the subtree root, **SVG / edge interaction** under a short, obvious `**authoring/`** folder (replacing the transitional `**mapAuthoring/**` name), and **grid-local tests** under `**__tests__/`** so the main list stays implementation-focused.

### Target tree

```text
mapGrid/
├── GridEditor.tsx
├── HexGridEditor.tsx
├── gridCellStyles.ts
├── mapGridCellVisualState.ts
├── LocationMapAuthoredObjectIconsLayer.tsx
├── LocationMapCellAuthoringOverlay.tsx
├── LocationMapPathSvgPaths.tsx
├── authoring/
│   ├── HexMapAuthoringSvgOverlay.tsx
│   ├── SquareMapAuthoringSvgOverlay.tsx
│   └── useSquareEdgeBoundaryPaint.ts
├── __tests__/
│   └── mapGridCellVisualState.test.ts
└── index.ts
```

### Decisions


| Topic                              | Decision                                                                                                                                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `**mapAuthoring/` → `authoring/**` | Same responsibility (location map SVG overlays + square edge boundary-paint hook); shorter path and consistent with `**components/authoring/**` (feature-level helpers) without colliding—`**mapGrid/authoring/**` is grid subtree–scoped. |
| `**__tests__/**`                   | Holds `**mapGridCellVisualState.test.ts**` next to `**mapGridCellVisualState.ts**` ownership, matching other subtrees’ test placement.                                                                                                     |
| **Root files**                     | Editors, cell styles, visual-state helpers, path/object presentation layers stay at `**mapGrid/`** root for discoverability and stable imports from routes/combat.                                                                         |


### Acceptance (phase 4)

- No `**mapAuthoring/**` folder under `**components/mapGrid/**`; imports use `**mapGrid/authoring/...**`.
- `**mapGridCellVisualState**` tests live under `**mapGrid/__tests__/**` with updated relative imports to the implementation module.

