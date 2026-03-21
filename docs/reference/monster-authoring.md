# Monster authoring

System and campaign monsters share `MonsterFields` ([`monster.types.ts`](../../src/features/content/monsters/domain/types/monster.types.ts)). This document complements [effects.md](./effects.md) for **effects**, **resolution metadata**, and **stat math**.

## Abilities

- Author ability scores using **short ids** (`str`, `dex`, …) per `AbilityScoreMap`.
- Reads normalize id vs full key via [`getAbilityScoreValue`](../../src/features/mechanics/domain/character/abilities/abilityScoreMap.ts) (see [`abilityScoreMap.ts`](../../src/features/mechanics/domain/character/abilities/abilityScoreMap.ts)); prefer ids for new content.

## Armor class

Author AC so it recomputes from ability scores and equipment via [`calculateMonsterArmorClass`](../../src/features/content/monsters/domain/mechanics/calculateMonsterArmorClass.ts) (delegates to [`calculateCreatureArmorClass`](../../src/features/mechanics/domain/equipment/armorClass.ts)).

- **`kind: 'natural'`** — optional **`offset`**: points **above** the unarmored AC baseline ([`MONSTER_UNARMORED_AC_BASELINE`](../../src/features/content/monsters/domain/mechanics/calculateMonsterArmorClass.ts), 10 until rulesets expose a single source of truth). Omit **`offset`** when it would be **0** (equivalent to baseline + DEX only). DEX is folded in by the shared creature AC path; model edge cases via **`offset`** and catalog armor, not deprecated per-monster DEX flags.
- **`kind: 'equipment'`** — `armorRefs` plus `equipment.armor` entries tied to the armor catalog; DEX caps follow real armor rules in [`armorClass.ts`](../../src/features/mechanics/domain/equipment/armorClass.ts).
- **`kind: 'fixed'`** and **`override`** — **escape hatches only** when natural + equipment cannot match the printed AC honestly.

See [`monster-equipment.types.ts`](../../src/features/content/monsters/domain/types/monster-equipment.types.ts) for the shape of `armorClass`.

## Proficiency and skills

- Set `mechanics.proficiencyBonus` from the stat block.
- Store **proficiency shape** in `proficiencies.skills` with `proficiencyLevel` (1 = proficiency, 2 = double proficiency / “expertise” in effect). Total bonus = ability modifier + `resolveProficiencyContribution(pb, level)` — do not duplicate the final +N in data.

## Passive Perception

- `senses.passivePerception` is optional. Omit when it equals 10 + WIS mod with no Perception proficiency; set when proficiency changes it.

## Damage: resistances, immunities, vulnerabilities

Shared elemental/weapon damage labels include **`DamageType`** in [`damage.types.ts`](../../src/features/mechanics/domain/damage/damage.types.ts) (re-exported from [`monster-combat.types.ts`](../../src/features/content/monsters/domain/types/monster-combat.types.ts) for convenience).

- **`mechanics.resistances`** — `MonsterResistanceType[]`; combat builds **resistance** markers (half damage).
- **`mechanics.immunities`** / **`mechanics.vulnerabilities`** — see [`monster-combat.types.ts`](../../src/features/content/monsters/domain/types/monster-combat.types.ts); [`buildMonsterCombatantInstance`](../../src/features/encounter/helpers/combatant-builders.ts) maps them to combat markers. Condition-like entries are partitioned vs damage types consistently with spells.

## Actions and traits

- **Natural** attacks: `MonsterNaturalAttackAction` — optional `onHitEffects` for riders (saves, extra damage, conditions).
- **Special** actions: `MonsterSpecialAction` — saves, recharge, `sequence` for Multiattack, etc.
- **`resolution?: ContentResolutionMeta`** on special actions and traits (and optional `mechanics.resolution` for the whole stat block) for **caveats** and optional **subtype** — same shared type as spells ([`content-resolution.types.ts`](../../src/features/mechanics/domain/resolution/content-resolution.types.ts)).

## Resolution and under-modeling

Follow [effects.md §5 `note`](./effects.md), [§8](./effects.md), and **Resolution Status Tracking**:

- Use `{ kind: 'note', text: '…', category: 'under-modeled' }` when the engine only partially supports the rule.
- Use `resolution.caveats` when the gap is not a single note (e.g. adapter limits, geometry).
- Do not rely on comment-only “engine caveat” lines as the canonical record.

## System catalog

- Factory defaults live in [`monsters/index.ts`](../../src/features/mechanics/domain/rulesets/system/monsters/index.ts) and letter-range shards under [`monsters/data/`](../../src/features/mechanics/domain/rulesets/system/monsters/data/) (see [`monsters.ts`](../../src/features/mechanics/domain/rulesets/system/monsters/data/monsters.ts) for the shard registry).
