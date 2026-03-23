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
├── space.types.ts                  # EncounterSpace, EncounterCell, CombatantPosition
├── space.helpers.ts                # Pure cell/distance/occupancy queries
├── space.selectors.ts              # State-level selectors, GridViewModel, movement
├── createSquareGridSpace.ts        # Factory: square-grid EncounterSpace
├── createZoneGridSpace.ts          # Factory: zone-grid EncounterSpace
└── generateInitialPlacements.ts    # Side-based initial combatant placement
```

## 3. Current Functionality

### Grid creation

`createSquareGridSpace` generates a rectangular `EncounterSpace` with mode `'square-grid'`, a configurable `cellFeet` scale (default 5ft), and `width * height` cells. Each cell has an `(x, y)` coordinate and a string `id` of the form `cell-{x}-{y}`.

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

`selectGridViewModel` flattens `EncounterSpace` + `CombatantPosition[]` into a flat `GridCellViewModel[]` for UI rendering. Each cell carries `isActive`, `isSelectedTarget`, `isInRange`, and `isReachable` flags.

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
- **No pathfinding, LOS, or cover.** These are three distinct concerns (path-aware reachability, line-of-sight, cover bonuses) that should remain separate. All are deferred.
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
| `EncounterSpace` | `space.types.ts` | Grid definition: cells, scale, dimensions |
| `EncounterCell` | `space.types.ts` | Single cell: position, kind, terrain tags |
| `CombatantPosition` | `space.types.ts` | Links combatant to cell |
| `CombatantAttackRange` | `combatant.types.ts` | Discriminated union: melee (rangeFt) or ranged (normalFt, longFt) |
| `GridCellViewModel` | `space.selectors.ts` | UI-ready cell with highlight flags |
| `GridViewModel` | `space.selectors.ts` | Complete grid for rendering |
| `InteractionMode` | `EncounterActiveFooter.tsx` | `'select-target' \| 'move'` UI mode |
