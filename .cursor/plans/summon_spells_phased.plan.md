---
name: ""
overview: ""
todos: []
isProject: false
---

# Summon spells — phased build plan

Ally summon spells should add **party-side** `CombatantInstance`s from catalog `**Monster.id`**, use `**resolution.casterOptions**` for form/CR tiers, and filter random pools with `**Monster.type**` and `**lore.challengeRating**`. Docs: [resolution.md §8 — Summon spells and spawn](../../docs/reference/resolution.md#summon-spells-and-spawn), [effects.md §13 spawn](../../docs/reference/effects.md#spawn).

**Prerequisite (done):** `Monster.lore.challengeRating` is **required** in `[monster.types.ts](../../src/features/content/monsters/domain/types/monster.types.ts)` so CR caps for conjuration pools are always defined.

**Targeting:** Prefer `**targeting: { kind: 'none' }`** on spell-derived actions (no creature target). The resolver applies `effects` once using the **actor** as the `applyActionEffects` target parameter for API compatibility; `**spawn`** should treat the actor as **source only** once implemented. Do not use `self` for summons unless the spell truly targets the caster.

---

## Phase 1 — Targeting and classifier (foundation)


| Deliverable                                 | Notes                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CombatActionTargetingProfile.kind: 'none'` | Implemented: `[combat-action.types.ts](../../src/features/mechanics/domain/encounter/resolution/combat-action.types.ts)`, `[action-targeting.ts](../../src/features/mechanics/domain/encounter/resolution/action/action-targeting.ts)`, `[action-resolver.ts](../../src/features/mechanics/domain/encounter/resolution/action/action-resolver.ts)`. |
| Encounter UI                                | When an action has `none`, target list is empty — no target picker required.                                                                                                                                                                                                                                                                        |
| `classifySpellResolutionMode`               | Add `**spawn`** (and any structured summon payload) to actionable kinds so summon spells become `**effects**` actions instead of `**log-only**`.                                                                                                                                                                                                    |
| `buildSpellCombatActions`                   | For summon spells, emit `**targeting: { kind: 'none' }**` (and `casterOptions` as today).                                                                                                                                                                                                                                                           |


**Exit criteria:** A test-only or feature-flagged spell action with `resolutionMode: 'effects'`, `targeting.kind: 'none'`, and only `note`/`spawn` effects resolves without “no valid targets” and without selecting a creature.

---

## Phase 2 — `SpawnEffect` + catalog wiring


| Deliverable                  | Notes                                                                                                                                                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Extend `**SpawnEffect`**     | `**monsterId**` / `**monsterIds**`, optional **pool**: `{ creatureType: MonsterType, maxChallengeRating: number }`, **count**, **initiativeMode** (`'group' | 'share-caster' | 'individual'`). Deprecate opaque `creature: string` for new content. |
| `applyActionEffects`         | Branch for `**spawn`**: resolve ids or **random** pick from `monstersById` with `type` + `lore.challengeRating <= maxChallengeRating`, using `**rng`** from options.                                                                                |
| `ResolveCombatActionOptions` | Pass `**monstersById**` (merged catalog) into the resolution path.                                                                                                                                                                                  |


**Exit criteria:** Unit tests: fixed id spawn; random pool with seeded `rng`; CR filter respects required `challengeRating`.

---

## Phase 3 — Encounter state: add allies


| Deliverable                               | Notes                                                                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCombatantToEncounter` (or equivalent) | Insert into `combatantsById`, `**partyCombatantIds`**, `**initiative**`, `**initiativeOrder**`; handle **turn index** when the active combatant shifts. |
| Build instances                           | Reuse `**buildMonsterCombatantInstance`**; labels for summoned allies (caster + monster name).                                                          |
| Initiative modes                          | **Group** (one roll for many), **share-caster** (Giant Insect), **individual** — per spell metadata.                                                    |


**Exit criteria:** After resolving a summon action, new party combatants appear in initiative and can be selected when their turn comes.

---

## Phase 4 — Authoring + UX polish


| Spell                                      | Work                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| Animate Dead                               | `casterOptions`: skeleton | zombie → ids; optional count scaling later.     |
| Giant Insect                               | Enum → `giant-centipede` / `giant-spider` / `giant-wasp`; share initiative. |
| Conjure Woodland Beings / Minor Elementals | Keep CR-tier enums; random fey / elemental under cap.                       |
| Caveats                                    | Trim `**resolution.caveats`** as behavior lands.                            |


**Exit criteria:** Listed spells authored with structured spawn + `none` targeting; encounter playthrough adds visible allies.

---

## Phase 5 — Concentration and dismissal (optional)

- Tie summoned creatures to caster **concentration** where rules require; dismiss on break or 0 HP.
- Multi-creature scaling (slot level) for Animate Dead / conjure counts.

---

## Dependencies between phases

```
Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4
                              └──► Phase 5 (optional)
```

Phase 3 can start a stub (append combatant + simple initiative) before Phase 2 is fully rich if spawn resolution returns a resolved `Monster` list first.