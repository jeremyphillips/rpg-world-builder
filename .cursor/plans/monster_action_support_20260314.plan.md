---
name: Monster Action Support
overview: Extend the encounter engine from simple monster attacks into broader monster action execution, prioritizing authored special actions, save branches, composite multiattacks, movement-driven actions, persistent monster state, and the hardest outlier effects already present in `systemCatalog.monsters.ts`.
todos:
  - id: inventory-current-capabilities
    content: Audit which monster action fields already resolve in the encounter engine and identify the remaining unsupported authored payloads.
    status: pending
  - id: normalize-monster-action-runtime-shape
    content: Expand executable monster action definitions so attack, save, movement, area, sequence, recharge, and usage metadata can be represented without overloading log-only fallbacks.
    status: pending
  - id: implement-save-and-branch-resolution
    content: Resolve special monster actions that use saving throws, onFail/onSuccess branches, and half-damage-on-save behavior.
    status: pending
  - id: implement-on-hit-and-post-hit-effects
    content: Apply authored on-hit effects for natural and special monster attacks, including extra damage, conditions, states, notes, and death outcomes.
    status: pending
  - id: implement-sequence-and-composite-actions
    content: Support composite actions like Multiattack consistently, including dynamic counts driven by tracked monster state.
    status: pending
  - id: implement-movement-and-targeting-effects
    content: Add first-pass resolution for monster actions that move the source, move targets, target areas, or interact with containment or forced movement rules.
    status: pending
  - id: implement-persistent-monster-state
    content: Generalize runtime support for tracked parts, regrowth, spawned entities, form state, and other monster-specific persistent effect state.
    status: pending
  - id: implement-reaction-recharge-and-uses
    content: Model extra reactions, opportunity-only reactions, recharge gates, and limited-use monster actions.
    status: pending
  - id: integrate-contextual-traits
    content: Connect action resolution with contextual trait modifiers like Pack Tactics, Ooze Cube action modifiers, and manual monster trigger context.
    status: pending
  - id: add-logging-and-regression-coverage
    content: Add detailed logs and tests for outlier monster actions so authored catalog behavior stays stable as support expands.
    status: pending
isProject: false
---

# Monster Action Support

## Goal

Support the authored monster action surface in `src/features/mechanics/domain/core/rules/systemCatalog.monsters.ts` beyond simple attack rolls and log-only placeholders.

Milestone outcome:

- monster special actions can resolve save branches, area targeting, and on-hit riders
- composite actions like `Multiattack` work consistently across simple and dynamic-count monsters
- movement-based actions and persistent monster states have explicit runtime support
- the encounter engine can express major authored monster outliers without relying on per-monster hardcoding
- the hardest catalog outliers are documented so implementation order follows real data complexity

## Current Foundations

The encounter engine already has:

- executable monster action definitions in the combat simulation helpers
- shared resolver math for monster weapon attacks
- authored-only natural and special attack math for monster actions
- sequence support for composite actions
- first-pass tracked part runtime state and hydra-style regrowth behavior
- turn hooks, timed effects, conditions, states, and manual trigger context
- basic attack-roll resolution and log-only action resolution

What is still missing for broader monster action coverage:

- save-based action execution
- branch payload resolution for `onFail` and `onSuccess`
- on-hit rider execution for natural and special attacks
- movement and area execution
- recharge and limited-use enforcement
- extra reaction modeling
- support for many custom or context-sensitive outliers

## Action Capability Matrix

Monster action fields already authored in the catalog:

- `attackBonus`
- `damage` and `damageBonus`
- `onHitEffects`
- `save`
- `onFail`
- `onSuccess`
- `halfDamageOnSave`
- `area`
- `target`
- `movement`
- `sequence`
- `recharge`
- `uses`
- `effects`

Recommended rule:

- keep using shared math for `weapon` actions unless equipment authors an explicit override
- keep using authored `attackBonus` and `damageBonus` for `natural` and `special` actions
- do not apply external resolver math to natural or special actions unless the authored data explicitly calls for it in a future model update

## Challenging Outliers

### Save and branch actions

- `Mummy / Dreadful Glare`
  - save-based action with `onFail` condition application and `onSuccess` immunity
  - requires source-action immunity tracking over time
- `Gelatinous Cube / Engulf`
  - save branches with damage on both fail and success
  - has `halfDamageOnSave`, movement, and persistent engulf state
- `Young Red Dragon / Fire Breath`
  - area save, half damage on success, and recharge gating

### On-hit rider actions

- `Wolf / Bite`
  - attack hit followed by save-gated prone effect
- `Mummy / Rotting Fist`
  - hit plus extra damage, persistent state, interval effect, and death outcome
- `Young Red Dragon / Rend`
  - hit plus extra typed damage rider
- `Bugbear / Grab`
  - special attack with grapple application on the branch payload

### Composite and dynamic-count actions

- `Mummy / Multiattack`
  - mixed sequence of attack and save-based child actions
- `Troll / Multiattack`
  - repeated natural attack sequence
- `Hydra / Multiattack`
  - sequence count depends on current tracked-part state, not a fixed static number

### Movement-heavy actions

- `Troll / Charge`
  - bonus action that spends movement and has directional targeting intent
- `Gelatinous Cube / Engulf`
  - action-driven movement, no opportunity attacks, enters creature spaces, and target selection during movement
- `Bugbear / Abduct`
  - contextual movement rule that modifies how grappling movement is paid

### Persistent monster-state outliers

- `Hydra / Multiple Heads`
  - tracked parts with severing threshold, death at zero heads, regrowth suppression by fire, and healing on regrowth
- `Hydra / Reactive Heads`
  - extra reactions derived from current tracked part count
- `Troll / Loathsome Limbs`
  - tracked part severing plus spawn plus custom resource mapping
- `Mimic / Shape Shift`
  - form changes that interact with other traits and action availability

### Trait or context-modified actions

- `Wolf / Pack Tactics`
  - attack modifier depends on allied positioning and target context
- `Gelatinous Cube / Ooze Cube`
  - custom action modifier for `Engulf` when a creature enters the cube's space
- `Zombie / Undead Fortitude`
  - reduced-to-0 exception flow with custom save blockers

### Known custom escape hatches

These are currently the most likely places where the canonical engine will still need explicit follow-up design:

- `monster.save_exception`
- `monster.action_modifier`
- `monster.resource_from_tracked_parts`

## Recommended Implementation Order

### Phase 1: Inventory and runtime normalization

1. Inventory every monster action field currently authored in the catalog.
2. Expand `CombatActionDefinition` to represent save, branch, area, movement, recharge, and usage data directly.
3. Keep the runtime model generic enough that monster actions do not need one-off hardcoded branches unless they use explicit custom effect ids.

### Phase 2: Save and branch execution

1. Implement a shared special-action resolver for:
   - `save`
   - `onFail`
   - `onSuccess`
   - `halfDamageOnSave`
2. Decide first-pass target model for:
   - one target
   - all creatures in area
   - creatures entered during move
3. Log save DC, save branch taken, and resulting HP or state changes.

### Phase 3: On-hit effect execution

1. Extend attack-roll resolution so natural and special actions can apply `onHitEffects`.
2. Support at least:
   - extra `damage`
   - `condition`
   - `state`
   - `note`
   - `death_outcome`
3. Keep interval and long-duration effect modeling shallow at first if they only need logging.

### Phase 4: Composite actions

1. Generalize `sequence` support for:
   - repeated child attacks
   - mixed child action types
   - state-derived counts
2. Make sequence logs readable enough to distinguish parent action declaration from child action resolution.

### Phase 5: Movement and targeting

1. Add first-pass action-side movement execution.
2. Support forced movement and relocation payloads where already authored.
3. Decide how far to go on boardless targeting:
   - likely log intent plus mutate only what the engine can currently prove

### Phase 6: Persistent monster state

1. Expand tracked-part support beyond hydra basics.
2. Add first-pass support for:
   - `tracked_part` change payloads
   - `spawn`
   - `form`
   - containment-linked state
3. Keep unsupported payloads explicit in logs instead of silently dropping them.

### Phase 7: Resource and gate enforcement

1. Enforce `recharge`.
2. Enforce `uses`.
3. Support `extra_reaction` and opportunity-only reaction pools.
4. Ensure action availability UI reflects these restrictions.

### Phase 8: Contextual modifiers and custom hooks

1. Integrate contextual trait modifiers into action resolution.
2. Define a stable interface for custom monster effect ids that cannot yet be canonicalized.
3. Prefer converting repeated custom ids into first-class canonical effects over time.

## Logging Requirements

Each monster action resolution should log enough to answer:

- what action was declared
- whether it was an attack roll, save-based action, sequence, or movement action
- which branch resolved
- what HP, states, or conditions changed
- what runtime monster state changed
  - tracked heads
  - severed limbs
  - form changes
  - spawned entities

Outlier logs should especially capture:

- sequence expansion counts
- tracked-part sever and regrowth counts
- save success or fail branch
- recharge or uses blocked state
- custom effect ids when canonical support is not yet implemented

## Testing

Recommended coverage:

### Save and branch actions

- `Dreadful Glare` fail applies frightened until the right turn boundary
- `Dreadful Glare` success applies source-action immunity
- `Fire Breath` applies half damage on successful save
- `Engulf` takes correct success and fail branches

### On-hit actions

- `Wolf Bite` applies prone on failed save
- `Rotting Fist` applies necrotic damage and mummy rot state
- `Rend` can add extra elemental rider damage

### Composite actions

- static `Multiattack` executes the expected child count
- mixed `Multiattack` resolves different child action kinds in order
- hydra `Multiattack` uses current head count

### Persistent state

- hydra head severing and regrowth
- fire suppression blocks hydra regrowth
- troll severed limb payload logs or mutates tracked state correctly
- mimic form state changes influence form-gated traits

### Resource gates

- recharge-gated actions stay unavailable until recharged
- limited-use actions decrement and block
- extra reaction counts derive from tracked parts correctly

## Success Criteria

This plan is complete when:

- the common monster action fields in `systemCatalog.monsters.ts` have clear runtime behavior
- outlier actions no longer silently collapse to generic notes unless explicitly marked as unsupported
- the engine can resolve representative examples for:
  - save action
  - on-hit rider
  - sequence multiattack
  - movement action
  - tracked-part monster
  - form-changing monster
- the remaining unsupported monster effects are documented as explicit custom follow-up work
