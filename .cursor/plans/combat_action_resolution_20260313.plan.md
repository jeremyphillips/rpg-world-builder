---
name: Combat Action Resolution
overview: Extend the combat simulation engine so active combatants can choose targets and actions, resolve monster and weapon attacks through shared attack math, consume turn resources without auto-advancing initiative, and emit detailed combat logs while leaving spells as first-pass log-only actions.
todos:
  - id: generalize-attack-proficiency
    content: Update shared attack bonus resolution to support explicit proficiencyLevel and proficiencyBonus inputs with safe creature-wide defaults.
    status: pending
  - id: define-combat-action-model
    content: Introduce executable combat action definitions separate from display attack entries for weapons, monster actions, spells, and future combat effects.
    status: pending
  - id: add-turn-resource-model
    content: Add action, bonus action, reaction, movement, and bonus-action-spell restriction tracking to encounter turn state.
    status: pending
  - id: build-monster-action-builders
    content: Build executable monster action definitions from authored monster weapon, natural, and special action data.
    status: pending
  - id: build-character-weapon-actions
    content: Expose pure character weapon action generation using the same shared attack and damage resolver rules as the combat stats view.
    status: pending
  - id: implement-action-resolution-engine
    content: Resolve selected combat actions against targets, apply hit or miss logic, damage, resource spending, and detailed log events without auto-advancing turns.
    status: pending
  - id: add-simulation-action-ui
    content: Add target and action selection to the active combatant card in the combat simulation route and wire it to manual action resolution.
    status: pending
  - id: add-spell-placeholder-logging
    content: Surface spells in actor action pickers and resolve them as log-only actions using effect text until spell execution rules are defined.
    status: pending
  - id: add-regression-tests
    content: Add tests for proficiency defaults, monster proficiency multipliers, turn resource spending, hit or miss resolution, damage application, spell placeholder logging, and manual turn advance behavior.
    status: pending
isProject: false
---

# Combat Action Resolution

## Goal

Extend the combat simulation so the engine, not the UI, determines whether an attack hits, how much damage it deals, and what turn resources are spent.

Milestone outcome:

- the active combatant can select a target
- the active combatant can select an action
- first-pass executable actions include:
  - monster actions
  - weapon attacks
- spells appear in the action picker but resolve as log-only placeholders
- attack resolution rolls a d20, compares against target AC, applies damage on hit, and logs the result
- action resolution never auto-advances the turn
- `Next Turn` remains the only way to pass initiative
- turn state tracks action, bonus action, reaction, movement, and the bonus-action spell restriction even if not all of it is surfaced in the UI immediately

## Current Foundations

The combat simulation already has:

- a top-level feature at `src/features/combatSimulation/`
- encounter state and turn stepping in `src/features/mechanics/domain/encounter/encounter-state.ts`
- combat logs in `src/features/mechanics/domain/encounter/combat-log.types.ts`
- runtime combatants in `src/features/mechanics/domain/encounter/combatant.types.ts`
- monster display attacks built in `src/features/combatSimulation/helpers/combat-simulation-helpers.ts`
- shared character attack and damage math in `src/features/character/hooks/useCombatStats.ts`
- a combat simulation route and UI structure in `src/features/combatSimulation/routes/CombatSimulationRoute.tsx`

Important shared source:

- `src/features/mechanics/domain/resolution/attack-resolver.ts`
- `src/features/character/hooks/useCombatStats.ts`
- `src/features/character/components/views/CharacterView/sections/CombatStatsCard.tsx`

## Locked Decisions

- turn advance stays manual
- action resolution must not auto-pass initiative
- spells should still appear in actor action lists for first pass
- selecting a spell should only append spell or effect text to the combat log
- first-pass real execution focuses on:
  - monster actions
  - weapon attacks

## Proficiency Rule Update

`resolveWeaponAttackBonus()` currently assumes character progression-driven proficiency. That is now too narrow.

New rule:

- `proficiencyLevel` default is `1`
- `proficiencyBonus` default is `2`
- proficiency contribution is:
  - `proficiencyLevel * proficiencyBonus`

Monster data already uses this shape, for example in `src/features/mechanics/domain/core/rules/systemCatalog.monsters.ts`:

- `proficiencies.weapons[weaponId].proficiencyLevel`
- `mechanics.proficiencyBonus`

Character fallback for now:

- if a character proficiency level is undefined, treat it as `1`
- if character proficiency bonus is otherwise unavailable, default to `2`

Recommendation:

- stop treating proficiency as only a boolean in attack resolution
- update `resolveWeaponAttackBonus()` to accept explicit:
  - `proficiencyLevel?: number`
  - `proficiencyBonus?: number`
- use those values for both characters and monsters

## Recommended Runtime Model

### Combat actions

Do not overload `CombatantAttackEntry` into the execution model.

Keep:

- `CombatantAttackEntry` for display

Add:

- `CombatActionDefinition`
- `CombatActionKind`
- `CombatActionCost`
- `CombatActionResolutionMode`

Suggested first-pass kinds:

- `weapon_attack`
- `monster_action`
- `spell`
- `combat_effect`

Suggested first-pass resolution modes:

- `attack_roll`
- `log_only`

Suggested executable action shape:

- `id`
- `label`
- `kind`
- `cost`
- `resolutionMode`
- optional attack profile:
  - `attackBonus`
  - `attackBreakdown`
  - `damage`
  - `damageType`
  - `damageBreakdown`
- optional `logText`

### Turn resources

Add a turn-resource structure for the active combatant.

Suggested fields:

- `actionAvailable`
- `bonusActionAvailable`
- `reactionAvailable`
- `movementRemaining`
- `hasCastBonusActionSpell`

Reset this state at turn start in the encounter engine.

Rules to enforce now:

- an action can only be spent once unless a future feature grants more
- a bonus action can only be spent once
- if a bonus-action spell is cast, later action spell resolution must be limited to cantrips
- movement should exist in the model even if the UI does not spend it yet

## Engine Work Breakdown

### Slice 1: Generalize attack proficiency

Primary files:

- `src/features/mechanics/domain/resolution/attack-resolver.ts`
- `src/features/character/hooks/useCombatStats.ts`

Tasks:

1. Update `resolveWeaponAttackBonus()` to accept explicit proficiency inputs.
2. Default missing values to:
  - `proficiencyLevel = 1`
  - `proficiencyBonus = 2`
3. Compute proficiency contribution as `proficiencyLevel * proficiencyBonus`.
4. Preserve a readable breakdown for combat tooltips and logs.
5. Keep `useCombatStats()` green after the resolver API change.

Open design choice:

- best long-term option is expanding formula resolution beyond `proficiency: true`
- safer first pass is applying explicit proficiency math in `attack-resolver`

Recommendation:

- use explicit proficiency math in `attack-resolver` for this milestone

### Slice 2: Define executable actions

Primary files:

- `src/features/mechanics/domain/encounter/combatant.types.ts`
- `src/features/mechanics/domain/encounter/index.ts`
- new `src/features/mechanics/domain/encounter/combat-actions.types.ts`

Tasks:

1. Introduce executable action types.
2. Extend `CombatantInstance` to hold `actions`.
3. Keep display attacks intact for existing UI.

### Slice 3: Turn resource model

Primary files:

- `src/features/mechanics/domain/encounter/combatant.types.ts`
- `src/features/mechanics/domain/encounter/encounter-state.ts`

Tasks:

1. Add turn resource state.
2. Reset it at turn start.
3. Keep turn advancement manual.
4. Ensure future action resolution can mutate resources without moving initiative.

### Slice 4: Monster executable actions

Primary files:

- `src/features/combatSimulation/helpers/combat-simulation-helpers.ts`
- or preferably a new engine-side builder module under `encounter`

Tasks:

1. Build executable monster actions from:
  - weapon actions
  - natural attacks
  - authored special attacks
2. For monster weapon actions, read:
  - `proficiencyLevel`
  - `proficiencyBonus`
3. For natural or special actions with explicit authored `attackBonus`, use authored values first in initial implementation.

Recommendation:

- treat authored special or natural attack bonuses as canonical in first pass
- only shared-rule-drive weapon actions initially

### Slice 5: Character weapon executable actions

Primary files:

- `src/features/character/hooks/useCombatStats.ts`
- new pure character combat action builder, likely under:
  - `src/features/character/domain/engine/`
  - or `src/features/mechanics/domain/encounter/`

Tasks:

1. Reuse the same shared attack and damage resolver path already used for combat stats.
2. Expose pure weapon action builders that do not depend on React hooks.
3. Pass explicit or defaulted character proficiency values into the shared resolver.

Important:

- `CombatStatsCard` is a reference for output and breakdowns
- `useCombatStats()` is the real mechanical source to generalize

### Slice 6: Action resolution engine

Primary files:

- new `src/features/mechanics/domain/encounter/action-resolution.ts`
- `src/features/mechanics/domain/encounter/encounter-state.ts`
- `src/features/mechanics/domain/encounter/combat-log.types.ts`

Suggested APIs:

- `getCombatantAvailableActions(state, actorId)`
- `resolveCombatAction(state, { actorId, targetId, actionId })`
- `canSpendActionCost(resources, cost)`

First-pass resolution behavior:

1. validate actor, target, and action
2. validate turn resources
3. resolve hit or miss if action uses `attack_roll`
4. apply damage on hit
5. spend action or bonus action cost
6. append detailed log events
7. return updated state only

Do not:

- auto-advance turn

### Slice 7: Simulation UI

Primary files:

- `src/features/combatSimulation/components/CombatSimulationCards.tsx`
- `src/features/combatSimulation/components/CombatSimulationPanels.tsx`
- `src/features/combatSimulation/routes/CombatSimulationRoute.tsx`

Tasks:

1. On the active combatant card, add:
  - target selector
  - action selector
  - resolve button
2. Only show valid opposing targets.
3. Disable actions when the required turn resource is spent.
4. Keep the existing `Next Turn` control as the manual turn advance.

### Slice 8: Spell placeholder actions

Primary files:

- action builder modules
- `action-resolution.ts`

Tasks:

1. Include spells in actor action pickers.
2. Mark them as `log_only`.
3. On resolution, append a combat log entry using:
  - joined `effects[].text`
  - or a fallback spell label if needed
4. Spend the correct action cost if defined.
5. Do not apply attack rolls, saves, HP changes, or structured spell execution yet.

## Logging Requirements

Add or extend log events to capture:

- action declared
- action resolved
- attack hit
- attack missed
- damage applied
- spell logged
- optional turn-resource-spent note

Each attack resolution should log:

- actor
- target
- action label
- raw d20 roll
- final roll total
- target AC
- hit or miss
- damage roll expression
- damage dealt
- remaining HP if practical

Spell placeholder logs should capture:

- actor
- target if chosen
- spell label
- `effects[].text`

## Tests

Recommended coverage:

### Shared resolver tests

- defaults `proficiencyLevel` to `1`
- defaults `proficiencyBonus` to `2`
- uses `proficiencyLevel * proficiencyBonus`
- preserves expected character attack bonus behavior
- supports monster weapon proficiency multipliers

### Encounter or action tests

- action spend blocks repeated use in the same turn
- bonus action spend is tracked
- turn does not auto-advance after action resolution
- hit subtracts HP
- miss does not subtract HP
- monster weapon action resolves from shared or authored data correctly
- spell placeholder adds log text and no HP change

### Regression tests

- existing encounter timing and hook tests remain green

## Proposed Implementation Order

1. Generalize proficiency handling in `attack-resolver`.
2. Keep `useCombatStats()` and combat stats view output consistent.
3. Add executable combat action types.
4. Add turn resource state and reset rules.
5. Build monster executable actions.
6. Implement `resolveCombatAction()` for attack-roll actions.
7. Add minimal active-turn action UI in combat simulation.
8. Build character weapon executable actions.
9. Add spell placeholder logging actions.

## Success Criteria

The first milestone is complete when:

- an active monster or weapon-using combatant can choose a target
- the actor can choose an action
- the engine rolls to hit against target AC
- damage is rolled and applied on hit
- the log records method, roll result, hit or miss, and damage
- the action resource is consumed
- the turn stays on the same combatant until the user manually clicks `Next Turn`

