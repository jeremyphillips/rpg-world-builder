# Spatial System Reference

## 1. Purpose and Scope

The spatial system adds tactical grid-based positioning to encounters. It answers three core questions:

- **Where are combatants?** Cell-based placement on a square grid.
- **Is a target in range?** Chebyshev distance check against action `rangeFt`.
- **Can a combatant move there?** Shortest-path movement cost from `movementRemaining` (king-adjacency BFS — not the same as range or LoS).

The system is intentionally separate from narrative `Location` content. Locations describe fictional places; encounter spaces define tactical geometry.

**Conceptual split (see also §6):**

- **Authored vocabulary** — e.g. `LocationPlacedObjectKindId` in location map content (what authors place).
- **Runtime grid objects** — `GridObject` on `EncounterSpace.gridObjects`: blocking, LoS, cover, `isMovable`, and **`authoredPlaceKindId`** (`LocationPlacedObjectKindId`) from authored map hydration only.
- **Edges and boundaries** — `EncounterEdge`, `EncounterCell.kind` (e.g. `wall`), and `EncounterAuthoringPresentation.edgeEntries` (walls / doors / windows as presentation); not folded into `GridObject` unless a future feature explicitly bridges them.
- **Authored map object presentation** — icons and fills from location map authoring, carried on `EncounterAuthoringPresentation` (`authoredObjectRenderItems`, cell/region fills). Derived in `shared/domain` as `LocationMapAuthoredObjectRenderItem[]` (`deriveLocationMapAuthoredObjectRenderItems`). **Not** the same as runtime `GridObject` or tactical obstacle glyphs on `GridCellViewModel`.

## 2. Directory Layout

```
packages/mechanics/src/combat/space/
├── index.ts                        # Public barrel
├── space.types.ts                  # EncounterSpace, EncounterCell, GridObject, CombatantPosition, …
├── gridObject/                     # Default/spec helpers for runtime object behavior (procedural + authored kinds)
├── space.helpers.ts                # Cell/distance/occupancy; getEncounterGridObjects, find/move grid objects
├── creation/                       # Space factories
├── placement/                      # Placements, spawn replacement, applyGridSpawnReplacement
├── rendering/                      # Grid occupant token presentation
├── selectors/                      # State-level selectors, GridViewModel, movement
├── sight/                          # Supercover line + hasLineOfSight, cellBlocksSight (raw), cellOpaqueToSight
├── spatial/                        # Edge segment crossing; movement BFS (reachability, shortest path ft)
└── __tests__/                      # Mirrors creation, placement, rendering, selectors, sight, `spatial/` regression tests (+ space.helpers.test)
```

## 3. Current Functionality

### Grid creation

`createSquareGridSpace` generates a rectangular `EncounterSpace` with mode `'square-grid'`, a configurable `cellFeet` scale (default 5ft), and `width * height` cells. Each cell has an `(x, y)` coordinate and a string `id` of the form `c-{x}-{y}`.

**Placed objects on the grid** come only from **authored location maps**: `buildEncounterSpaceFromLocationMap` / `buildGridObjectsFromLocationMapCellEntries` produce **`GridObject`** rows with **`authoredPlaceKindId`** and runtime fields from **`resolveLocationPlacedObjectKindRuntimeDefaults`**. Fallback encounter spaces (`createSquareGridSpace` without a map) have **no** `gridObjects` unless something else populates them.

**Reading placed objects:** Use **`getEncounterGridObjects(space)`** in `space.helpers.ts`. It returns **`EncounterSpace.gridObjects`** (or an empty array when absent).

**Object-anchored effects:** Attached emanations with **`anchorMode === 'object'`** store **`BattlefieldEffectAnchor`** `{ kind: 'object', objectId }` where **`objectId`** is a **`GridObject.id`**. **`resolveBattlefieldEffectOriginCellId`** uses the live object position (**`findGridObjectById`**). **`moveGridObjectInEncounterState`** applies a cell move and runs **`reconcileBattlefieldEffectAnchors`**.

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

`selectGridViewModel` flattens `EncounterSpace` + `CombatantPosition[]` into a flat `GridCellViewModel[]` for UI rendering. Each cell carries **`isActive`**, **`isSelectedTarget`**, **`isWithinSelectedActionRange`** (Chebyshev distance from the active combatant to that cell within the selected action’s `rangeFt` — distance only, not full targeting validity), **`isLegalTargetForSelectedAction`**, **`isHostileLegalTargetForSelectedAction`**, **`isHostileSelectedTargetPulse`**, and **`isReachable`**, plus **`placedObjectKind`** and **`placedObjectVisual`** (from **`resolvePlacedObjectCellVisualFromPlacedKind`**) when **`getEncounterGridObjects`** reports an object on that cell. **`placedObjectKind`** is the authored **`LocationPlacedObjectKindId`**; **`placedObjectVisual`** carries label, tooltip, and icon token for **`PlacedObjectCellVisualDisplay`**. Token styling uses **`occupantIsDefeated`** (dimmed token when HP ≤ 0) and **`occupantRendersToken`**: the avatar/token is drawn only when the occupant has **battlefield presence** (see below). The active encounter grid uses **token-first** emphasis (rings, pulses) for turn and targeting; it does **not** apply a full-board tint for “in range” distance.

The `showReachable` option is driven by movement budget (`movementRemaining > 0`) and UI mode (movement highlights are suppressed during AoE origin placement) so reachable cells can highlight without an explicit movement mode.

**Movement rejection helper:** `getMoveRejectionReason(state, combatantId, targetCellId)` returns short labels for illegal hover / status text: **`Terrain blocked`** (destination cell not enterable), **`No path`** (no legal route with the graph rules), **`Out of range`** (shortest path exists but exceeds `movementRemaining`), **`Cell occupied`**. UI may map **`Terrain blocked`** to a generic “Blocked” string.

**Grid hover status:** `deriveGridHoverStatusMessage` (encounter helpers) composes a single line for illegal hover (movement, creature targeting, or invalid AoE origin) to show under the encounter header.

### Cross-space scene transitions

Stairs today; future **doors**, **portals**, or other one-shot space swaps can follow the same client pattern.

Some intents **replace the entire tactical `EncounterSpace`** in one apply — e.g. **`stair-traversal`** (`CombatIntent` in `packages/mechanics`) moves the active combatant to a resolved **`destinationEncounterSpace`** on another floor. Mechanically this is still a single **`applyCombatIntent`** step; there is no separate async “hydration phase” in the client handler today.

**Client UX:** Active encounter play (**`useEncounterActivePlaySurface`**) may show a short, **non-dismissible** transition overlay — **`EncounterSceneTransitionModal`** (`src/features/encounter/components/active/modals/EncounterSceneTransitionModal.tsx`) — while that swap runs. It wraps **`AppModal`** with no close button, backdrop dismiss, or Escape dismiss; copy is generic (“Changing scene” + destination subtitle + optional detail). Stairs wiring supplies detail at the orchestration layer; the component stays **kind-agnostic** so other transition kinds can reuse it later. Because the underlying apply is **synchronous**, the handler **defers** work with **`setTimeout(..., 0)`** so React can paint the modal before state updates clear it.

See also: [Combat grid vs encounter orchestration](../combat/client/grid.md), [GameSession and combat § Shared active play shell](../combat/game-session.md#shared-active-play-shell).

**Grid cell visuals:** The tactical grid is rendered by **`CombatGrid`** (`src/features/combat/components/grid/CombatGrid.tsx`). Active encounter play wires it from **`useEncounterActivePlaySurface`**; `src/features/encounter/components/index.ts` may re-export **`CombatGrid` as `EncounterGrid`** as an alias only. Cell fill and movement outlines come from `getCellVisualState` and `getCellVisualSx` in `src/features/combat/components/grid/cellVisualState.ts` and `cellVisualStyles.ts`. **Overlay precedence** (highest first): blocked tile → placement (invalid hover, selected, cast-range band) → AoE (invalid origin hover, locked origin, area template) → **AoE cast-range band** (cells within spell cast distance when no higher-priority AoE tint applies) → default paper. **Movement** (reachable border / green fill / illegal-move hover) is applied after that stack. The AoE cast-range band is modeled as a first-class overlay kind; its style entry uses the same paper fill as open ground (matching prior behavior) while still participating in precedence so **movement fill suppression** on those cells is explicit in the resolver, not a separate ad hoc suppression flag in the component. Persistent auras or emanations can extend the same overlay list later.

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
- **Edges:** Consecutive cells on the path are checked with **`segmentSightBlocked`** (`spatial/edgeCrossing.ts`). Orthogonal steps use the edge between the two cells (if absent, the boundary is open). **Diagonal** steps use a **strict corner rule for rays**: sight is blocked if **either** supporting orthogonal segment would block sight. **Movement** diagonals do **not** use this rule — they use **orthogonal decomposition** in `movementReachability.ts` (see §3 Movement). **Window** example: an edge may set **`blocksMovement: true`** and **`blocksSight: false`** (blocks walking through the sill, not the sight line).
- **API:** `hasLineOfSight(space, fromCellId, toCellId)`; `traceLineOfSightCells` is mainly for tests and debugging. Raw flag read: **`cellBlocksSight`**; composed interior: **`cellOpaqueToSight`**.
- **Targeting:** `canSeeForTargeting` delegates to `canPerceiveTargetOccupantForCombat` (`visibility/combatant-pair-visibility.ts`): condition-based sight (e.g. blinded, invisible), `lineOfSightClear` → `hasLineOfSight` when a grid exists, then **occupant** visibility from `perception.resolve.ts` (heavy obscurement, magical darkness, etc.). **Cover** for attack modifiers is still separate; binary LoS here does not replace perception’s “can you see the creature in that cell?”

### Movement

`moveCombatant` validates distance and movement budget, deducts from `turnResources.movementRemaining`, and updates placements. 5e split movement (move-attack-move) works naturally since `movementRemaining` is persistent per-turn state.

**Optional battlefield spell context:** When the caller passes **`BattlefieldSpellContext`** (`spellLookup`, optional **`suppressSameSideHostile`**) as the fourth argument, movement is reconciled against **effective ground speed** for the combatant’s **current** cell after each step:

- **`getEffectiveGroundMovementBudgetFt`** (`packages/mechanics/src/combat/state/battlefield/battlefield-spatial-movement-modifiers.ts`) applies **`floor(baseSpeed × product)`**, where the product comes from overlapping **attached sphere auras** (`EncounterState.attachedAuraInstances`) whose spells define **`modifier`** effects with **`target: 'speed'`** and **`mode: 'multiply'`** (e.g. Spirit Guardians `0.5`). Overlap uses the same geometry as aura rendering; the aura **source** and **`unaffectedCombatantIds`** are skipped; defeated combatants and same-side suppression follow **`battlefield-attached-aura-shared`** rules.
- **`turnContext.movementSpentThisTurn`** accumulates feet moved; after each move, **`movementRemaining = max(0, effectiveMax − spent)`** so entering or leaving an aura mid-turn updates the budget without double-counting.

When no context is passed, **`movementRemaining`** is reduced by the **shortest legal path length in feet** (`minMovementCostFtToCell`), not Chebyshev distance alone — going around a wall costs more than a straight-line metric when the direct segment is blocked.

Turn start resets movement via **`createCombatantTurnResources`** in **`shared.ts`**: when **`advanceEncounterTurn`** / **`createEncounterState`** supply spell lookup (same object shape as interval resolution), the initial **`movementRemaining`** uses the same **effective** budget for the combatant’s position at turn start.

**Movement reachability (not LoS):** **`spatial/movementReachability.ts`** performs **breadth-first search** over **king-adjacent** cells (8 directions). **Orthogonal** steps: **`cellMovementBlockedForEntering`** on the destination cell, and the crossed **`EncounterEdge`** must not have **`blocksMovement`** (via **`orthogonalMovementEdgeBlocked`**). **Diagonal** steps: legal only if **at least one** of the two orthogonal two-step routes **`from → orth1 → to`** or **`from → orth2 → to`** is fully legal (each leg uses the same orthogonal rules; the intermediate cell must not be occupied by another token). This allows routing around corners when a real two-step path exists, and blocks “cutting through” wall-separated areas when **neither** decomposition is legal. **`segmentMovementBlocked`** in `edgeCrossing.ts` is **orthogonal-only** — diagonal **walking** is **not** decided by a single coarse edge test from `from`.

**API contract (do not bypass):** use **`movementStepLegal`** for one king-step; **`minMovementCostFtToCell`** for shortest cost / existence; **`cellsReachableWithinMovementBudget`** for reachable highlights. **`selectCellsWithinDistance`**, **`canMoveTo`**, and **`moveCombatant`** go through these primitives.

**`minMovementCostFtToCell`** returns the **shortest** route cost in feet (each orthogonal or diagonal step costs one **`cellFeet`**). **`cellsReachableWithinMovementBudget`** collects all cells reachable within **`movementRemaining`**. **`selectCellsWithinDistance`** and **`canMoveTo`** use this BFS; **`moveCombatant`** deducts the shortest-path cost. **`placeCombatant`**, **`isValidSingleCellPlacementPick`**, **`validateSingleCellPlacement`**, and **`isValidAoeOriginCell`** still use **`cellMovementBlockedForEntering`** only for destination validity (not graph search).

Regression coverage for movement vs LoS edge cases lives in **`__tests__/spatial/spatial-movement-los-regression.test.ts`** (and related `movementReachability` / `sight` tests).

**Transitional source-of-truth:** resolution still reads **`EncounterCell`** flags (e.g. `blocksMovement`, `blocksSight`, `kind`), **`GridObject`** on **`EncounterSpace.gridObjects`**, and **`EncounterEdge`**. Denormalized cell flags are **compatibility** inputs from some legacy/hydration paths — they are not documented as the sole long-term authority when edges or grid objects also describe the same feature.

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
| `EncounterSpace` | `space.types.ts` | Grid definition: cells, optional **`gridObjects`**, scale, dimensions |
| `GridObject` | `space.types.ts` | Runtime placed object (authored map only): `cellId`, blocking / LoS / `coverKind`, **`isMovable`**, **`authoredPlaceKindId`** |
| `GridObjectAuthoredKindId` | `space.types.ts` | Alias of **`LocationPlacedObjectKindId`** — kind key for grid VM / labels |
| `EncounterCell` | `space.types.ts` | Single cell: position, kind, terrain tags |
| `CombatantPosition` | `space.types.ts` | Links combatant to cell |
| `CombatantAttackRange` | `combatant.types.ts` | Discriminated union: melee (rangeFt) or ranged (normalFt, longFt) |
| `GridCellViewModel` | `selectors/space.selectors.ts` | UI-ready cell with highlight flags; includes **`occupantRendersToken`**, **`occupantIsDefeated`**, **`placedObjectKind`** / **`placedObjectVisual`** (from grid objects) |
| `GridViewModel` | `selectors/space.selectors.ts` | Complete grid for rendering |
| `getEncounterGridObjects` | `space.helpers.ts` | **`EncounterSpace.gridObjects`** (or empty) |
| `placeCombatant` | `selectors/space.selectors.ts` | Authoritative placement update: filter prior row, append `{ combatantId, cellId }` for passable cells |
| `moveCombatant` | `selectors/space.selectors.ts` | Validates move; updates `movementRemaining` and `placements`; optional 4th arg **`BattlefieldSpellContext`** for spatial speed reconciliation |
| `moveGridObjectInEncounterState` | `auras/battlefield-effect-anchor-reconciliation.ts` | Moves a grid object and runs **`reconcileBattlefieldEffectAnchors`** |
| `getEffectiveGroundMovementBudgetFt` | `combat/state/battlefield/battlefield-spatial-movement-modifiers.ts` | Effective movement cap from base speed × attached-aura speed multipliers (current overlap) |
| `applyGridSpawnReplacementFromTarget` | `placement/applyGridSpawnReplacement.ts` | Transfers tactical `placements` from a spawn target to new combatant(s) (replacement / corpse→minion) |
| `hasLineOfSight` | `sight/space.sight.ts` | Binary LoS along supercover segment between cell centers |
| `movementStepLegal` | `spatial/movementReachability.ts` | One king-step; diagonal requires legal orthogonal decomposition |
| `minMovementCostFtToCell` | `spatial/movementReachability.ts` | Shortest-path feet; `undefined` if unreachable |
| `cellsReachableWithinMovementBudget` | `spatial/movementReachability.ts` | BFS reachable set within budget |
| `segmentSightBlocked` | `spatial/edgeCrossing.ts` | Edge-based sight segment (strict diagonal for rays) |
| `orthogonalMovementEdgeBlocked` | `spatial/edgeCrossing.ts` | Movement blocked on one orthogonal edge crossing |
| `getMoveRejectionReason` | `selectors/space.selectors.ts` | `Terrain blocked` / `No path` / `Out of range` / `Cell occupied` |
| `GridInteractionMode` | `encounter-interaction.types.ts` | `'select-target' \| 'move' \| 'aoe-place' \| 'single-cell-place' \| 'object-anchor-select'` |
| `EncounterAuthoringPresentation` | `space.types.ts` | Serialized **presentation-only** authored map: paths, edges, cell/region fills, **`authoredObjectRenderItems`** (optional). Ignored by combat resolution. |
| `LocationMapAuthoredObjectRenderItem` | `shared/domain/locations/map/locationMapAuthoredObjectRender.types.ts` | One cell-anchored authored object for display; derived from map `cellEntries`. |
