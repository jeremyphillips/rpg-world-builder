# Spatial System Reference

## 1. Purpose and Scope

The spatial system adds tactical grid-based positioning to encounters. It answers three core questions:

- **Where are combatants?** Cell-based placement on a square grid.
- **Is a target in range?** Chebyshev distance check against action `rangeFt`.
- **Can a combatant move there?** Distance-based movement spending from `movementRemaining`.

The system is intentionally separate from narrative `Location` content. Locations describe fictional places; encounter spaces define tactical geometry.

## 2. Directory Layout

```
src/features/encounter/space/
├── index.ts                        # Public barrel
├── space.types.ts                  # EncounterSpace, EncounterCell, GridObstacle, CombatantPosition
├── space.helpers.ts                # Pure cell/distance/occupancy queries
├── space.selectors.ts              # State-level selectors, GridViewModel, movement
├── applyGridSpawnReplacement.ts    # Spawn target → new combatant(s) placement transfer
├── createSquareGridSpace.ts        # Factory: square-grid EncounterSpace
├── createZoneGridSpace.ts          # Factory: zone-grid EncounterSpace
├── generateInitialPlacements.ts    # Side-based initial combatant placement
├── placeRandomGridObstacle.ts      # Optional single random obstruction from environment
└── space.sight.ts                  # Line of sight: supercover line + hasLineOfSight / cellBlocksSight
```

## 3. Current Functionality

### Grid creation

`createSquareGridSpace` generates a rectangular `EncounterSpace` with mode `'square-grid'`, a configurable `cellFeet` scale (default 5ft), and `width * height` cells. Each cell has an `(x, y)` coordinate and a string `id` of the form `c-{x}-{y}`.

When an encounter is started from setup, the app may call **`placeRandomGridObstacle`** immediately after `createSquareGridSpace`. That inserts **exactly one** random obstruction on an **open** cell, records it in **`EncounterSpace.obstacles`** (`GridObstacle`: `kind` `tree` | `pillar`, `cellId`, and stub booleans `blocksLineOfSight` / `blocksMovement` for future rules), and sets the chosen cell’s **`kind`** to **`blocking`** with blocking flags so placement and AoE origin checks stay aligned.

**Environment → obstacle kind (first pass):**

- `indoors` → pillar  
- `outdoors` → tree  
- `mixed` and `other` → pillar (neutral default until richer mapping exists)

**Timing note:** Obstacles are chosen **before** `generateInitialPlacements` runs (combatants are not on the grid yet). The implementation only avoids cells already listed in `obstacles`; it does not reserve cells against future token positions beyond marking the cell as impassable.

### Distance

`gridDistanceFt` computes Chebyshev (king-move) distance between two cells, multiplied by `cellFeet`. Diagonal movement costs the same as orthogonal -- the standard 5e grid rule.

### Range-based target validation

`CombatActionTargetingProfile.rangeFt` is populated by all combat action adapters:

- **Spells:** `deriveSpellRangeFt` maps `SpellRange` to feet (touch = 5, distance = value, self/sight/unlimited = no limit).
- **Monster natural attacks:** `action.reach ?? 5`.
- **Monster weapon attacks:** `weapon.range.normal ?? 5`.
- **Character weapon attacks:** Derived from `CombatantAttackRange` on `CombatantAttackEntry`, mapped through `buildAttackActions`. `normalizeWeaponsForAttacks` is the single catalog-to-attack mapping site.

`isValidActionTarget` in `action-targeting.ts` filters targets by `rangeFt` when spatial data is present. Backwards-compatible: no spatial data means no range filtering.

### Initial placement

`generateInitialPlacements` distributes combatants along configurable sides of the grid (default: allies left, enemies right). Overflow wraps into interior columns.

### Grid view model

`selectGridViewModel` flattens `EncounterSpace` + `CombatantPosition[]` into a flat `GridCellViewModel[]` for UI rendering. Each cell carries **`isActive`**, **`isSelectedTarget`**, **`isWithinSelectedActionRange`** (Chebyshev distance from the active combatant to that cell within the selected action’s `rangeFt` — distance only, not full targeting validity), **`isLegalTargetForSelectedAction`**, **`isHostileLegalTargetForSelectedAction`**, **`isHostileSelectedTargetPulse`**, and **`isReachable`**, plus **`obstacleKind` / `obstacleLabel`** when the cell has an entry in `space.obstacles`. The active encounter grid uses **token-first** emphasis (rings, pulses) for turn and targeting; it does **not** apply a full-board tint for “in range” distance.

The `showReachable` option is driven by movement budget (`movementRemaining > 0`) and UI mode (movement highlights are suppressed during AoE origin placement) so reachable cells can highlight without an explicit movement mode.

**Movement rejection helper:** `getMoveRejectionReason(state, combatantId, targetCellId)` returns short labels such as `Out of range`, `Cell occupied`, or `Blocked` when a move would fail, for anchored status text (not tooltips on cells).

**Grid hover status:** `deriveGridHoverStatusMessage` (encounter helpers) composes a single line for illegal hover (movement, creature targeting, or invalid AoE origin) to show under the encounter header.

### Spawn and grid replacement (tactical token handoff)

When a **`spawn`** effect creates new combatants that **replace** an existing token on the grid (e.g. animating a corpse into a new creature), **`applyGridSpawnReplacementFromTarget`** (`src/features/encounter/space/applyGridSpawnReplacement.ts`) updates **`EncounterState.placements`**: the spawn target is removed from placements, the first spawned combatant takes the target’s **`cellId`**, and any additional spawns are placed on the nearest passable empty cells (Chebyshev distance). The grid view model continues to derive **`occupantId`** from placements only, so the **new** combatant becomes the visible token. This is the generic hook for corpse→minion replacement and is intended to extend to future **shapeshift / transformation** flows that introduce a new combatant instance in the same space.

### Line of sight (binary, first pass)

`space.sight.ts` implements **binary** line of sight on the square grid for shared use by spells, ranged/thrown attacks, and any feature that needs “can I draw a line?” — not spell-specific.

- **Line geometry:** The segment runs between **cell centers** of the source and target cells `(x+0.5, y+0.5)`. The set of cells visited is a **grid supercover** using an **Amanatides & Woo–style DDA** (each unit cell the segment intersects). When a ray hits a **corner** between two cells, the tie branch steps **diagonally** so both grid steps are included.
- **Blocking:** `cellBlocksSight(space, cellId)` is the **only** resolver for opaque sight blockers; it reads `EncounterCell.blocksSight`. **Intermediate** cells on the path may block; **source and target cells do not** block their own endpoints (occupants on those squares do not apply blocking in this first pass).
- **API:** `hasLineOfSight(space, fromCellId, toCellId)`; `traceLineOfSightCells` is mainly for tests and debugging.
- **Targeting:** `canSeeForTargeting` in `visibility-seams.ts` composes condition-based sight (e.g. blinded, invisible) with `lineOfSightClear`, which calls `hasLineOfSight` when `EncounterSpace` and placements exist. **Cover** and **obscurement** are out of scope here; future `deriveCoverLevel` would sit beside LoS, not inside it.

### Movement

`moveCombatant` validates distance and movement budget, deducts from `turnResources.movementRemaining`, and updates placements. 5e split movement (move-attack-move) works naturally since `movementRemaining` is persistent per-turn state.

`selectCellsWithinDistance` returns cell IDs within movement range using Chebyshev distance. `canMoveTo` is the single predicate combining distance, budget, cell passability, and occupancy.

### Character speed

Characters default to 30ft ground speed (`stats.speeds = { ground: 30 }`) in `buildCharacterCombatantInstance`. Monster speed comes from `monster.mechanics.movement`.

## 4. Limitations

These are intentional simplifications for the current milestone, not bugs:

- **Distance-based cell selection is geometric only.** `selectCellsWithinDistance` ignores walls, terrain costs, and blockers. Sufficient for generated open grids. Named distinctly from future `selectPathReachableCells`.
- **`targeting.rangeFt` is a single resolved scalar.** No long-range disadvantage, area templates, cone/line targeting, or minimum range. `CombatantAttackRange` carries `longFt` for future disadvantage rules, but the roll modifier is not wired.
- **Character speed is hardcoded 30ft.** No race/species-based speeds. Refined when race modeling is added.
- **No opportunity attacks.** Movement does not trigger reactions. The seam exists via `turnHooks` and `reactionAvailable`.
- **No Disengage or Dash actions.** Dash would double `movementRemaining`; Disengage would suppress opportunity attacks. `CombatActionCost.movementFeet` exists for future action costs.
- **Pathfinding** is still geometric / not path-aware for movement highlights. **Ray-based LOS** exists for targeting (`hasLineOfSight`); **cover bonuses** and **obscurement** are still deferred.
- **No large creature footprints.** `CombatantPosition.size` exists as a seam but is not consumed by placement, movement, or range validation.
- **`EncounterCell.movementCost` is not consumed.** The field exists for future difficult terrain but `moveCombatant` does not read it.

## 5. Long-Term Risks and Architectural Notes

### Catalog-to-attack normalization boundary

`getCharacterAttacks` depends on a normalized weapon attack input contract (`NormalizedWeaponInput`), not on raw weapon catalog shape. Catalog-to-attack normalization happens at the caller boundary via `normalizeWeaponsForAttacks`. If the catalog schema changes, only the mapping site updates -- the attack resolver stays stable. To prevent behavioral drift, there should be one shared mapper or one shared normalized type with a narrow constructor/helper.

### Geometric vs path-aware reachability

Current naming intentionally distinguishes *in-range by metric* (`selectCellsWithinDistance`) from *actually pathable/reachable* (future `selectPathReachableCells`). Authored maps will require path-aware reachability and likely LOS-aware targeting as separate concerns. These three -- pathfinding, LOS, and range metric -- are easy to accidentally blur together.

### Split movement model extensibility

5e split movement is compatible because `movementRemaining` is tracked as persistent per-turn state. No special phase model is required. Future rules logic (forced movement not consuming budget, Dash changing budget, stand-up costing movement, mid-turn speed reduction) does not invalidate the model but will need targeted additions.

### Range semantics will expand beyond a single scalar

`targeting.rangeFt` is an intentional simplification. Richer targeting modes -- long range disadvantage, reach distinctions, thrown weapon dual ranges, self/touch/cone/line/area templates, minimum range -- will require a more structured targeting model. `CombatantAttackRange` (melee vs ranged) is a first step, but `targeting.rangeFt` should be understood as a stepping stone, not permanent architecture.

## 6. Key Types

| Type | Location | Purpose |
|------|----------|---------|
| `EncounterSpace` | `space.types.ts` | Grid definition: cells, optional `obstacles`, scale, dimensions |
| `GridObstacle` | `space.types.ts` | Obstruction record: kind, cellId, future blocking flags |
| `EncounterCell` | `space.types.ts` | Single cell: position, kind, terrain tags |
| `CombatantPosition` | `space.types.ts` | Links combatant to cell |
| `CombatantAttackRange` | `combatant.types.ts` | Discriminated union: melee (rangeFt) or ranged (normalFt, longFt) |
| `GridCellViewModel` | `space.selectors.ts` | UI-ready cell with highlight flags |
| `GridViewModel` | `space.selectors.ts` | Complete grid for rendering |
| `applyGridSpawnReplacementFromTarget` | `applyGridSpawnReplacement.ts` | Transfers tactical `placements` from a spawn target to new combatant(s) (replacement / corpse→minion) |
| `hasLineOfSight` | `space.sight.ts` | Binary LoS along supercover segment between cell centers |
| `GridInteractionMode` | `encounter-interaction.types.ts` | `'select-target' \| 'move'` UI mode |
