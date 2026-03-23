---
name: Tactical Space Implementation
overview: Phased plan to add square-grid tactical spatial support to the encounter system, enabling token placement, distance/range queries, and a rendered grid UI -- all built on reusable domain primitives that separate spatial logic from UI.
todos:
  - id: phase-1a
    content: Delete duplicate `mechanics/domain/space/createZoneGridSpace.ts`; consolidate space module under `encounter/space/`
    status: completed
  - id: phase-1b
    content: "Create `createSquareGridSpace` factory with `mode: 'square-grid'`, `scale: { kind: 'grid', cellFeet: 5 }`"
    status: completed
  - id: phase-1c
    content: "Implement grid query helpers in `space.helpers.ts`: getCellAt, getCellById, getOccupant, gridDistanceFt, isWithinRange"
    status: completed
  - id: phase-1d
    content: "Type adjustments: make x/y required on EncounterCell, add `size?` to CombatantPosition, add `rangeFt?` to CombatActionTargetingProfile"
    status: completed
  - id: phase-1e
    content: Extract and implement `generateInitialPlacements` as a real helper
    status: completed
  - id: phase-2a
    content: Add optional `space` and `placements` fields to EncounterState
    status: completed
  - id: phase-2b
    content: Wire space generation and initial placements into `createEncounterState`
    status: completed
  - id: phase-2c
    content: Add range check to `isValidActionTarget` using spatial helpers
    status: completed
  - id: phase-2d
    content: Create `space.selectors.ts` with encounter-state-level selectors and GridViewModel derivation
    status: completed
  - id: phase-2e
    content: Implement `placeCombatant` pure mutation for manual placement
    status: completed
  - id: phase-3a
    content: Define `GridViewModel` / `GridCellViewModel` types for UI consumption
    status: completed
  - id: phase-3b
    content: Build `EncounterGrid` component rendering CSS Grid with token indicators and highlights
    status: completed
  - id: phase-3c
    content: Wire grid into EncounterActiveView and EncounterSetupView via new layout slots
    status: completed
isProject: false
---

# Tactical Square-Grid Spatial Support

## Current State

**What exists:**

- `EncounterSpace`, `EncounterCell`, `CombatantPosition`, and `InitialPlacementOptions` types in `[src/features/encounter/space/space.types.ts](src/features/encounter/space/space.types.ts)` -- well-shaped but unused at runtime.
- `createZoneGridSpace` factory in `[src/features/encounter/space/createZoneGridSpace.ts](src/features/encounter/space/createZoneGridSpace.ts)` -- produces a `zone-grid` space with x/y cells. A duplicate exists under `mechanics/domain/space/` with a broken import path.
- `EncounterState` (`[state/types/encounter-state.types.ts](src/features/mechanics/domain/encounter/state/types/encounter-state.types.ts)`) has **no** space or placement fields.
- `CombatantInstance` has **no** position/cellId.
- `isValidActionTarget` / `getActionTargetCandidates` in `[action-targeting.ts](src/features/mechanics/domain/encounter/resolution/action/action-targeting.ts)` do **no** range or distance checks.
- `lineOfSightClear` and `lineOfEffectClear` in `[visibility-seams.ts](src/features/mechanics/domain/encounter/state/visibility-seams.ts)` are stubs returning `true`.
- `CombatActionDefinition.displayMeta` has a `range` string but it is display-only; `CombatActionTargetingProfile` has no numeric range field.
- `Distance` type exists at `shared/distance/distance.types.ts` (`{ value: number; unit: 'ft' | 'mi' }`).
- `EncounterActiveView` is a slot-based layout component, easy to add a grid slot to.

**What needs to change for spatial awareness:**

1. A `square-grid` factory and distance helpers.
2. Placement data associated with encounter state.
3. Range data on actions, and a range check in targeting.
4. A grid rendering component wired into the active encounter UI.

---

## Invariants (must hold across all phases)

- `Location` hierarchy is never polluted with tactical/grid data.
- All coordinate math lives in domain helpers under `encounter/space/`, never in components.
- `EncounterSpace` is the spatial source of truth; `CombatantPosition[]` is the placement source of truth. Neither lives inside `CombatantInstance`.
- Cells store `x` and `y` directly (not derived from index) -- already the case.
- Cell IDs follow the deterministic `c-{x}-{y}` convention so position can be recovered from ID as a fallback, but callers should use the cell object.
- `EncounterCell.kind` defaults to `'open'`; non-open kinds are unused until terrain/cover phases.

## Explicit Non-Goals (Phase 1-3)

- Movement controls, pathfinding, waypoints.
- Line of sight / cover geometry (stubs remain).
- Difficult terrain cost, elevation.
- Large creature multi-cell footprints (types should not block them).
- Hex grids, SVG/authored maps.
- Persistent space storage (spaces are generated per encounter for now).

---

## Phase 1 -- Minimal Square-Grid Tactical Model

**Goal:** Pure domain layer. No UI, no encounter state wiring. Testable in isolation.

### 1a. Consolidate and clean up space module

- **Delete** `src/features/mechanics/domain/space/createZoneGridSpace.ts` (broken import, duplicate).
- Canonical home for all spatial domain code: `src/features/encounter/space/`.
- Rename existing `createZoneGridSpace` to `createSquareGridSpace` (or add a new factory) that sets `mode: 'square-grid'` and `scale: { kind: 'grid', cellFeet: 5 }`.

### 1b. Square-grid factory

File: `src/features/encounter/space/createSquareGridSpace.ts`

```typescript
function createSquareGridSpace(opts: {
  id: string
  name: string
  columns: number   // grid width in cells
  rows: number      // grid height in cells
  cellFeet?: 5 | 10 // default 5
}): EncounterSpace
```

- Generates `columns * rows` cells with `x`, `y`, `kind: 'open'`.
- Sets `mode: 'square-grid'`, `scale: { kind: 'grid', cellFeet }`, `width: columns`, `height: rows`.

### 1c. Grid query helpers

File: `src/features/encounter/space/space.helpers.ts`

These are pure functions operating on `EncounterSpace` and `CombatantPosition[]`:

- `**getCellAt(space, x, y): EncounterCell | undefined**` -- O(1) lookup (build an internal index or use the `c-{x}-{y}` convention).
- `**getCellById(space, cellId): EncounterCell | undefined**`
- `**getOccupant(positions, cellId): string | undefined**` -- returns combatantId at cell.
- `**getCellForCombatant(positions, combatantId): string | undefined**` -- returns cellId.
- `**isCellOccupied(positions, cellId): boolean**`
- `**gridDistanceFt(space, cellIdA, cellIdB): number**` -- Chebyshev distance (diagonal = 1 cell) * cellFeet. This is the standard 5e grid distance rule. Type-safe: only valid for `scale.kind === 'grid'`.
- `**isWithinRange(space, positions, combatantIdA, combatantIdB, rangeFt: number): boolean`** -- delegates to `gridDistanceFt`.

All helpers are stateless and side-effect-free. Future terrain cost, LOS, etc. will be additional helpers in this file or split into sub-modules.

### 1d. Type adjustments

In `[space.types.ts](src/features/encounter/space/space.types.ts)`:

- Make `x` and `y` **required** on `EncounterCell` (remove `?`). Every grid mode needs coordinates. Zone-only modes can use `0,0` or a future discriminated union.
- Add an optional `size?: number` field to `CombatantPosition` (defaults to 1; future: 2 for Large, 3 for Huge, etc.). Do not implement multi-cell logic yet, but this avoids a breaking change later.
- Remove `generateInitialPlacements` function stub from the types file; it belongs in a helper.
- Keep `EncounterCell.kind` union as-is -- it already has `'difficult'`, `'wall'`, etc. for future use.

In `[combat-action.types.ts](src/features/mechanics/domain/encounter/resolution/combat-action.types.ts)`:

- Add `rangeFt?: number` to `CombatActionTargetingProfile`. Melee defaults to 5 (or `reach`), ranged uses the weapon/spell range. `undefined` means "no range limit" (backwards-compatible).

### 1e. Placement helpers

Move `generateInitialPlacements` out of `space.types.ts` into `space.helpers.ts` and implement a basic version:

- Given `EncounterSpace`, `CombatantInstance[]`, and `InitialPlacementOptions`, place allies on one side, enemies on the other.
- Simple row-fill algorithm: pack combatants into columns on their designated side.

---

## Phase 2 -- Encounter Integration

**Goal:** Wire spatial data into `EncounterState` and the targeting pipeline so that `getActionTargetCandidates` respects range.

### 2a. Extend `EncounterState`

In `[encounter-state.types.ts](src/features/mechanics/domain/encounter/state/types/encounter-state.types.ts)`, add two optional fields:

```typescript
export interface EncounterState {
  // ... existing fields ...
  space?: EncounterSpace
  placements?: CombatantPosition[]
}
```

Optional so existing non-spatial encounters continue to work unchanged.

### 2b. Wire space into encounter startup

In the encounter runtime (`[state/runtime.ts](src/features/mechanics/domain/encounter/state/runtime.ts)`), when `createEncounterState` is called:

- Accept an optional `space: EncounterSpace` parameter.
- If provided, call `generateInitialPlacements` and store both `space` and `placements` on the state.

### 2c. Add range check to targeting

In `[action-targeting.ts](src/features/mechanics/domain/encounter/resolution/action/action-targeting.ts)`, inside `isValidActionTarget`:

- If `state.space` and `state.placements` exist and `action.targeting?.rangeFt` is defined, call `isWithinRange(state.space, state.placements, actor.instanceId, combatant.instanceId, rangeFt)`.
- If either spatial field is missing, skip the range check (backwards-compatible).

### 2d. Encounter space selectors

File: `src/features/encounter/space/space.selectors.ts`

Higher-level selectors that operate on `EncounterState` directly:

- `**selectCombatantCell(state, combatantId): EncounterCell | undefined**`
- `**selectDistanceBetween(state, idA, idB): number | undefined**` -- returns feet or undefined if no space.
- `**selectIsTargetInRange(state, actorId, targetId, rangeFt): boolean**`
- `**selectGridViewModel(state): GridViewModel | undefined**` -- derives a flat view model for the UI (see Phase 3).

### 2e. Expose placement mutation

A `placeCombatant(state, combatantId, cellId): EncounterState` pure function for manual placement during setup. Validates the cell exists and is not blocked. Returns updated state with new `placements`.

---

## Phase 3 -- UI Rendering

**Goal:** Render a simple grid in the active encounter view. Display tokens. Allow initial/manual placement only.

### 3a. Grid view model

Type: `GridViewModel` (derived by `selectGridViewModel`):

```typescript
type GridCellViewModel = {
  cellId: string
  x: number
  y: number
  kind: EncounterCell['kind']
  occupantId: string | null
  occupantLabel: string | null
  occupantSide: 'party' | 'enemy' | null
  isActive: boolean          // current turn's combatant
  isSelectedTarget: boolean  // currently selected target
  isInRange: boolean         // within selected action's range of active combatant
}

type GridViewModel = {
  columns: number
  rows: number
  cellFeet: number
  cells: GridCellViewModel[]
}
```

Components never compute distances or check occupancy -- they read `GridCellViewModel`.

### 3b. Grid component

File: `src/features/encounter/components/EncounterGrid.tsx`

- Receives `GridViewModel` and callbacks (`onCellClick`).
- Renders a CSS Grid or SVG of cells. Each cell shows a token indicator (initials / side color) if occupied.
- Highlights active combatant, selected target, in-range cells.
- No drag-and-drop yet. Click a cell during setup to place; click a token during active to select target.

### 3c. Wire into layout

- Add an optional `grid?: React.ReactNode` slot to `EncounterActiveView` (and `EncounterSetupView` for placement).
- In `EncounterRoute`, derive `GridViewModel` from `encounterState` using `selectGridViewModel`, pass to `EncounterGrid`.
- During setup: generate a space using `createSquareGridSpace` from environment config (new field or default size). Surface a simple size picker (e.g. small/medium/large presets).
- During active play: grid is read-only display.

---

## Phase 4 -- Extension Seams

Document these seams for future implementation. No code needed now, but the architecture above must not block them.


| Future Feature                 | Seam                                                                                                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Movement controls**          | `placeCombatant` mutation already exists. Add `moveCombatant(state, id, path)` that validates movement cost against `turnResources.movementRemaining`. Path is `cellId[]`.  |
| **Large creature footprints**  | `CombatantPosition.size` field (Phase 1d). Helpers check `size x size` cell block. `isCellOccupied` becomes `getOccupyingCombatant` checking all cells in footprint.        |
| **Difficult terrain**          | `EncounterCell.kind === 'difficult'` and `movementCost` already exist. Movement helpers sum path cost.                                                                      |
| **Hazards / traps**            | `EncounterFeature` type already supports `kind: 'hazard'                                                                                                                    |
| **Line of sight / cover**      | `lineOfSightClear` / `lineOfEffectClear` stubs accept `EncounterState` which will contain `space`. Implement ray-casting against `blocksSight` / `blocksProjectiles` cells. |
| **Custom SVG / authored maps** | `EncounterSpace.mode` already supports `'svg-zones'`. Render layer switches on mode. Grid helpers branch on `scale.kind`.                                                   |
| **Hex grids**                  | `mode: 'hex-grid'` exists in the union. Add `createHexGridSpace` factory and hex-distance helper. `gridDistanceFt` dispatches on mode.                                      |


---

## Recommended File Structure

```
src/features/encounter/space/
  index.ts                        -- barrel
  space.types.ts                  -- EncounterSpace, EncounterCell, CombatantPosition, etc.
  createSquareGridSpace.ts        -- factory (new)
  createZoneGridSpace.ts          -- existing factory (keep for zone mode)
  space.helpers.ts                -- getCellAt, gridDistanceFt, isWithinRange, etc. (new)
  space.selectors.ts              -- selectCombatantCell, selectGridViewModel, etc. (new)
  generateInitialPlacements.ts    -- placement logic (extracted from types file)
  __tests__/
    space.helpers.test.ts
    createSquareGridSpace.test.ts
    generateInitialPlacements.test.ts
```

No spatial code under `features/content/locations/` or `features/mechanics/domain/space/`.

---

## Future Risks

- **Performance at large grid sizes:** `gridDistanceFt` is O(1) for Chebyshev, but `selectGridViewModel` iterates all cells. For grids beyond ~50x50 (2500 cells), consider virtualization or memoization. Not a concern for typical encounter maps (6x6 to 20x20).
- **Diagonal distance rule:** 5e has a variant rule (5/10/5 alternating diagonals). Starting with Chebyshev (every diagonal = 5ft) is simpler and matches the most common table ruling. The helper signature supports swapping the algorithm later without API changes.
- **Action range data:** `rangeFt` must be populated on `CombatActionTargetingProfile` by the adapters (`spell-combat-adapter`, `monster-combat-adapter`, weapon builders). This is a moderate data-wiring task that should be done in Phase 2 but may surface edge cases (e.g. spells with "Self (30-foot radius)" are area effects, not single-target range).
- **Placement during active encounter:** If a combatant is summoned mid-encounter (summon spells already exist), it will need placement. The `placeCombatant` mutation handles this, but the UI flow for "where does the summon appear?" needs design.
- **Stale placements after death:** A dead combatant's position should remain (corpse on the map) but be visually distinct. `GridCellViewModel` can derive this from `combatant.remains`.

