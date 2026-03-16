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
- Use when: modeling targets, areas, sight requirements, target count, repeat-target rules
- Do not use when: storing spell placement range or save/damage outcomes
- Key fields: `target`, `targetType`, `requiresSight`, `count`, `canSelectSameTargetMultipleTimes`, `area`

```ts
{ kind: 'targeting', target: 'creatures-in-area', area: { kind: 'sphere', size: 20 } }
```

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
- Key fields: `conditionId`, `targetSizeMax`, `escapeDc`

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
- Key fields: `text`

```ts
{ kind: 'note', text: "Flammable objects in the area that aren't being worn or carried start burning." }
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
- `hit-points`: `canonical`
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

### Area Effect

- owner range chooses placement
- `targeting.area` describes the template
- `save`, `damage`, and riders describe outcomes after placement

### Intentionally Under-Modeled Effect

- use the supported shared primitives for the parts that are real and repeatable
- put the unsupported remainder in `note` or owned description text

```ts
[
  { kind: 'targeting', target: 'chosen-creatures', count: 3, canSelectSameTargetMultipleTimes: true, requiresSight: true },
  { kind: 'damage', damage: '1d4+1', damageType: 'force', instances: { count: 3, simultaneous: true, canSplitTargets: true, canStackOnSingleTarget: true } },
  { kind: 'note', text: 'Auto-hit and exact simultaneous dart resolution remain intentionally under-modeled.' },
]
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
- Put the unsupported remainder in `note` or owned description text.
- Treat partial modeling as an explicit temporary state, not as complete modeling.
- Document what is under-modeled so future work knows what remains.

Example — Magic Missile currently models targeting, damage, and notes, but does not yet fully model auto-hit semantics, simultaneous resolution, or split/stack nuances.

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

## 10. Adapter Philosophy

Runtime systems should consume spells through adapters.

Rules:

- Spell content reflects the rules cleanly.
- Runtime systems may support only a subset.
- Unsupported spell behavior degrades to log/text.
- Content authoring must not be distorted to satisfy current runtime limits.
- Adapters may translate discriminant naming for runtime constraints, but canonical content does not preserve legacy naming drift.

### Spell Combat Adapter

The spell combat adapter (`buildSpellCombatActions`) converts canonical spell content into executable `CombatActionDefinition` objects for the combat simulation. It classifies spells into three resolution modes:

- `attack-roll`: spells with `deliveryMethod`. The adapter builds an attack profile from the caster's spell attack bonus and the spell's `damage` effect. Multi-instance spells (beams, rays) generate sequence steps for independent attack rolls.
- `effects`: spells with a top-level `save` effect. The adapter injects the caster's spell save DC into save effects where `dc` is unset, strips targeting effects, and passes the enriched effects array to the resolution engine. The engine's `applyActionEffects` handles save branching, damage, conditions, states, and notes recursively.
- `log-only`: all other spells (utility, buff, stubs). The adapter generates a log-text summary from effect text or the spell description.

Adapter inputs derived from the caster:

- `spellSaveDc`: 8 + proficiency bonus + spellcasting ability modifier
- `spellAttackBonus`: proficiency bonus + spellcasting ability modifier
- `casterLevel`: used to resolve cantrip level scaling (damage dice and instance count thresholds)

### Known Unsupported Spell Mechanics

The following spell mechanics are not yet resolved by the combat adapter and remain log-only or under-modeled:

- Healing spells (dice + ability modifier formula not yet in the resolution engine)
- Self-buff spells (effects target the caster, not an enemy)
- Auto-hit spells (Magic Missile — no attack roll, no save)
- Concentration tracking
- Spell slot resource management

## 11. Anti-Patterns

- duplicating range, duration, or concentration in multiple places without a real distinction
- inventing domain-specific effect kinds when a shared one already exists
- encoding unsupported mechanics with misleading structure
- mixing naming styles for equivalent discriminants
- using `note` as a substitute for already-supported structure
- overfitting authored content to current combat or runtime limits
- letting runtime adapter needs dictate content schema
- repeating full rules text inside effects when an owning description field already exists

## 12. Extension Policy

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
