# Effects Reference

## 1. Purpose And Scope

The shared effects system is the canonical cross-domain mechanic vocabulary for authored content.

- spells
- monster actions
- monster traits
- character and class effects
- runtime and combat adapters

- content models are canonical
- runtime systems are consumers
- adapters may support only a subset
- adapters may translate for runtime needs
- runtime limits must not shape authored content

## 2. Core Rules

- Effects describe outcomes.
- Triggers, conditions, and timing describe when outcomes apply.
- Containers own effects.
- Prefer one shared effect primitive over domain-specific duplicates.
- Prefer under-modeling over fake precision.
- Use structured data only when the shape is reliable and repeatable.
- Put unsupported nuance in owned text or `note`, not invented structure.
- Do not duplicate sources of truth.

Boundaries:

- Effect: damage, modifier, condition, move, state, immunity, grant, action availability.
- Trigger or condition: when hit, at turn start, while unarmored, on failed save.
- Container: spell, monster action, monster trait, class feature, runtime adapter payload.

## 3. Source-Of-Truth / Ownership Rules

### General

- The owning container stores metadata about activation, range, duration, and description.
- Effects store outcomes.
- Effect-level duration is only authored when it differs from the owner duration.

### Spells

- `castingTime` owns casting cadence and reaction trigger text.
- `range` owns placement distance.
- `duration` owns spell duration and concentration by default.
- `components` own V/S/M facts.
- `deliveryMethod` owns attack delivery when the spell requires a spell attack roll.
- `description.full` is authoritative rules text.
- `description.summary` is short UI copy.
- **Catalog audit:** run `npm run test:run -- src/features/encounter/helpers/spell-catalog-audit.test.ts` for merged-system-spell metrics (stranded counts, ambiguous delivery, explicit `save.dc`, etc.). Counts are for reporting, not CI gates; see `spell-resolution-audit.ts` and [resolution.md](./resolution.md) §7 “Spell combat adapter”.
- **`resolution.hpThreshold`** — optional HP-gated branches: main `effects` when target current HP ≤ `maxHp`, `aboveMaxHpEffects` when above (combat adapter maps to `CombatActionDefinition`). Use for spells like Power Word Kill; keep rules text in `description.full`.

### Delivery Method

- `deliveryMethod` is an optional container-level field: `'melee-spell-attack' | 'ranged-spell-attack'`.
- Use when: the spell requires a spell attack roll as its primary delivery.
- Do not use when: the spell uses a saving throw, auto-hits, or has no attack roll.
- The adapter uses `deliveryMethod` to classify the spell as an attack-roll action and to build the attack profile from the caster's spell attack bonus.
- Attack metadata belongs on the spell container, not in the effects array.

### Range

- Top-level spell range = where the origin or target point can be chosen.
- `targeting` = who or what is affected after placement.
- Do not restate spell range in `targeting` unless it is distinct from the parent range.

### Area targeting and encounter combat (limitations)

Authored `targeting` with `creatures-in-area` and `area` (cone, sphere, line, etc.) describes the **intended template** for rules text, UI, audits, and future spatial engines. It is **not** wired to point-and-shape simulation in encounter combat today.

**What the spell combat adapter does**

- Area-style spells are mapped to **`all-enemies`** action targeting (`buildSpellTargeting` in `spell-combat-adapter.ts`).
- Resolution uses **`getActionTargetCandidates`**: every **living enemy** combatant that passes `isValidActionTarget` can receive the spell’s effects — there is **no** check that a creature lies inside the authored `area` or origin point.

**What is not modeled**

- **Geometry:** no chosen point, no distance-from-center, no templates on a grid, no line of effect, no cover or blocking.
- **Friendly fire / mixed allegiance:** the adapter path is **hostile, enemies only**. Spells that can legally affect **allies** in the area (or the caster’s space, or “creatures you choose” inside an AoE) **do not** get that behavior here — allies are simply **not** in the `all-enemies` pool. Do **not** assume encounter resolution matches the full SRD for those cases.
- **Partial areas / exclusions** (e.g. “creatures you designate”, “you and creatures you choose”, evasion behind total cover) are likewise **not** represented mechanically.

**Authoring**

- Keep **`description.full`** (and `description.summary`) authoritative for human rules.
- Use **`note`** (and optional `resolution.caveats`) to flag under-modeled encounter behavior where it matters.
- For mechanics that require picking specific creatures regardless of side, prefer patterns that map to **`single-creature`**, **`self`**, or other supported kinds where possible.

See [resolution.md §9 — Targeting families](./resolution.md#targeting-families) (and **Area spells vs `all-enemies`**) for the runtime architecture framing.

### Duration

- Spell-level duration is primary for spells.
- Concentration belongs on spell duration by default.
- Effect duration appears only when the effect differs from the owner duration.

### Saving Throws

- `targeting` defines affected entities.
- `save` defines the saving throw.
- `save.onFail` and `save.onSuccess` own branching outcomes.
- If damage changes on success or failure, that damage belongs under `save` outcomes.
- Spell-authored `save.dc` should be left unset when the DC derives from the caster (the standard case). The combat adapter injects the caster's spell save DC at build time. Only author an explicit `save.dc` when the DC is intrinsic to the effect (e.g. monster on-hit rider saves with a fixed DC).

### Rituals And Alternate Modes

- Ritual handling belongs in `castingTime.normal` or `castingTime.alternate`.
- Do not duplicate ritual facts in unrelated fields.

## 4. Canonical Naming Rules

- Discriminants must be globally consistent across domains.
- Canonical authored naming should use `kebab-case`.
- Adapters may translate for runtime use.
- Authored content must not preserve naming drift just because an older consumer still does.

## 5. Shared Effect Kind Reference

Status meanings:

- `canonical`: stable shared primitive
- `provisional`: shared today but likely to evolve
- `under-modeled`: intentionally partial support

### `targeting`

- Status: `canonical`
- Purpose: selection and affected-entity shape
- Use when: modeling targets, areas, sight requirements, target count, repeat-target rules, creature type restrictions
- Do not use when: storing spell placement range or save/damage outcomes
- Key fields: `target`, `targetType`, `requiresWilling` (set in spell data for willing touch / ally buffs in encounter), `creatureTypeFilter`, `condition` (effect meta), `requiresSight`, `count`, `canSelectSameTargetMultipleTimes`, `area`
- Encounter rules do **not** infer `requiresWilling` from spell text; author it on the `targeting` effect when the rules require a willing target.

```ts
{ kind: 'targeting', target: 'creatures-in-area', area: { kind: 'sphere', size: 20 } }
```

```ts
{ kind: 'targeting', target: 'one-dead-creature', targetType: 'creature' }
```

```ts
{ kind: 'targeting', target: 'one-creature', targetType: 'creature', creatureTypeFilter: ['humanoid'] }
```

- `one-dead-creature`: targets a single creature at 0 HP. The spell combat adapter maps this to `dead-creature` action targeting, which restricts selection to 0 HP combatants regardless of side.
- `creatureTypeFilter`: restricts valid targets to creatures whose `creatureType` matches one of the listed types. The spell combat adapter propagates this to `CombatActionTargetingProfile.creatureTypeFilter`, and both the resolution engine and the encounter UI filter targets accordingly. Uses `MonsterType` values from the shared monster vocabulary.
- **Equivalent:** `condition: { kind: 'creature-type', target: 'target', creatureTypes: [...] }` on the same targeting effect is also mapped to combat `creatureTypeFilter` when `target` is `'target'` (the selected creature). Prefer one style per spell; `creatureTypeFilter` is slightly shorter for pure type gates.
- **`creatures-in-area` in encounter combat:** the adapter treats area spells as **`all-enemies`** only — see §3 **Area targeting and encounter combat (limitations)** above.

**Hostile application (encounter / charm rules):** `deriveSpellHostility` (see `spell-hostility.ts`) walks spell `effects` and sets `CombatActionDefinition.hostileApplication` when definitive: `resolution.hostileIntent` override → `requiresWilling` → `SPELL_STATE_HOSTILITY` for `state` ids (e.g. `hallowed` non-hostile) → any `damage` or `save` → hostile; healing (`hit-points` heal) → non-hostile; otherwise unknown (legacy `targeting` kind rules). Prefer explicit `requiresWilling` for willing touch buffs when the tree has no damage/save/state map hit.

### `damage`

- Status: `canonical`; `instances` is `provisional`; `levelScaling` is `provisional`
- Purpose: damage payload
- Use when: a mechanic directly deals damage
- Do not use when: save branches own the differing result
- Key fields: `damage`, `damageType`, `instances`, `levelScaling`
- `levelScaling.thresholds`: character-level breakpoints that override damage dice or instance count (e.g. cantrip upgrades at levels 5, 11, 17)
- Each threshold may specify `damage` (new dice expression), `instances` (new instance count), or both

```ts
{ kind: 'damage', damage: '8d6', damageType: 'fire' }
```

```ts
{ kind: 'damage', damage: '1d8', damageType: 'radiant', levelScaling: { thresholds: [{ level: 5, damage: '2d8' }, { level: 11, damage: '3d8' }, { level: 17, damage: '4d8' }] } }
```

```ts
{ kind: 'damage', damage: '1d10', damageType: 'force', instances: { count: 1, canSplitTargets: true }, levelScaling: { thresholds: [{ level: 5, instances: 2 }, { level: 11, instances: 3 }, { level: 17, instances: 4 }] } }
```

### `save`

- Status: `canonical`
- Purpose: saving throw plus branched outcomes
- Use when: success and failure change the result
- Do not use when: there is no real branching save outcome
- Key fields: `save.ability`, `save.dc`, `onFail`, `onSuccess`

```ts
{ kind: 'save', save: { ability: 'dex' }, onFail: [{ kind: 'damage', damage: '8d6', damageType: 'fire' }], onSuccess: [{ kind: 'damage', damage: '4d6', damageType: 'fire' }] }
```

### `modifier`

- Status: `canonical`
- Purpose: numeric or formulaic change to a shared stat target
- Use when: changing AC, attack, damage, resistance, speed, save bonus, or similar
- Do not use when: the mechanic is better represented by `condition`, `state`, or `roll-modifier`
- Key fields: `target`, `mode`, `value`

```ts
{ kind: 'modifier', target: 'armor_class', mode: 'add', value: 5 }
```

### `immunity`

- Status: `canonical`; scope variants are `provisional`
- Purpose: bounded immunity or protection window
- Use when: protecting against a spell or source action
- Do not use when: the mechanic is a permanent or granted immunity better owned by `grant`
- Key fields: `scope`, `duration`, `spellIds`, `notes`

```ts
{ kind: 'immunity', scope: 'spell', spellIds: ['magic-missile'], duration: { kind: 'until-turn-boundary', subject: 'self', turn: 'next', boundary: 'start' } }
```

### `condition`

- Status: `canonical`
- Purpose: apply a standard condition
- Use when: the mechanic applies a shared condition
- Do not use when: the mechanic is a broader ongoing state
- Key fields: `conditionId`, `targetSizeMax`, `escapeDc`, `repeatSave`
- `repeatSave`: optional. When present, the engine registers a turn hook that rolls a save at the specified timing. On success, the condition is removed. Shape: `{ ability: AbilityRef; timing: 'turn-start' | 'turn-end' }`.

```ts
{ kind: 'condition', conditionId: 'prone' }
```

### `move`

- Status: `canonical`
- Purpose: movement outcome
- Use when: movement is a real rules payload
- Do not use when: movement is flavor only
- Key fields: `distance`, `upToSpeedFraction`, `forced`, `toNearestUnoccupiedSpace`, `movesWithSource`

```ts
{ kind: 'move', distance: 10, forced: true }
```

### `note`

- Status: `canonical`
- Purpose: preserve meaningful unsupported or partially supported rules text
- Use when: the mechanic cannot yet be modeled honestly
- Do not use when: a supported shared shape already fits
- Key fields: `text`, `category`

`category` distinguishes mechanical gaps from flavor text:

- `'under-modeled'`: the note stands in for a mechanic that cannot yet be structurally modeled (e.g. "Charmed creature can still attack allies of caster"). Drives `partial` resolution status.
- `'flavor'`: descriptive text that is not a mechanical gap (e.g. "Flammable objects start burning"). Does not affect resolution status.
- Omitted: treated as ambiguous. Existing note-only stubs do not need retroactive categorization.

```ts
{ kind: 'note', text: "Flammable objects in the area that aren't being worn or carried start burning.", category: 'flavor' }
```

```ts
{ kind: 'note', text: 'Constructs have Disadvantage on the save.', category: 'under-modeled' }
```

### `state`

- Status: `canonical`
- Purpose: named ongoing state with nested or escape-driven rules
- Use when: the mechanic is more than a simple condition
- Do not use when: `condition` is enough
- Key fields: `stateId`, `escape`, `ongoingEffects`, `notes`

```ts
{ kind: 'state', stateId: 'engulfed', ongoingEffects: [{ kind: 'condition', conditionId: 'restrained' }] }
```

### `form`

- Status: `canonical`, domain-skewed
- Purpose: form change
- Use when: transformation is repeatable and fits the shared shape
- Do not use when: the transformation is a bespoke one-off with unsupported custom logic
- Key fields: `form`, `allowedSizes`, `retainsStatistics`, `equipmentTransforms`

```ts
{ kind: 'form', form: 'object', retainsStatistics: false }
```

### `action`

- Status: `provisional`
- Purpose: lightweight action reference or grant
- Use when: action availability is the mechanic
- Do not use when: the real mechanic is activation timing or a modifier
- Key fields: `action`

```ts
{ kind: 'action', action: 'dash' }
```

### `activation`

- Status: `canonical`
- Purpose: activation wrapper around nested effects
- Use when: a feature or trait spends an action, bonus action, reaction, or special activation to apply effects
- Do not use when: the owner already cleanly stores activation and no wrapper is needed
- Key fields: `activation`, `effects`, `cost`

```ts
{ kind: 'activation', activation: 'action', effects: [{ kind: 'modifier', target: 'armor_class', mode: 'add', value: 2 }] }
```

### `grant`

- Status: `canonical`
- Purpose: grant proficiencies or condition immunities
- Use when: a mechanic grants a reusable capability or immunity
- Do not use when: the mechanic is a temporary modifier or bounded protection window
- Key fields: `grantType`, `value`

```ts
{ kind: 'grant', grantType: 'condition-immunity', value: 'poisoned' }
```

### `resource`

- Status: `canonical`, domain-skewed
- Purpose: define a tracked resource
- Use when: the mechanic creates a pool with recharge rules
- Do not use when: the mechanic only spends an already-defined resource
- Key fields: `resource.id`, `resource.max`, `resource.recharge`

```ts
{ kind: 'resource', resource: { id: 'channel_divinity', max: 1, recharge: 'short-rest' } }
```

### `trigger`

- Status: `provisional`
- Purpose: structured trigger gate around nested effects
- Use when: the shared trigger vocabulary is expressive enough
- Do not use when: the true trigger is more specific than the shared model can express honestly
- Key fields: `trigger`, `effects`, `cost`

```ts
{ kind: 'trigger', trigger: 'weapon-hit', effects: [{ kind: 'damage', damage: '1d8', damageType: 'radiant' }] }
```

### `roll-modifier`

- Status: `canonical`
- Purpose: advantage or disadvantage on a roll family
- Use when: the mechanic changes roll mode rather than numeric value
- Do not use when: the mechanic is a flat numeric modifier
- Key fields: `appliesTo`, `modifier`

```ts
{ kind: 'roll-modifier', appliesTo: 'attack-rolls', modifier: 'advantage' }
```

### `hit-points`

- Status: `canonical`
- Purpose: direct hit point change (healing or damage)
- Use when: the mechanic directly heals or damages without a save, attack roll, or branching outcome
- Do not use when: healing or damage depends on a save result (use `save` with nested effects)
- Key fields: `mode`, `value`, `abilityModifier`
- `mode`: `'heal'` or `'damage'`
- `value`: flat number or dice expression (`DiceOrFlat`). Flat values are used directly; dice expressions are rolled at resolution time.
- `abilityModifier`: optional boolean. When `true`, the spell combat adapter injects the caster's spellcasting ability modifier into the dice expression at build time (e.g. `'2d8'` becomes `'2d8+3'`).

```ts
{ kind: 'hit-points', mode: 'heal', value: '2d8', abilityModifier: true }
```

```ts
{ kind: 'hit-points', mode: 'heal', value: 15 }
```

### Other Current Shared Kinds

- `formula`: `canonical`
- `check`: `canonical`
- `containment`: `provisional`
- `visibility-rule`: `provisional`
- `interval`: `canonical`
- `death-outcome`: `provisional`
- `hold-breath`: `canonical`
- `tracked-part`: `provisional`
- `extra-reaction`: `provisional`
- `spawn`: `provisional`
- `aura`: `canonical`
- `custom`: escape hatch only
- Use these only when their current shared meaning fits.
- Do not invent near-duplicate local variants.

## 6. Trigger / Timing Reference

### Trigger Rules

- Use structured triggers only when the shared trigger vocabulary expresses the rule honestly.
- Use descriptive text when the current shared trigger model is too coarse.
- Reaction spell triggers should remain descriptive text until a richer shared trigger model exists.
- Do not force highly specific reaction text into the current shared `TriggerType`.

Current shared trigger vocabulary includes:

- `attack`
- `weapon-hit`
- `hit`
- `damage-dealt`
- `damage-taken`
- `turn-start`
- `turn-end`
- `spell-cast`

### Timing Rules

- Turn-boundary timing should be modeled structurally when the exact boundary is the mechanic.
- Do not flatten turn-boundary timing into generic time units when that loses meaning.
- Effect-level duration is only authored when it differs from the owner duration.

### Condition Rules

- Use `EffectMeta.condition` for passive applicability gates.
- Conditions gate effects; they are not replacement effect kinds.
- Examples: while unarmored, while wielding a shield, while in an area.

#### Condition Kinds

- `state`: checks a property on a snapshot (`self`, `target`, `source`, `ally`)
- `compare`: numeric comparison against a snapshot property
- `event`: matches a trigger event type
- `creature-type`: gates effect by the creature type of a snapshot entity
- `and` / `or` / `not`: logical combinators

#### `creature-type` Condition

Scopes an effect to interactions involving specific creature types. The `target` field selects which entity to check:

- `source`: the creature initiating the interaction (attacker, spell caster)
- `target`: the creature being affected
- `self`: the creature bearing the effect

```ts
{ kind: 'creature-type', target: 'source', creatureTypes: ['aberration', 'celestial', 'elemental', 'fey', 'fiend', 'undead'] }
```

`EvaluationContext.source` provides the initiating creature's snapshot. `CreatureSnapshot.creatureType` carries the creature's type for runtime evaluation.

## 7. Common Authoring Patterns

### Save-Based Spell

- `targeting` defines affected entities
- `save` defines the save
- `save.onFail` and `save.onSuccess` own branching outcomes
- damage belongs under `save` outcomes when it changes by save result

```ts
[
  { kind: 'targeting', target: 'creatures-in-area', area: { kind: 'sphere', size: 20 } },
  { kind: 'save', save: { ability: 'dex' }, onFail: [{ kind: 'damage', damage: '8d6', damageType: 'fire' }], onSuccess: [{ kind: 'damage', damage: '4d6', damageType: 'fire' }] },
]
```

### Attack-Roll Spell

- `deliveryMethod` on the spell container declares the attack type
- `targeting` defines affected entities
- `damage` defines the hit payload
- the adapter builds the attack profile (bonus, damage, type) from the caster's spell attack bonus and the spell's `damage` effect
- on-hit riders beyond damage go into the effects array and are mapped to `onHitEffects`

```ts
// spell container fields
{ deliveryMethod: 'ranged-spell-attack' }

// effects array
[
  { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
  { kind: 'damage', damage: '1d10', damageType: 'fire', levelScaling: { thresholds: [{ level: 5, damage: '2d10' }] } },
  { kind: 'note', text: "A flammable object hit by this spell starts burning if it isn't being worn or carried." },
]
```

### Multi-Instance Attack Spell

- `damage.instances.count` defines the number of independent attack rolls (beams, rays)
- `damage.levelScaling.thresholds` may scale instance count at higher caster levels
- the adapter generates a parent action with sequence steps, one per instance
- each instance is resolved as a separate attack roll against the target

```ts
[
  { kind: 'targeting', target: 'chosen-creatures', targetType: 'creature', canSelectSameTargetMultipleTimes: true },
  { kind: 'damage', damage: '1d10', damageType: 'force', instances: { count: 1, canSplitTargets: true }, levelScaling: { thresholds: [{ level: 5, instances: 2 }, { level: 11, instances: 3 }, { level: 17, instances: 4 }] } },
]
```

### Attack-Roll Rider

- container owns attack metadata
- hit riders own hit outcomes

```ts
{ kind: 'save', save: { ability: 'str', dc: 11 }, onFail: [{ kind: 'condition', conditionId: 'prone' }] }
```

### Passive Trait

- trait owns passive context
- effect owns the resulting modifier, roll mode, immunity, or state

```ts
{ kind: 'roll-modifier', appliesTo: 'attack-rolls', modifier: 'advantage' }
```

### Reaction Defense Spell

- spell owns reaction trigger text
- spell duration owns the main timing
- effects own the protection outcomes

```ts
[
  { kind: 'modifier', target: 'armor_class', mode: 'add', value: 5 },
  { kind: 'immunity', scope: 'spell', spellIds: ['magic-missile'], duration: { kind: 'until-turn-boundary', subject: 'self', turn: 'next', boundary: 'start' } },
]
```

### Healing Spell

- `targeting` defines the affected creature
- `hit-points` with `mode: 'heal'` defines the healing payload
- `abilityModifier: true` signals the adapter to inject the caster's spellcasting ability modifier
- the adapter classifies healing spells as `effects` resolution mode with `single-creature` targeting

```ts
[
  { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
  { kind: 'hit-points', mode: 'heal', value: '2d8', abilityModifier: true },
]
```

### Resurrection Spell

- `targeting` with `one-dead-creature` restricts to 0 HP creatures
- `hit-points` with `mode: 'heal'` restores HP (flat value, no dice)
- unsupported nuance (time limit, creature type restrictions, penalties) goes in `note`
- the adapter classifies as `effects` mode with `dead-creature` action targeting

```ts
[
  { kind: 'targeting', target: 'one-dead-creature', targetType: 'creature' },
  { kind: 'hit-points', mode: 'heal', value: 1 },
  { kind: 'note', text: 'Target must have been dead no longer than 10 days and not Undead. -4 d20 penalty, reduced by 1 per Long Rest.' },
]
```

### Area Effect

- owner range chooses placement
- `targeting.area` describes the template
- `save`, `damage`, and riders describe outcomes after placement

### Intentionally Under-Modeled Effect

- use the supported shared primitives for the parts that are real and repeatable
- put the unsupported remainder in `note` or owned description text

```ts
[
  { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
  { kind: 'save', save: { ability: 'wis' }, onFail: [{ kind: 'condition', conditionId: 'charmed' }] },
  { kind: 'note', text: 'Charmed target pursues a suggested course of activity. Ends if caster or allies damage target.', category: 'flavor' },
]
```

### Auto-Hit Spell

- `damage` defines the hit payload (no `deliveryMethod`, no top-level `save`)
- the adapter classifies as `auto-hit` resolution mode — skips attack roll, applies damage directly
- multi-instance auto-hit spells (e.g. Magic Missile) use `damage.instances` and generate sequence steps

```ts
[
  { kind: 'targeting', target: 'chosen-creatures', count: 3, canSelectSameTargetMultipleTimes: true, requiresSight: true },
  { kind: 'damage', damage: '1d4+1', damageType: 'force', instances: { count: 3, simultaneous: true, canSplitTargets: true, canStackOnSingleTarget: true } },
]
```

### HP-Threshold Spell

- `resolution.hpThreshold` gates effect application on the target's current HP
- below-threshold effects come from the spell's `effects` array
- above-threshold effects come from `resolution.hpThreshold.aboveEffects`
- the adapter maps these to `CombatActionDefinition.hpThreshold` and `aboveThresholdEffects`

```ts
// spell-level fields
resolution: {
  hpThreshold: {
    maxHp: 100,
    aboveEffects: [{ kind: 'damage', damage: '12d12', damageType: 'psychic' }],
  },
}

// effects array (applied when target HP <= threshold)
[
  { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
  { kind: 'hit-points', mode: 'damage', value: 9999 },
]
```

### Repeat-Save Condition

- `condition.repeatSave` triggers a save at turn start or end
- on success, the condition is automatically removed
- used for Hold Person, Hold Monster, Flesh to Stone, Fear, etc.

```ts
{ kind: 'condition', conditionId: 'paralyzed', repeatSave: { ability: 'wis', timing: 'turn-end' } }
```

### Damage Resistance Spell

- `modifier` with `target: 'resistance'` and `mode: 'add'` registers a `DamageResistanceMarker`
- damage application automatically halves matching damage types
- used for Protection from Energy, Stoneskin, etc.

```ts
{ kind: 'modifier', target: 'resistance', mode: 'add', value: 'fire' }
```

### Object-Targeting Spell

- spell range defines placement
- `targeting` describes the affected object(s)
- effects describe the outcome

```ts
[
  { kind: 'targeting', target: 'one-creature', targetType: 'creature' },
  { kind: 'note', text: 'You touch one object that is no larger than 10 feet in any dimension. The object sheds bright light in a 20-foot radius and dim light for an additional 20 feet.' },
]
```

Targeting guidance must support: creatures, objects, creatures or objects, points in space, self, self plus secondary targets, and areas originating from self or a chosen point. Do not let spell authoring drift into creature-only assumptions.

## 8. Intentional Under-Modeling

Some spells and mechanics are intentionally only partially modeled when the shared effect schema cannot yet represent the full mechanic cleanly.

Rules:

- Use the supported shared primitives for the parts that are real and repeatable.
- Put the unsupported remainder in `note` with `category: 'under-modeled'`.
- Use `category: 'flavor'` for descriptive notes that are not mechanical gaps.
- Treat partial modeling as an explicit temporary state, not as complete modeling.
- Document what is under-modeled so future work knows what remains.

The `category: 'under-modeled'` pattern is the canonical way to mark partial modeling. As the engine catches up to support new mechanics:

1. Replace the `under-modeled` note with the structured effect.
2. Change remaining notes to `category: 'flavor'` if they are purely descriptive.
3. Remove notes entirely if the structured effects fully capture the mechanic.

Example — Suggestion models the save and charmed condition, but the behavioral aspects of the suggested course of action remain under-modeled as flavor notes.

Do not solve under-modeling gaps with domain-specific hacks. If a gap proves recurring, promote it to a shared primitive per the extension policy.

## 9. Scaling Direction

Spells may define structured scaling rules via an optional `scaling` field:

```ts
scaling?: SpellScalingRule[];

type SpellScalingRule = {
  category: 'extra-damage' | 'extra-targets' | 'expanded-area' | 'expanded-range' | 'longer-duration' | 'other';
  description: string;
};
```

This is a reserved extension point for future upcasting work. Do not defer scaling information into ad hoc `higherLevelText` or scattered notes.

### Resolution Status Tracking

Spells carry an optional `resolution` field for per-spell qualitative metadata:

```ts
resolution?: {
  caveats?: string[];
};
```

`caveats` captures per-spell quirks that categorized notes cannot express (e.g. "target prevention behavior requires engine work"). Most spells will not need this.

The derived `SpellResolutionStatus` is computed at runtime by `getSpellResolutionStatus`:

| Status | Condition |
|--------|-----------|
| `stub` | No structured effects (only `note` effects) |
| `partial` | Has structured effects but also has `under-modeled` notes or `resolution.caveats` |
| `full` | All effects are structured; notes are `flavor`-only or absent |

Status transitions automatically as effects are authored. The SpellListRoute exposes this as a filterable column.

## 10. Adapter Philosophy

Runtime systems should consume spells through adapters.

Rules:

- Spell content reflects the rules cleanly.
- Runtime systems may support only a subset.
- Unsupported spell behavior degrades to log/text.
- Content authoring must not be distorted to satisfy current runtime limits.
- Adapters may translate discriminant naming for runtime constraints, but canonical content does not preserve legacy naming drift.

### Spell Combat Adapter

The spell combat adapter (`buildSpellCombatActions`) converts canonical spell content into executable `CombatActionDefinition` objects for the combat simulation. It classifies spells into four resolution modes:

- `attack-roll`: spells with `deliveryMethod`. The adapter builds an attack profile from the caster's spell attack bonus and the spell's `damage` effect. Multi-instance spells (beams, rays) generate sequence steps for independent attack rolls.
- `auto-hit`: spells with a top-level `damage` effect but no `deliveryMethod` and no top-level `save`. Damage is applied directly without an attack roll. Multi-instance auto-hit spells (e.g. Magic Missile) generate sequence steps for independent resolution. HP-threshold gating is applied when `resolution.hpThreshold` is present.
- `effects`: spells with a top-level `save` effect or a `hit-points` heal effect. The adapter injects the caster's spell save DC into save effects and the spellcasting ability modifier into `hit-points` effects where `abilityModifier` is `true`. Healing spells use `single-creature` targeting (any living combatant including self and allies). The engine's `applyActionEffects` handles save branching, damage, healing, conditions, states, and notes recursively.
- `log-only`: all other spells (utility, buff, stubs). The adapter generates a log-text summary from effect text or the spell description.

Adapter inputs derived from the caster:

- `spellSaveDc`: 8 + proficiency bonus + spellcasting ability modifier
- `spellAttackBonus`: proficiency bonus + spellcasting ability modifier
- `spellcastingAbilityModifier`: spellcasting ability modifier (injected into healing dice expressions)
- `casterLevel`: used to resolve cantrip level scaling (damage dice and instance count thresholds)

### Creature Type Targeting

`CombatantInstance.creatureType` carries the creature's type at runtime. PCs currently default to `'humanoid'` (shim — will be derived from race/species once modeled). Monsters derive their type from `Monster.type`.

`CombatActionTargetingProfile.creatureTypeFilter` restricts valid targets by creature type. Both the resolution engine (`getActionTargets`) and the encounter UI (`availableActionTargets`) enforce this filter. Combatants without a `creatureType` are excluded when a filter is active.

### Charmed Hostile-Action Restriction

When a combatant has the `charmed` condition, the `sourceInstanceId` on the condition marker identifies the charmer. The targeting system prevents the charmed combatant from selecting the charmer as a target for hostile actions (attacks, offensive spells, area effects).

`isHostileAction` classifies an action as hostile when its targeting kind is `single-target`, `all-enemies`, `entered-during-move`, or absent (default enemy targeting). Actions with `self`, `single-creature`, or `dead-creature` targeting are not hostile.

### Known Unsupported Spell Mechanics

The following spell mechanics are not yet fully resolved by the combat adapter:

- ~~Self-buff spells~~ — **resolved**: modifier/immunity spells with any range now classify as `effects` mode
- ~~Auto-hit spells~~ — **resolved**: `auto-hit` resolution mode skips attack roll, applies damage directly; multi-instance spells generate sequence steps
- ~~Concentration tracking~~ — **resolved**: `ConcentrationState` on `CombatantInstance` with damage-triggered CON saves and linked effect cleanup
- ~~Repeat saves~~ — **resolved**: `condition.repeatSave` registers turn hooks for automatic save-or-remove at turn boundaries
- ~~Damage type resistance~~ — **resolved**: `DamageResistanceMarker` on `CombatantInstance`; damage application halves/doubles matching damage
- ~~HP-threshold gating~~ — **resolved**: `resolution.hpThreshold` gates effect application; used by Power Word Kill/Stun/Heal
- Spell slot resource management
- Healing upcasting (`extra-healing` scaling category is authored but not yet resolved at runtime)
- Charmed save advantage when allies are fighting the target (authored as `save.text`, not yet resolved)
- Form changes (Polymorph, Shapechange — stat block replacement)
- Caster-choice mechanics (element selection, condition selection at cast time)
- Multi-area targeting and deduplication (e.g. Meteor Swarm)
- Moving areas and trigger-timing resolution (e.g. Flaming Sphere, Cloudkill)
- Success/failure tracking (e.g. Flesh to Stone, Contagion)

Mechanics resolved since initial authoring:

- **Modifier effects**: `armor_class` (add/set), `speed` (add/set/multiply), and `resistance` (add) are fully resolved. Other stat targets log gracefully.
- **Roll-modifier effects**: advantage/disadvantage tracked on `CombatantInstance.rollModifiers` and applied to attack rolls and saving throws.
- **Interval/ongoing effects**: interval effects register as turn hooks; `state.ongoingEffects` also register as turn hooks for per-turn resolution.
- **Concentration**: automatic CON saves on damage, linked effect cleanup on failure or new concentration spell.
- **Repeat saves**: `condition.repeatSave` and `state.repeatSave` register turn hooks that roll saves at turn boundaries; on success, the condition/state is removed.
- **Damage resistance**: `DamageResistanceMarker` tracks active resistances/vulnerabilities; `applyDamageToCombatant` halves or doubles matching damage types.
- **Auto-hit resolution**: `auto-hit` action mode skips attack rolls; multi-instance spells generate sequence steps for independent resolution.
- **HP-threshold gating**: `CombatActionDefinition.hpThreshold` gates effect application on target current HP vs threshold.
- **Advanced effect logging**: `trigger`, `activation`, `check`, `grant`, `form`, and `targeting` effects log meaningful summaries instead of "unsupported".

## 11. Anti-Patterns

- duplicating range, duration, or concentration in multiple places without a real distinction
- inventing domain-specific effect kinds when a shared one already exists
- encoding unsupported mechanics with misleading structure
- mixing naming styles for equivalent discriminants
- using `note` as a substitute for already-supported structure
- overfitting authored content to current combat or runtime limits
- letting runtime adapter needs dictate content schema
- repeating full rules text inside effects when an owning description field already exists

## 12. Effect Type Scaling Tiers

How effect kinds evolve as more spells are authored:

### Tier 1 — Canonical, Fully Resolved

Already stable. No scaling concerns.

- `save`, `damage`, `hit-points`, `condition` (including `repeatSave`), `state` (including `repeatSave`), `note`, `targeting`

### Tier 2 — Extended Partial Support

Small, bounded engine changes with high payoff.

- `modifier`: `armor_class` (add/set), `speed` (add/set/multiply), and `resistance` (add) are fully resolved. Other stat targets (`attack`, `damage_bonus`, saving throw modifiers) log gracefully until resolved.
- `immunity`: `spell` and `source-action` scopes resolved. Condition immunity scopes remain under-modeled.

### Tier 3 — New Runtime Resolution

Medium engine work, now landed.

- `roll-modifier`: advantage/disadvantage tracked as runtime state on `CombatantInstance.rollModifiers`; wired into attack-roll and saving throw resolution.
- `interval`: per-turn effect application via turn hooks. Registered by `applyActionEffects` when an interval effect is applied.
- `move`: forced movement logged with structured summary. Actual position tracking deferred.

### Tier 4 — Deferred / Under-Model

Follow the extension policy: under-model first, promote only when the pattern proves repeatable.

- `trigger`, `activation`, `form`, `spawn`, `aura`, `check`, `grant` (runtime), `containment`, `visibility-rule`, `hold-breath`, `tracked-part`, `extra-reaction`, `resource`, `formula`
- These remain authored as structured content but resolve to log-text at runtime until demand justifies engine investment.

### Key Scaling Principle

Content authoring should continue aggressively using the full `Effect` vocabulary regardless of runtime support. The adapter degrades unsupported kinds to log-text gracefully. This means:

- Author all spells fully even if the engine can't resolve them yet.
- Engine catches up stage by stage, each time unlocking a batch of already-authored spells.
- This avoids the anti-pattern of authoring content to match current runtime limits (Section 11).

## 13. Monster Effect Status

Status of monster-specific and cross-cutting effect kinds, using the standard maturity labels.

### `regeneration`

- Status: `provisional`
- A declarative effect kind encapsulating turn-triggered healing, damage-type suppression, and zero-HP disablement.
- The trait adapter (`monster-runtime.ts`) converts a `regeneration` effect into a `RuntimeTurnHook` with the appropriate suppression, boundary, and requirement configuration.
- Used by: Troll.

### `tracked-part`

- Status: `provisional`
- Definition variant (`initialCount`, `loss`, `regrowth`): fully seeded at encounter start. Loss from damage and turn-end regrowth handled by `marker-lifecycle.ts`.
- Change variant (`change.mode: 'sever' | 'grow'`): now mechanically applied inside `executeTurnHooks` when a hook fires a `tracked-part` effect with a `change` field.
- Used by: Hydra (definition), Troll Loathsome Limbs (change).

### `remove-classification`

- Status: `provisional`
- Removes all states on a target whose `classification` array includes the given value.
- Also cleans up associated turn hooks.
- Used by: Remove Curse (`classification: 'curse'`).

### `extra-reaction`

- Status: `under-modeled`
- Authored as structured data but not enforced at runtime. The encounter engine does not yet track per-head reaction pools.
- Used by: Hydra Reactive Heads.

### `spawn`

- Status: `under-modeled`
- Authored but does not create a simulated combatant in the encounter. Logged as a note.
- Used by: Troll Loathsome Limbs.

### `hold-breath`

- Status: `under-modeled`
- Authored but no breath-tracking runtime exists.
- Used by: Hydra.

### `interval` (non-turn cadence)

- Status: `under-modeled`
- When `every.unit` is not `'turn'`, the interval effect is deferred with a log note rather than registered as a per-turn hook.
- Used by: Mummy Rot (24-hour cadence).

### RuntimeMarker `classification`

The `classification: string[]` field on `RuntimeMarker` is the canonical mechanism for semantic effect categories. Well-known values:

- `curse` — removable by Remove Curse
- `disease` — future: removable by Lesser/Greater Restoration
- `poison` — future: removable by Protection from Poison
- `magical` — future: dispellable, detectable by Detect Magic
- `regeneration` — future: interactable by healing-prevention effects

Effects that carry a `classification` propagate it through `buildRuntimeMarker` to the resulting condition or state marker.

## 14. Extension Policy

Add a new shared effect kind only when all of the following are true:

- the pattern is recurring
- it applies across more than one domain
- existing shared primitives cannot represent it honestly
- it has a stable ownership boundary
- it reduces duplication instead of creating another dialect

Do not add a new shared effect kind:

- for one spell
- for one monster
- only for runtime convenience

Default decision rule:

- under-model first
- document the gap
- promote to a shared primitive only after the pattern proves repeatable
