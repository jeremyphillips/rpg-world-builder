---
name: Range and Movement Integration
overview: Populate rangeFt on all combat actions so spatial targeting filters targets by distance, fix character movement speed, implement grid-based movement as a domain mutation, and add movement controls to the encounter UI.
todos: []
isProject: false
---

# Range Targeting and Grid Movement

## Current Gaps

**Range data not flowing into targeting:**

- `CombatActionTargetingProfile.rangeFt` exists and `isValidActionTarget` checks it, but **no adapter populates it**.
- Spells have numeric range in `spell.range` (`{ kind: 'distance', value: { value: 60, unit: 'ft' } }`) but `spell-combat-adapter.ts` only formats it as a display string.
- Monster natural attacks have `reach` in `displayMeta` but not in `targeting`.
- Monster weapon attacks have `weapon.range.normal` but it's only formatted for display.
- Character weapon attacks have **no range data at all** in the pipeline -- `CombatantAttackEntry` has no range field, and `getCharacterAttacks` uses a narrowed weapon type that omits `range`.

**Character movement speed missing:**

- `buildCharacterCombatantInstance` (`[combatant-builders.ts:146-153](src/features/encounter/helpers/combatant-builders.ts)`) does not set `stats.speeds`. Characters get 0 movement.
- `CharacterDetailDto` and `Character` have no `speed` field. 5e walking speed is race-dependent (30ft default) and isn't modeled yet.

**No grid-based movement:**

- `turnResources.movementRemaining` is tracked and displayed in the footer, but there is no way to spend it on grid movement.
- `spendActionCost` in `[action-cost.ts](src/features/mechanics/domain/encounter/resolution/action/action-cost.ts)` deducts `cost.movementFeet` for action costs, but no grid-movement mutation exists.
- `placeCombatant` in `[space.selectors.ts](src/features/encounter/space/space.selectors.ts)` exists but doesn't deduct movement.

---

## Phase A -- Populate `rangeFt` on Combat Actions

**Goal:** Every combat action that has a meaningful range gets `targeting.rangeFt` set so spatial filtering works automatically.

### A1. Spell adapter

In `[spell-combat-adapter.ts](src/features/encounter/helpers/spell-combat-adapter.ts)`, add a helper and wire it into all `buildSpell*Action` functions:

```typescript
function deriveSpellRangeFt(range: SpellRange | undefined): number | undefined {
  if (!range) return undefined
  switch (range.kind) {
    case 'touch': return 5
    case 'distance': return range.value.unit === 'ft' ? range.value.value : undefined
    case 'self':
    case 'sight':
    case 'unlimited':
    case 'special':
      return undefined
  }
}
```

Set `targeting.rangeFt` in `buildSpellTargeting` (or alongside it) for every spell action definition.

### A2. Monster natural attacks

In `[monster-combat-adapter.ts](src/features/encounter/helpers/monster-combat-adapter.ts)`, where natural attacks are built (~line 272):

- Set `targeting: { kind: 'single-target', rangeFt: action.reach ?? 5 }`.
- Same for special actions that use `reach`.
- Note: monster actions build `CombatActionDefinition` directly (not through `CombatantAttackEntry`), so they set `targeting.rangeFt` directly rather than going through `CombatantAttackRange`. This is fine -- `CombatantAttackRange` is for the attack entry pipeline; monster adapters own their action shape.

### A3. Monster weapon attacks

In the same adapter (~line 219), where monster weapon actions are built:

- Melee weapons (no `weapon.range`): `targeting.rangeFt = 5`.
- Ranged weapons: `targeting.rangeFt = weapon.range.normal`.
- Same direct-set pattern as A2.

### A4. Character weapon attacks

This is split into three sub-steps: define the range type, normalize weapon input, and wire into action building.

#### A4a. Define `CombatantAttackRange`

Add to `[combatant.types.ts](src/features/mechanics/domain/encounter/state/types/combatant.types.ts)`:

```typescript
export type CombatantAttackRange =
  | { kind: 'melee'; rangeFt: number }
  | { kind: 'ranged'; normalFt: number; longFt?: number }
```

Add `range?: CombatantAttackRange` to `CombatantAttackEntry`. This carries the full range semantics through the pipeline. Melee includes reach weapons (`rangeFt: 10`). Ranged carries both normal and long range for future disadvantage rules.

#### A4b. Normalize weapon input to `getCharacterAttacks`

The current weapon input shape in `[useCombatStats.ts:55](src/features/character/hooks/useCombatStats.ts)` is a minimal struct:

```typescript
Record<string, { id: string; name: string; type?: string; properties?: string[]; damage?: { default?: string }; damageType?: string }>
```

Rather than widening this to include the raw catalog `range` shape, add a small normalized field that `getCharacterAttacks` actually needs:

```typescript
Record<string, {
  id: string; name: string; type?: string; properties?: string[];
  damage?: { default?: string }; damageType?: string;
  mode?: 'melee' | 'ranged';               // already derivable from type
  normalRangeFt?: number;                   // from Weapon.range.normal
  longRangeFt?: number;                     // from Weapon.range.long
}>
```

The caller (`[useCombatStats.ts](src/features/character/hooks/useCombatStats.ts)`) maps `catalog.weaponsById` into this shape, extracting `mode` from `weapon.type` (or `weapon.category`) and `normalRangeFt`/`longRangeFt` from `weapon.range`. This keeps `getCharacterAttacks` decoupled from the raw catalog schema.

Inside `getCharacterAttacks`, populate `CombatantAttackRange` on each `AttackEntry`:

- `type === 'melee'` or no range: `{ kind: 'melee', rangeFt: 5 }` (reach would be `10`, but defer reach property detection for now).
- `type === 'ranged'` with range data: `{ kind: 'ranged', normalFt: weapon.normalRangeFt, longFt: weapon.longRangeFt }`.
- Thrown weapons with both melee and ranged use: `{ kind: 'ranged', normalFt, longFt }` when thrown, `{ kind: 'melee', rangeFt: 5 }` when used in melee. For now, default to the ranged profile since thrown weapons are primarily ranged in combat.

#### A4c. Wire `buildAttackActions` to set `targeting.rangeFt`

Update `buildAttackActions` in `[combatant-builders.ts](src/features/encounter/helpers/combatant-builders.ts)` to read `attack.range` and set `targeting.rangeFt`:

```typescript
targeting: {
  kind: 'single-target',
  rangeFt: attack.range?.kind === 'ranged'
    ? attack.range.normalFt
    : attack.range?.rangeFt ?? 5,
}
```

For spatial targeting, `rangeFt` uses the normal range (melee reach or ranged normal). Long range with disadvantage is a future concern -- the data is now carried in `CombatantAttackRange.longFt` and ready to be consumed when disadvantage rules are added.

---

## Phase B -- Fix Character Movement Speed

### B1. Add `speed` field

`CharacterDetailDto` and `Character` don't model speed. Two options:

- **Option 1 (quick):** Default all characters to `30` ft walking speed in `buildCharacterCombatantInstance`. This is the 5e baseline for most races. Override later when race-based speed is modeled.
- **Option 2 (data-driven):** Add `speed?: number` to `CharacterDetailDto` and wire it from the character data source.

**Recommendation:** Option 1. Add `stats.speeds = { ground: 30 }` as a hardcoded default in `buildCharacterCombatantInstance`. This unblocks grid movement now and can be refined when race/species modeling is added.

### B2. Wire speed into combatant builder

In `[combatant-builders.ts](src/features/encounter/helpers/combatant-builders.ts)` `buildCharacterCombatantInstance`, add `speeds` to the `stats` block:

```typescript
stats: {
  // ... existing fields ...
  speeds: { ground: 30 },
},
```

`createCombatantTurnResources` in `[shared.ts](src/features/mechanics/domain/encounter/state/shared.ts)` already reads `stats.speeds` via `getCombatantBaseMovement`, so this will automatically populate `turnResources.movementRemaining` with `30`.

---

## Phase C -- Grid-Based Movement Domain Logic

### C1. `moveCombatant` mutation

Create in `[space.selectors.ts](src/features/encounter/space/space.selectors.ts)` (or a new `space.mutations.ts`):

```typescript
function moveCombatant(
  state: EncounterState,
  combatantId: string,
  targetCellId: string,
): EncounterState
```

Logic:

- Look up current cell and target cell.
- Compute distance via `gridDistanceFt`.
- Validate `turnResources.movementRemaining >= distance`.
- Validate target cell is not wall/blocking and not occupied by another combatant.
- Deduct `distance` from `turnResources.movementRemaining` on the combatant.
- Update `placements` to move combatant to new cell.
- Return new state.

5e allows splitting movement around actions (move, attack, move). This works naturally because `moveCombatant` deducts from `movementRemaining` which persists across the turn. No special handling needed.

### C2. Cells-within-distance selector

Add to `[space.selectors.ts](src/features/encounter/space/space.selectors.ts)`:

```typescript
function selectCellsWithinDistance(
  state: EncounterState,
  combatantId: string,
): Set<string>
```

Returns cell IDs within `movementRemaining` Chebyshev distance from the combatant's current cell, excluding walls/blocking and occupied cells.

**Naming intent:** This is `selectCellsWithinDistance` (geometric metric), not `selectPathReachableCells` (path-aware). The distinction matters:

- `selectCellsWithinDistance` -- geometric only, ignores blockers/walls/terrain costs. Sufficient for generated open grids.
- `selectPathReachableCells` -- future: flood-fill or BFS respecting walls, terrain costs, occupancy. Required for authored maps.

### C3. Extend `GridCellViewModel`

Add `isReachable: boolean` to `GridCellViewModel`. `selectGridViewModel` populates it from `selectCellsWithinDistance` when a movement mode flag is active.

### C4. Movement validation helper

```typescript
function canMoveTo(
  state: EncounterState,
  combatantId: string,
  targetCellId: string,
): boolean
```

Single predicate combining distance, movement remaining, cell validity. Used by both the mutation (guard) and the UI (enable/disable).

---

## Phase D -- Movement UI

### D1. Movement mode toggle

Add an interaction mode to the active encounter: `'select-target' | 'move'`. Default is `'select-target'` (current behavior). Add a "Move" button to the footer or as a toggle near the grid.

When the active combatant has `movementRemaining > 0`, the Move button is enabled.

### D2. Grid highlights for movement

When in `'move'` mode:

- Highlight reachable cells using `isReachable` from `GridCellViewModel`.
- Disable target selection click behavior.
- Clicking a reachable cell calls `moveCombatant` and updates encounter state.

### D3. Wire into `EncounterRoute`

- Add `interactionMode` state: `useState<'select-target' | 'move'>('select-target')`.
- Pass mode and `movementRemaining` to the grid and footer.
- `onCellClick` dispatches to either `setSelectedActionTargetId` or movement based on mode.
- After `moveCombatant`, switch back to `'select-target'` mode (or stay in move mode if movement remains).

### D4. Expose `moveCombatant` from the hook

Add `handleMoveCombatant(targetCellId: string)` to `useEncounterState`:

- Calls `moveCombatant(encounterState, activeCombatantId, targetCellId)`.
- Updates `encounterState`.

---

## Phase E -- Documentation

### E1. Space resource doc

Create `[docs/reference/space.md](docs/reference/space.md)` as a living reference for the spatial system. Contents:

1. **Current functionality** -- what the system can do today: square-grid creation, Chebyshev distance, initial placements, range-based target validation, movement spending, grid view model.
2. **Limitations** -- explicit statements of what is intentionally simplified or missing:
  - Distance-based cell selection is geometric only (no walls/terrain costs).
  - `targeting.rangeFt` is a single resolved scalar; no long-range disadvantage, templates, or area targeting.
  - Character speed is hardcoded 30ft; no race/species-based speeds.
  - No opportunity attacks, Disengage, or Dash actions.
  - No pathfinding, LOS, or cover.
  - No large creature footprints beyond the `size` seam.
3. **Long-term risks and architectural notes** -- summarizes the four Risks above plus any future considerations:
  - Catalog-to-attack normalization ownership boundary.
  - Geometric vs path-aware reachability naming convention.
  - Split movement model extensibility.
  - Range scalar vs structured targeting model trajectory.
  - Separation of pathfinding, LOS, and range metric concerns.

This doc is updated as each phase lands, serving as a single source of truth for what the spatial layer does and does not do.

---

## Explicit Non-Goals

- **Pathfinding / obstacle avoidance:** `selectCellsWithinDistance` uses direct Chebyshev distance, not path cost around obstacles. Adequate for open grids; path-aware `selectPathReachableCells` deferred.
- **Difficult terrain cost:** `EncounterCell.movementCost` exists but is not consumed by `moveCombatant` yet. Seam is in place.
- **Opportunity attacks:** Not triggered on movement. The seam exists via `turnHooks` and `reactionAvailable`.
- **Long range disadvantage:** `targeting.rangeFt` uses normal range for filtering. `CombatantAttackRange.longFt` carries the long-range threshold for future disadvantage rules, but the roll modifier is not wired yet.
- **Disengage action:** Not implemented. Would set a flag suppressing opportunity attacks for the turn.
- **Dash action:** Would double `movementRemaining`. Not implemented but `CombatActionCost.movementFeet` exists for future use.
- **Race-based speed:** Hardcoded 30ft for characters. Refined when race/species modeling is added.

## Risks

- `**getCharacterAttacks` input normalization:** `getCharacterAttacks` depends on a normalized weapon attack input contract, not on raw weapon catalog shape. Catalog-to-attack normalization happens at the caller boundary. If the catalog schema changes, only the mapping site updates -- the attack resolver stays stable. To prevent subtle behavioral drift if multiple callers normalize differently, there should be one shared mapper or one shared normalized type with a narrow constructor/helper.
- **Distance-based cell selection without walls:** Current distance-based cell selection (`selectCellsWithinDistance`) is geometric only and ignores blockers, walls, and terrain costs. This is sufficient for generated open grids. Authored maps will require path-aware reachability (`selectPathReachableCells`) and likely LOS-aware targeting as separate concerns. The naming intentionally distinguishes *in-range by metric* from *actually pathable/reachable*, avoiding semantic drift when walls/terrain arrive. These three concerns -- pathfinding, LOS, and range metric -- are easy to accidentally blur together and should remain separate.
- **Split movement edge cases:** 5e split movement is compatible with the current design because `movementRemaining` is tracked as persistent per-turn state. No special phase model is required beyond consistent movement spending and action validation against current position. Future rules logic that layers onto this (forced movement not consuming budget, Dash changing budget, stand-up costing movement, mid-turn speed reduction) does not invalidate the model but will need targeted additions.
- **Range semantics will expand beyond a single scalar:** Initial target validation relies on a single resolved `rangeFt` value for basic within-range checks. This is sufficient for melee reach and standard range validation. Richer targeting modes -- long range disadvantage, reach distinctions, thrown weapon dual ranges, self/touch/cone/line/area templates, minimum range -- will require a more structured targeting model. `CombatantAttackRange` (melee vs ranged) is a first step, but `targeting.rangeFt` on `CombatActionTargetingProfile` should be understood as an intentional simplification, not permanent architecture.

