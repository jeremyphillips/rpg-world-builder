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

## Equipment: catalog stand-ins and derived flavor

Stat blocks often list **gear** or **named attacks** that should drive resolution, but the ruleset only exposes a **finite weapon/armor catalog** (`weaponId` / `armorId`). When the printed name or stats **do not exactly match** a single catalog row, use **`mechanics.equipment`** ([`MonsterEquipment`](../../src/features/content/monsters/domain/types/monster-equipment.types.ts)) to anchor mechanics on the **closest** catalog item and carry **derived flavor** on the wrapper:

| Field | Use |
| --- | --- |
| **`aliasName`** | Display name from the MM/stat block (e.g. *Necrotic Sword*) while **`weaponId`** / **`armorId`** stay a real catalog id. |
| **`attackBonus`**, **`damageBonus`**, **`damageOverride`**, **`reach`** | When printed to-hit, dice, or reach differ from defaults for that catalog weapon. |
| **`notes`** | Riders not modeled elsewhere: extra damage types, poison, advantage clauses, poisoned riders, etc. |
| **`acModifier`** (armor) | Adjust effective AC when the block implies scrap, damaged, or non-standard protection but you still use one catalog armor row for the calculation. |

**Reference examples**

- **Armor — battered stand-in:** Skeleton [`scraps`](../../src/features/mechanics/domain/rulesets/system/monsters/data/monsters-s-u.ts) uses `armorId: 'chain-shirt'` with `acModifier: -1`, `aliasName: 'Armor Scraps'`, and `notes` explaining the fiction.
- **Weapon — same id, different printed dice/reach:** Bugbear Warrior [`light-hammer`](../../src/features/mechanics/domain/rulesets/system/monsters/data/monsters-b.ts) keeps `weaponId: 'light-hammer'` but sets `damageOverride: '3d4'`, `reach: 10`, and `notes` for the grapple advantage clause.
- **Weapon — MM name differs from catalog name:** Wight [`necrotic-sword` / `necrotic-bow`](../../src/features/mechanics/domain/rulesets/system/monsters/data/monsters-v-z.ts) uses `weaponId` `longsword` / `longbow` with `aliasName: 'Necrotic Sword'` / `'Necrotic Bow'` and authored bonuses plus necrotic rider `notes`.

When the block lists **Gear** but you model AC as **`kind: 'natural'`** (no worn armor row)—e.g. constructs—you typically **omit** `equipment.armor` and keep the flavor in **description** / traits unless you deliberately want an equipment-based AC breakdown.

**Audit: A–C batch monsters (`aboleth` … `axe-beak`)**

| `id` | `equipment`? | Stand-in / `aliasName` needed? |
| --- | --- | --- |
| `aboleth` | No | — |
| `animated-armor` | No (natural AC) | — |
| `animated-flying-sword` | No | — |
| `animated-rug-of-smothering` | No | — |
| `ankheg` | No | — |
| `assassin` | Yes | **No** — `studded-leather`, `shortsword`, and `light-crossbow` match the **Gear** line; poison and conditions belong in **`notes`** on each `MonsterEquippedWeapon` (no `aliasName` unless the MM used a special proper name distinct from the catalog). |
| `awakened-shrub` | No | — |
| `awakened-tree` | No | — |
| `axe-beak` | No | — |

## Proficiency and skills

- Set `mechanics.proficiencyBonus` from the stat block.
- Store **proficiency shape** in `proficiencies.skills` with `proficiencyLevel` (1 = proficiency, 2 = double proficiency / “expertise” in effect). Total bonus = ability modifier + `resolveProficiencyContribution(pb, level)` — do not duplicate the final +N in data.

## Passive Perception

- `senses.passivePerception` is optional. Omit when it equals 10 + WIS mod with no Perception proficiency; set when proficiency changes it.

## Damage: resistances, immunities, vulnerabilities

Shared elemental/weapon damage labels include **`DamageType`** in [`damage.types.ts`](../../src/features/mechanics/domain/damage/damage.types.ts).

- **`mechanics.resistances`** — [`CreatureResistanceDamageType[]`](../../src/features/mechanics/domain/creatures/immunities.types.ts); combat builds **resistance** markers (half damage).
- **`mechanics.immunities`** / **`mechanics.vulnerabilities`** — mixed damage + condition immunities use [`ImmunityType`](../../src/features/mechanics/domain/creatures/immunities.types.ts) (vulnerabilities use [`CreatureVulnerabilityDamageType`](../../src/features/mechanics/domain/creatures/immunities.types.ts)); [`buildMonsterCombatantInstance`](../../src/features/encounter/helpers/combatants/combatant-builders.ts) maps them to combat markers. Condition-like entries are partitioned vs damage types consistently with spells.

## Actions and traits

- **Natural** attacks: `MonsterNaturalAttackAction` — optional `onHitEffects` for riders (saves, extra damage, conditions).
- **Special** actions: `MonsterSpecialAction` — saves, recharge, `sequence` for Multiattack, etc.
- **`resolution?: ContentResolutionMeta`** on special actions and traits (and optional `mechanics.resolution` for the whole stat block) for **caveats** and optional **subtype** — same shared type as spells ([`content-resolution.types.ts`](../../src/features/mechanics/domain/resolution/content-resolution.types.ts)).

### Action ids and Multiattack

- Add optional **`id`** (kebab-case, stable) on **`MonsterNaturalAttackAction`** and **`MonsterSpecialAction`** for any action referenced by **Multiattack** or **legendary** entries.
- **`sequence`** steps use **`{ actionId, count }`**. The encounter adapter resolves **`actionId`** to a display label from the matching action (`id` on natural/special, or **`weaponRef`** for `kind: 'weapon'`).

### Legendary actions

Structured data lives in **`mechanics.legendaryActions`** ([`monster-legendary.types.ts`](../../src/features/content/monsters/domain/types/monster-legendary.types.ts)). Do **not** duplicate the full legendary list in a **`Legendary Actions`** trait when this block is present.

- **`uses`** / **`usesInLair`**: per stat block (e.g. 3 / 4 in lair).
- **`timing`**: use **`OffTurnTiming`** — typically **`'end-of-other-creatures-turn'`** (immediately after another creature’s turn). Shared with other encounter concepts in [`turn-hooks.types.ts`](../../src/features/mechanics/domain/triggers/turn-hooks.types.ts).
- **`refresh`**: use **`TurnHookKind`** when uses are regained at **start or end of this creature’s turn** (usually **`'turn-start'`** for legendary uses).
- **`actions`**: each entry is **`kind: 'reference'`** ( **`name`**, **`actionId`** pointing at a normal action, optional **`cost`** defaulting to 1, optional **`heal`**, **`notes`**, **`additionalEffects`**, **`resolution`**) or **`kind: 'inline'`** ( **`name`**, full **`MonsterAction`** for legendary-only lines such as spell sub-actions).

Rule text should follow your project’s **SRD 5.2.1** (CC BY 4.0) source, not third-party stat blocks.

## Traits: emanations and attached battlefield {#traits-emanations-and-attached-battlefield}

Spell-style **`kind: 'emanation'`** on monsters uses the same effect shape as spells. Full field semantics, pairing with **`targeting`** (spells), **`interval`** / grid runtime, and limitations (stationary vs moving aura, speed multipliers) live in [effects.md § `emanation`](./effects.md#emanation) — read that first. Cross-cutting architecture (adapters, sources, UI, gaps): [resource/emanation.md](../resource/emanation.md).

### Trait effects (`MonsterTrait.effects`)

- **Persistent self-centered sphere:** author **`emanation`** with **`attachedTo: 'self'`**, **`area: { kind: 'sphere', size: <feet> }`**, and **`selectUnaffectedAtCast`** (`true` only for Spirit Guardians–style “unaffected creatures”; otherwise **`false`**).
- **Damage or saves on a schedule:** add **`interval`** with **`every: { value: 1, unit: 'turn' }`** and nested **`damage`**, **`save`**, etc., as in [effects.md § `emanation`](./effects.md#emanation) (runtime uses the same attached-aura interval / overlap machinery as spells). **`stateId`** on **`interval`** must be a stable string unique to that authored interval row.
- **Stat block dice:** a line like **5 (1d10)** means **average 5** and dice **1d10**. In **`damage`**, author the **parenthetical dice** (e.g. **`'1d10'`**), not the average and not a misread such as **`5d10`**.
- **Save DC on the aura:** put a numeric **`save.dc`** on a top-level **`save`** or on a **`save`** nested under **`interval`** so attached-aura metadata can pick it up (`resolveTraitSaveDcFromEffects` in `monster-runtime.ts`).
- **Caveats:** use **`resolution.caveats`** for rules the engine does not match exactly (e.g. “only when the azer’s turn ends” vs Spirit Guardians–style resolution on other creatures’ turns, ally-only damage, **Incapacitated** gates, underwater-only mucus).

At encounter start, qualifying traits can seed **`EncounterState.attachedAuraInstances`** when **`monstersById`** is available (source **`monster-trait`**). Triggers on the trait still gate **`buildActiveMonsterEffects`** / attached-aura creation the same way as other trait triggers (see `monster-runtime.ts`).

### Special actions (`MonsterSpecialAction.effects`)

**`emanation`** on a **special** action is bridged by **`buildMonsterExecutableActions`** / **`monster-combat-adapter.ts`** into **`CombatActionDefinition.attachedEmanation`** and filtered **`effects`**, aligned with spell behavior. See [effects.md § `emanation`](./effects.md#emanation).

### Death bursts and other non-persistent “Emanation” text

If the rule is **only on death** (e.g. mephit / magmin **Death Burst**), use **`trigger: { kind: 'reduced-to-0-hp' }`** and a **`note`** with **`category: 'under-modeled'`** — **do not** add **`kind: 'emanation'`** here, or a persistent attached aura could be implied. Spell out DC, dice, and radius in the note; keep **`resolution.caveats`** for manual resolution at the table.

## Resolution and under-modeling

Follow [effects.md §5 `note`](./effects.md), [§8](./effects.md), and **Resolution Status Tracking**:

- Use `{ kind: 'note', text: '…', category: 'under-modeled' }` when the engine only partially supports the rule.
- Use `resolution.caveats` when the gap is not a single note (e.g. adapter limits, geometry).
- Do not rely on comment-only “engine caveat” lines as the canonical record.

## Monster types (vocabulary)

Before assigning a new **`type`** on a stat block, add its **id** and display **name** to [`MONSTER_TYPE_OPTIONS`](../../src/features/content/monsters/domain/vocab/monster.vocab.ts) in [`monster.vocab.ts`](../../src/features/content/monsters/domain/vocab/monster.vocab.ts). `MonsterType` is derived from that list, so catalog entries and UI options stay aligned.

## System catalog

- Factory defaults live in [`monsters/index.ts`](../../src/features/mechanics/domain/rulesets/system/monsters/index.ts) and single-letter / letter-range shards under [`monsters/data/`](../../src/features/mechanics/domain/rulesets/system/monsters/data/) (see [`monsters.ts`](../../src/features/mechanics/domain/rulesets/system/monsters/data/monsters.ts) for the shard registry).
