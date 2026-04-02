# Spatial System Reference

## 1. Purpose and Scope

The spatial system adds tactical grid-based positioning to encounters. It answers three core questions:

- **Where are combatants?** Cell-based placement on a square grid.
- **Is a target in range?** Chebyshev distance check against action `rangeFt`.
- **Can a combatant move there?** Distance-based movement spending from `movementRemaining`.

The system is intentionally separate from narrative `Location` content. Locations describe fictional places; encounter spaces define tactical geometry.

**Conceptual split (see also §6):**

- **Authored vocabulary** — e.g. `LocationPlacedObjectKindId` in location map content (what authors place).
- **Runtime grid objects** — `GridObject` on `EncounterSpace.gridObjects`: blocking, LoS, cover, `isMovable`, optional `authoredPlaceKindId` or `proceduralPlacementKind` (`tree` / `pillar`).
- **Edges and boundaries** — `EncounterEdge`, `EncounterCell.kind` (e.g. `wall`), and `EncounterAuthoringPresentation.edgeEntries` (walls / doors / windows as presentation); not folded into `GridObject` unless a future feature explicitly bridges them.

## 2. Directory Layout

```
packages/mechanics/src/combat/space/
├── index.ts                        # Public barrel
├── space.types.ts                  # EncounterSpace, EncounterCell, GridObject, CombatantPosition, …
├── gridObject/                     # Default/spec helpers for runtime object behavior (procedural + authored kinds)
├── space.helpers.ts                # Cell/distance/occupancy; getEncounterGridObjects, find/move grid objects
├── creation/                       # Space factories
├── placement/                      # Placements, spawn replacement, placeRandomGridObject (legacy placeRandomGridObstacle)
├── rendering/                      # Grid occupant token presentation
├── selectors/                      # State-level selectors, GridViewModel, movement
├── sight/                          # Supercover line + hasLineOfSight, cellBlocksSight (raw), cellOpaqueToSight
├── spatial/                        # Edge segment crossing; movement BFS (reachability, shortest path ft)
└── __tests__/                      # Mirrors creation, placement, rendering, selectors, sight (+ space.helpers.test)
```

## 3. Current Functionality

### Grid creation

`createSquareGridSpace` generates a rectangular `EncounterSpace` with mode `'square-grid'`, a configurable `cellFeet` scale (default 5ft), and `width * height` cells. Each cell has an `(x, y)` coordinate and a string `id` of the form `c-{x}-{y}`.

When an encounter is started from setup, the app calls **`placeRandomGridObject`** immediately after `createSquareGridSpace`. That inserts **exactly one** random procedural object on an **open** cell, appends a **`GridObject`** to **`EncounterSpace.gridObjects`** (with `proceduralPlacementKind` `tree` | `pillar`, runtime flags from `defaultsForProceduralKind`, and **`isMovable: false`**), and sets the chosen cell’s **`kind`** to **`blocking`** with blocking flags so placement and AoE origin checks stay aligned.

**`placeRandomGridObstacle`** remains as a **deprecated** alias that delegates to **`placeRandomGridObject`**; new code should not depend on it.

**Environment → procedural kind (first pass):**

- `indoors` → pillar  
- `outdoors` → tree  
- `mixed` and `other` → pillar (neutral default until richer mapping exists)

**Reading placed objects:** Use **`getEncounterGridObjects(space)`** in `space.helpers.ts`. It returns **`gridObjects`** when that array is non-empty; otherwise it maps legacy **`EncounterSpace.obstacles`** (`GridObstacle`, deprecated) into **`GridObject`** so older persisted state still works.

**Timing note:** Objects are chosen **before** `generateInitialPlacements` runs (combatants are not on the grid yet). The implementation avoids cells already occupied by **`gridObjects` or legacy `obstacles`**; it does not reserve cells against future token positions beyond marking the cell as impassable.

**Object-anchored effects:** Attached emanations with **`anchorMode === 'object'`** store **`BattlefieldEffectAnchor`** `{ kind: 'object', objectId }` where **`objectId`** is a **`GridObject.id`**. **`resolveBattlefieldEffectOriginCellId`** uses the live object position (**`findGridObjectById`**). **`moveGridObjectInEncounterState`** applies a cell move and runs **`reconcileBattlefieldEffectAnchors`** (deprecated alias: **`moveGridObstacleInEncounterState`**).

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

`selectGridViewModel` flattens `EncounterSpace` + `CombatantPosition[]` into a flat `GridCellViewModel[]` for UI rendering. Each cell carries **`isActive`**, **`isSelectedTarget`**, **`isWithinSelectedActionRange`** (Chebyshev distance from the active combatant to that cell within the selected action’s `rangeFt` — distance only, not full targeting validity), **`isLegalTargetForSelectedAction`**, **`isHostileLegalTargetForSelectedAction`**, **`isHostileSelectedTargetPulse`**, and **`isReachable`**, plus **`obstacleKind` / `obstacleLabel`** when **`getEncounterGridObjects`** reports an object on that cell. **`obstacleKind`** is typed as **`GridObjectPlacementKindKey`** (procedural `tree` | `pillar` or an authored **`LocationPlacedObjectKindId`**); **`obstacleLabel`** comes from `gridObjectPlacementKindDisplayLabel`. Token styling uses **`occupantIsDefeated`** (dimmed token when HP ≤ 0) and **`occupantRendersToken`**: the avatar/token is drawn only when the occupant has **battlefield presence** (see below). The active encounter grid uses **token-first** emphasis (rings, pulses) for turn and targeting; it does **not** apply a full-board tint for “in range” distance.

The `showReachable` option is driven by movement budget (`movementRemaining > 0`) and UI mode (movement highlights are suppressed during AoE origin placement) so reachable cells can highlight without an explicit movement mode.

**Movement rejection helper:** `getMoveRejectionReason(state, combatantId, targetCellId)` returns short labels such as `Out of range`, `Cell occupied`, or `Blocked` when a move would fail, for anchored status text (not tooltips on cells).

**Grid hover status:** `deriveGridHoverStatusMessage` (encounter helpers) composes a single line for illegal hover (movement, creature targeting, or invalid AoE origin) to show under the encounter header.

**Grid cell visuals:** The tactical grid is rendered by **`CombatGrid`** (`src/features/combat/components/grid/CombatGrid.tsx`); the encounter feature exposes a thin **`EncounterGrid`** wrapper that forwards the same props. Cell fill and movement outlines come from `getCellVisualState` and `getCellVisualSx` in `src/features/combat/components/grid/cellVisualState.ts` and `cellVisualStyles.ts`. **Overlay precedence** (highest first): blocked tile → placement (invalid hover, selected, cast-range band) → AoE (invalid origin hover, locked origin, area template) → **AoE cast-range band** (cells within spell cast distance when no higher-priority AoE tint applies) → default paper. **Movement** (reachable border / green fill / illegal-move hover) is applied after that stack. The AoE cast-range band is modeled as a first-class overlay kind; its style entry uses the same paper fill as open ground (matching prior behavior) while still participating in precedence so **movement fill suppression** on those cells is explicit in the resolver, not a separate ad hoc suppression flag in the component. Persistent auras or emanations can extend the same overlay list later.

### Battlefield presence, occupancy, and return placement (mechanics linkage)

Grid **`CombatantPosition[]`** is the source of truth for **which combatant occupies which cell**. Separately, **participation / battlefield presence** (whether a creature should appear on the tactical map at all) is defined in mechanics via `hasBattlefieldPresence` and engine-state rules (e.g. **banished**, **off-grid**) — see `combatants/combatant-participation.ts` and `conditions/condition-rules/engine-state-definitions.ts` in `packages/mechanics/src/combat/state/`.

**When a combatant becomes temporarily absent** (those engine states), mechanics **`battlefield-return-placement.ts`**:

- Clears their row from **`EncounterState.placements`** so the cell is **no longer occupied** for movement and targeting (no “invisible blocker”).
- Stores **`battlefieldReturnCellId`** on the combatant for deterministic return.

**When absence ends** (explicit `removeStateFromCombatant`, marker duration tick, or **concentration** `dropConcentration` stripping linked markers), the same module **restores** placement immediately using **`placeCombatant`** in `selectors/space.selectors.ts` — preferred cell first, then nearest passable unoccupied cell (Chebyshev rings, stable tie-break).

The grid view model’s **`occupantRendersToken`** flag stays aligned with presence: if mechanics have cleared placement, there is usually no `occupantId`; if state ever diverged, the flag still suppresses the token when presence is false.

**UI:** Initiative / preview cards use shared participation visuals (`packages/mechanics/src/combat/presentation/participation/presentation-participation.ts`) — defeated vs battlefield-absent dimming — separate from this folder but driven by the same presence semantics.

### Spawn and grid replacement (tactical token handoff)

When a **`spawn`** effect creates new combatants that **replace** an existing token on the grid (e.g. animating a corpse into a new creature), **`applyGridSpawnReplacementFromTarget`** (`packages/mechanics/src/combat/space/placement/applyGridSpawnReplacement.ts`) updates **`EncounterState.placements`**: the spawn target is removed from placements, the first spawned combatant takes the target’s **`cellId`**, and any additional spawns are placed on the nearest passable empty cells (Chebyshev distance). The grid view model continues to derive **`occupantId`** from placements only, so the **new** combatant becomes the visible token. This is the generic hook for corpse→minion replacement and is intended to extend to future **shapeshift / transformation** flows that introduce a new combatant instance in the same space.

### Line of sight (binary, first pass)

`sight/space.sight.ts` implements **binary** line of sight on the square grid for shared use by spells, ranged/thrown attacks, and any feature that needs “can I draw a line?” — not spell-specific.

- **Line geometry:** The segment runs between **cell centers** of the source and target cells `(x+0.5, y+0.5)`. The set of cells visited is a **grid supercover** using an **Amanatides & Woo–style DDA** (each unit cell the segment intersects). When a ray hits a **corner** between two cells, the tie branch steps **diagonally** so both grid steps are included.
- **Interior opacity:** **Intermediate** cells (not source or target **as cell interiors**) use **`cellOpaqueToSight`**: raw `EncounterCell.blocksSight` via **`cellBlocksSight`**, **plus** any **`GridObject`** on that cell with **`blocksLineOfSight`**. Source/target cell **centers** are not treated as opaque interiors; a **segment** into the target can still be blocked by an **`EncounterEdge`**.
- **Edges:** Consecutive cells on the path are checked with **`segmentSightBlocked`** (`spatial/edgeCrossing.ts`). Orthogonal steps use the edge between the two cells (if absent, the boundary is open). **Diagonal** steps use a **strict corner rule**: sight is blocked if **either** orthogonal edge from the source toward that diagonal would block sight (same geometry as movement segment checks; **policy** can differ — e.g. a **window** edge may set **`blocksMovement: true`** and **`blocksSight: false`**).
- **API:** `hasLineOfSight(space, fromCellId, toCellId)`; `traceLineOfSightCells` is mainly for tests and debugging. Raw flag read: **`cellBlocksSight`**; composed interior: **`cellOpaqueToSight`**.
- **Targeting:** `canSeeForTargeting` delegates to `canPerceiveTargetOccupantForCombat` (`visibility/combatant-pair-visibility.ts`): condition-based sight (e.g. blinded, invisible), `lineOfSightClear` → `hasLineOfSight` when a grid exists, then **occupant** visibility from `perception.resolve.ts` (heavy obscurement, magical darkness, etc.). **Cover** for attack modifiers is still separate; binary LoS here does not replace perception’s “can you see the creature in that cell?”

### Movement

`moveCombatant` validates distance and movement budget, deducts from `turnResources.movementRemaining`, and updates placements. 5e split movement (move-attack-move) works naturally since `movementRemaining` is persistent per-turn state.

**Optional battlefield spell context:** When the caller passes **`BattlefieldSpellContext`** (`spellLookup`, optional **`suppressSameSideHostile`**) as the fourth argument, movement is reconciled against **effective ground speed** for the combatant’s **current** cell after each step:

- **`getEffectiveGroundMovementBudgetFt`** (`packages/mechanics/src/combat/state/battlefield/battlefield-spatial-movement-modifiers.ts`) applies **`floor(baseSpeed × product)`**, where the product comes from overlapping **attached sphere auras** (`EncounterState.attachedAuraInstances`) whose spells define **`modifier`** effects with **`target: 'speed'`** and **`mode: 'multiply'`** (e.g. Spirit Guardians `0.5`). Overlap uses the same geometry as aura rendering; the aura **source** and **`unaffectedCombatantIds`** are skipped; defeated combatants and same-side suppression follow **`battlefield-attached-aura-shared`** rules.
- **`turnContext.movementSpentThisTurn`** accumulates feet moved; after each move, **`movementRemaining = max(0, effectiveMax − spent)`** so entering or leaving an aura mid-turn updates the budget without double-counting.

When no context is passed, **`movementRemaining`** is reduced by the **shortest legal path length in feet** (`minMovementCostFtToCell`), not Chebyshev distance alone — going around a wall costs more than a straight-line metric when the direct segment is blocked.

Turn start resets movement via **`createCombatantTurnResources`** in **`shared.ts`**: when **`advanceEncounterTurn`** / **`createEncounterState`** supply spell lookup (same object shape as interval resolution), the initial **`movementRemaining`** uses the same **effective** budget for the combatant’s position at turn start.

**Movement reachability (not LoS):** **`spatial/movementReachability.ts`** performs **breadth-first search** over **king-adjacent** cells (8 directions). Each step uses **`movementStepLegal`**: **`cellMovementBlockedForEntering`** on the cell entered, and **`segmentMovementBlocked`** on the step (orthogonal edge or diagonal corner rule — same geometry as sight, **movement** flags on edges). This answers “is there **some** legal route within budget?” — **not** “is the straight supercover ray clear?” (that remains **`hasLineOfSight`** only).

**`minMovementCostFtToCell`** returns the **shortest** route cost in feet (each orthogonal or diagonal step costs one **`cellFeet`**). **`cellsReachableWithinMovementBudget`** collects all cells reachable within **`movementRemaining`**. **`selectCellsWithinDistance`** and **`canMoveTo`** use this BFS; **`moveCombatant`** deducts the shortest-path cost. **`placeCombatant`**, **`isValidSingleCellPlacementPick`**, **`validateSingleCellPlacement`**, and **`isValidAoeOriginCell`** still use **`cellMovementBlockedForEntering`** only for destination validity (not graph search).

### Character speed

Characters default to 30ft ground speed (`stats.speeds = { ground: 30 }`) in `buildCharacterCombatantInstance`. Monster speed comes from `monster.mechanics.movement`.

## 4. Limitations

These are intentional simplifications for the current milestone, not bugs:

- **Uniform step costs only.** Reachability BFS treats each king-move as one **`cellFeet`**; **`EncounterCell.movementCost`** / difficult terrain multipliers are not applied yet.
- **`targeting.rangeFt` is a single resolved scalar.** No long-range disadvantage, area templates, cone/line targeting, or minimum range. `CombatantAttackRange` carries `longFt` for future disadvantage rules, but the roll modifier is not wired.
- **Character speed is hardcoded 30ft.** No race/species-based speeds. Refined when race modeling is added.
- **Opportunity attacks (domain legality).** `reactions/opportunity-attack.ts` evaluates leave-reach (spatial) separately from sight: `canReactorPerceiveDepartingOccupantForOpportunityAttack` delegates to `canPerceiveTargetOccupantForCombat` (combat `viewerRole: 'pc'`, not DM omniscience). Movement resolution does not auto-spend reactions; callers use `getOpportunityAttackLegalityDenialReason` / `getCombatantIdsEligibleForOpportunityAttackAgainstMover` after `moveCombatant` when wiring OA UI or prompts.
- **No Disengage or Dash actions.** Dash would double `movementRemaining`; Disengage would suppress opportunity attacks. `CombatActionCost.movementFeet` exists for future action costs.
- **Cover bonuses** and **obscurement** for attacks are still deferred beyond binary LoS / perception.
- **No large creature footprints.** `CombatantPosition.size` exists as a seam but is not consumed by placement, movement, or range validation.
- **`EncounterCell.movementCost` is not consumed.** The field exists for future difficult terrain but `moveCombatant` does not read it.

## 5. Long-Term Risks and Architectural Notes

### Catalog-to-attack normalization boundary

`getCharacterAttacks` depends on a normalized weapon attack input contract (`NormalizedWeaponInput`), not on raw weapon catalog shape. Catalog-to-attack normalization happens at the caller boundary via `normalizeWeaponsForAttacks`. If the catalog schema changes, only the mapping site updates -- the attack resolver stays stable. To prevent behavioral drift, there should be one shared mapper or one shared normalized type with a narrow constructor/helper.

### Geometric vs path-aware reachability

**Targeting range** (`rangeFt`) still uses **Chebyshev** distance for “in range” — not movement pathfinding. **Movement** uses BFS shortest-path feet on the grid. **LoS** uses **supercover + segments** only (`hasLineOfSight`). Those three — range metric, movement route, LoS ray — stay separate; the UI should not assume they coincide near walls.

### Split movement model extensibility

5e split movement is compatible because `movementRemaining` is tracked as persistent per-turn state. No special phase model is required. **Spatial speed reduction** from overlapping attached auras is handled by reconciling remaining movement against **current** effective speed (`movementSpentThisTurn` + `getEffectiveGroundMovementBudgetFt`). Other rules (forced movement not consuming budget, Dash doubling budget, prone stand-up half-move) still need targeted additions when modeled.

### Range semantics will expand beyond a single scalar

`targeting.rangeFt` is an intentional simplification. Richer targeting modes -- long range disadvantage, reach distinctions, thrown weapon dual ranges, self/touch/cone/line/area templates, minimum range -- will require a more structured targeting model. `CombatantAttackRange` (melee vs ranged) is a first step, but `targeting.rangeFt` should be understood as a stepping stone, not permanent architecture.

## 6. Key Types

| Type | Location | Purpose |
|------|----------|---------|
| `EncounterSpace` | `space.types.ts` | Grid definition: cells, optional **`gridObjects`**, optional deprecated **`obstacles`**, scale, dimensions |
| `GridObject` | `space.types.ts` | Runtime placed object: `cellId`, blocking / LoS / `coverKind`, **`isMovable`**, optional `authoredPlaceKindId` or `proceduralPlacementKind` |
| `GridObstacle` | `space.types.ts` | **Deprecated.** Legacy obstruction shape; use **`GridObject`** — read via **`getEncounterGridObjects`** |
| `EncounterCell` | `space.types.ts` | Single cell: position, kind, terrain tags |
| `CombatantPosition` | `space.types.ts` | Links combatant to cell |
| `CombatantAttackRange` | `combatant.types.ts` | Discriminated union: melee (rangeFt) or ranged (normalFt, longFt) |
| `GridCellViewModel` | `selectors/space.selectors.ts` | UI-ready cell with highlight flags; includes **`occupantRendersToken`**, **`occupantIsDefeated`**, **`obstacleKind`** / **`obstacleLabel`** (from grid objects) |
| `GridViewModel` | `selectors/space.selectors.ts` | Complete grid for rendering |
| `getEncounterGridObjects` | `space.helpers.ts` | Canonical list: **`gridObjects`** or legacy **`obstacles`** mapped to **`GridObject`** |
| `placeRandomGridObject` | `placement/placeRandomGridObstacle.ts` | Procedural single-object placement into **`gridObjects`** |
| `placeCombatant` | `selectors/space.selectors.ts` | Authoritative placement update: filter prior row, append `{ combatantId, cellId }` for passable cells |
| `moveCombatant` | `selectors/space.selectors.ts` | Validates move; updates `movementRemaining` and `placements`; optional 4th arg **`BattlefieldSpellContext`** for spatial speed reconciliation |
| `moveGridObjectInEncounterState` | `auras/battlefield-effect-anchor-reconciliation.ts` | Moves a grid object and runs **`reconcileBattlefieldEffectAnchors`** (replaces deprecated **`moveGridObstacleInEncounterState`**) |
| `getEffectiveGroundMovementBudgetFt` | `combat/state/battlefield/battlefield-spatial-movement-modifiers.ts` | Effective movement cap from base speed × attached-aura speed multipliers (current overlap) |
| `applyGridSpawnReplacementFromTarget` | `placement/applyGridSpawnReplacement.ts` | Transfers tactical `placements` from a spawn target to new combatant(s) (replacement / corpse→minion) |
| `hasLineOfSight` | `sight/space.sight.ts` | Binary LoS along supercover segment between cell centers |
| `GridInteractionMode` | `encounter-interaction.types.ts` | `'select-target' \| 'move' \| 'aoe-place' \| 'single-cell-place' \| 'object-anchor-select'` |
