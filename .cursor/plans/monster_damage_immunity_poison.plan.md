---
name: ""
overview: ""
todos: []
isProject: false
---

# Monster poison immunity vs Poison Spray damage

## Intended wiring (already in codebase)

1. **Stat block → combatant** — `[partitionMonsterImmunities](src/features/encounter/helpers/combatant-builders.ts)` splits `monster.mechanics.immunities` into:
  - **Damage immunity markers** — entries that are **not** an `EffectConditionId` and **not** in `CONDITION_IMMUNITY_ONLY_IDS` (e.g. `exhaustion`).
  - For zombies, `**"poison"`** is **not** the condition id `poisoned` (only `poisoned` is in `[EFFECT_CONDITION_IDS](src/features/mechanics/domain/conditions/effect-condition-definitions.ts)`), so `**poison` becomes** a `[DamageResistanceMarker](src/features/mechanics/domain/encounter/state/types/combatant.types.ts)` with `level: 'immunity'`, `damageType: 'poison'`, id `monster-immunity-poison`, merged into `damageResistanceMarkers` in `[buildMonsterCombatantInstance](src/features/encounter/helpers/combatant-builders.ts)`.
2. **Damage application** — `[applyDamageToCombatant](src/features/mechanics/domain/encounter/state/damage-mutations.ts)` calls `[getDamageAfterResistance](src/features/mechanics/domain/encounter/state/resistance-mutations.ts)` with `options.damageType` and the target’s markers. If `damageType` is **missing**, `[getDamageAfterResistance](src/features/mechanics/domain/encounter/state/resistance-mutations.ts)` returns **full damage** (`applied: null`) — **no immunity check**.
3. **Poison Spray** — `[buildSpellAttackAction](src/features/encounter/helpers/spell-combat-adapter.ts)` sets `attackProfile.damageType` from `[findSpellDamageEffect](src/features/encounter/helpers/spell-combat-adapter.ts)` (first `damage` effect). `[cantrips-m-z.ts](src/features/mechanics/domain/rulesets/system/spells/data/cantrips-m-z.ts)` defines `damageType: 'poison'` on that effect. `[action-resolver.ts](src/features/mechanics/domain/encounter/resolution/action/action-resolver.ts)` passes `damageType: action.attackProfile?.damageType` into `applyDamageToCombatant` on a hit.

So **on paper**, a zombie built through `**buildMonsterCombatantInstance`** should take **0** from a resolved Poison Spray hit when `**damageType`** is `**poison`**.

## Why it might still show damage (hypotheses to verify)


| Hypothesis                              | What to check                                                                                                                                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A. `damageType` not passed**          | Breakpoint/log on `applyDamageToCombatant` for spell attacks: `options.damageType` must be `'poison'`. If `undefined`, immunity is skipped.                                                                              |
| **B. Combatant missing innate markers** | Opponent not created via `[buildMonsterCombatantInstance](src/features/encounter/helpers/combatant-builders.ts)` / merged state drops `damageResistanceMarkers`. Inspect `target.damageResistanceMarkers` before damage. |
| **C. Manual / alternate damage path**   | `[useEncounterState](src/features/encounter/hooks/useEncounterState.ts)` `handleApplyDamage` passes `damageType: damageTypeInput.trim()                                                                                  |
| **D. String mismatch**                  | Unlikely if both use lowercase `poison`; confirm spell and marker use same normalization (`[getDamageAfterResistance](src/features/mechanics/domain/encounter/state/resistance-mutations.ts)` lowercases both sides).    |


## Recommended next steps (implementation when execution is allowed)

1. Add an **integration test**: build encounter with a zombie (from catalog) + caster with Poison Spray; `resolveCombatAction` with fixed RNG so the attack hits; assert HP unchanged (or assert log note for immunity / 0 effective damage). This confirms or falsifies A/B in CI.
2. If the test **passes**, reproduce the user path (UI / manual damage) and fix the specific path that omits `damageType` or strips markers.
3. Optionally add `**debugDetails`** on immunity application in `[damage-mutations.ts](src/features/mechanics/domain/encounter/state/damage-mutations.ts)` when `applied.level === 'immunity'` (similar to resistance notes) so the combat log shows **why** damage became 0.

## Authoring note

MM-style `**"poison"`** in a mixed immunity list means **poison damage** in this project’s partition rules. The **condition** is `**poisoned`**. Do not use `"poison"` expecting only the poisoned condition without also granting a damage marker unless you add explicit mapping.