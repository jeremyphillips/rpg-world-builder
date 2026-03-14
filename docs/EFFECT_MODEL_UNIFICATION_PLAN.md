# Effect Model Unification Plan

## Goal

All effect-bearing content should author the same canonical `Effect` schema directly.

This means:
- content data and runtime data use the same shape
- source adapters select/filter effects, but do not translate semantics
- classes, monsters, spells, items, and enchantments share the same vocabulary

## Core Rules

1. Author canonical `Effect[]` directly in content.
2. Prefer first-class effect kinds over `custom`.
3. Prefer shared timing, trigger, save, targeting, and outcome vocabulary over source-specific aliases.
4. Use `custom` only when a mechanic cannot be expressed cleanly with the canonical model.

## Canonical Schema

Every effect may include shared metadata:

- `text`: human-readable fallback summary
- `source`: source label for tracing/debugging
- `condition`: gate for whether the effect applies
- `duration`: structured timing object
- `priority`: conflict resolution / ordering hint

### Canonical Effect Kinds

- `modifier`
  Add, set, or multiply a resolved stat target.

- `formula`
  Define a computed base value such as armor class.

- `grant`
  Grant a proficiency or condition immunity.

- `resource`
  Define a tracked resource with max and recharge behavior.

- `trigger`
  Apply nested effects when a canonical trigger occurs.

- `activation`
  Represent action economy or explicit activation with nested effects.

- `save`
  Represent a saving throw gate with canonical `onFail` / `onSuccess` effect arrays.

- `check`
  Represent non-save ability or skill checks with canonical `onFail` / `onSuccess` effect arrays.

- `condition`
  Apply a named condition directly.

- `damage`
  Apply explicit damage payloads.

- `roll_modifier`
  Apply Advantage or Disadvantage to a defined roll scope.

- `containment`
  Represent occupancy and cover rules for engulf/swallow-style mechanics.

- `visibility_rule`
  Represent transparency and notice-check visibility rules.

- `state`
  Apply a named ongoing state with optional escape and nested effects.

- `move`
  Apply forced movement or movement constraints/results.

- `action`
  Apply an immediate action result such as `hide` or `disengage`.

- `form`
  Apply a form/state-of-being change.

- `spawn`
  Spawn or create a creature/entity result.

- `hit_points`
  Heal or damage hit points directly.

- `aura`
  Apply nested effects in an area or ally/enemy envelope.

- `note`
  Store explicit non-executable rules text.

- `custom`
  Escape hatch for mechanics that are not yet modeled canonically.

### Canonical Supporting Vocabulary

- Trigger:
  Use canonical trigger ids such as `attack`, `weapon_hit`, `hit`, `damage_dealt`, `damage_taken`, `turn_start`, `turn_end`, `spell_cast`.

- Duration:
  Use structured objects from `timing.types.ts`, not ad hoc strings.

- Save:
  Use a dedicated `save` effect with `save.ability`, optional `save.dc`, and canonical `onFail` / `onSuccess` payloads.

- Activation:
  Use `activation` for action economy such as `action`, `bonus_action`, `reaction`, or `special`.

- Conditions:
  Use `condition` for applied named conditions and `condition` metadata for gating applicability.

## Preferred Authoring Patterns

### Passive formula

Use `formula` for always-on derived values.

```ts
{
  kind: 'formula',
  target: 'armor_class',
  formula: { base: 13, ability: 'dexterity' },
  condition: {
    kind: 'state',
    target: 'self',
    property: 'equipment.armorEquipped',
    equals: null,
  },
}
```

### Triggered rider with save

Use `trigger` for the event and `save` for the outcome gate.

```ts
{
  kind: 'trigger',
  trigger: 'weapon_hit',
  cost: { resource: 'superiority_dice', amount: 1 },
  effects: [
    {
      kind: 'modifier',
      target: 'damage',
      mode: 'add',
      value: { dice: 'superiority_dice' },
    },
    {
      kind: 'save',
      save: { ability: 'strength' },
      onFail: [{ kind: 'condition', conditionId: 'prone' }],
    },
  ],
}
```

### Activated buff

Use `activation` for explicit use of action economy and put the resulting timed effects inside it.

```ts
{
  kind: 'activation',
  activation: 'action',
  cost: { resource: 'channel_divinity', amount: 1 },
  effects: [
    {
      kind: 'modifier',
      target: 'attack_roll',
      mode: 'add',
      value: { ability: 'charisma' },
      duration: { kind: 'fixed', value: 1, unit: 'minute' },
    },
  ],
}
```

## Custom Effect Policy

`custom` is a supported escape hatch, but not a default authoring tool.

Use `custom` only when all of the following are true:
- the mechanic cannot be expressed without distorting the canonical model
- the missing concept is genuinely narrow or still unresolved
- the effect has a stable `id` and documented meaning

Do not use `custom` for common mechanics such as:
- saving throws
- checks
- condition application
- duration
- activation/action economy
- damage or numeric modifiers
- common triggered outcomes

### Allowed Custom Effect IDs

The following `custom` ids are currently allowed and documented:

- `monster.action_modifier`
  Temporary contract for action-resolution hooks that alter another authored action.
  Current params shape:
  - `actionName: string`
  - `trigger: { kind: 'enters_space' }`
  - `saveModifier?: 'advantage' | 'disadvantage'`

- `monster.resource_from_tracked_parts`
  Temporary contract for derived resource adjustments based on tracked anatomy.
  Current params shape:
  - `resource: 'exhaustion'`
  - `mode: 'set' | 'add'`
  - `value: 'per-missing-limb'`
  - `part: 'limb'`

- `monster.save_exception`
  Temporary contract for save-bypass carveouts that are not yet modeled as shared effect conditions.
  Current params shape:
  - `damageTypes?: string[]`
  - `criticalHit?: boolean`

## Legacy Shapes To Remove

The following shapes are not part of the target authoring contract:

- `active_buff`
- subclass-only save payloads like `{ kind: 'save', ability, onFail: { applyCondition } }`
- `EffectDescriptor`
- `MonsterAppliedEffect`
- `MonsterOnHitEffect`
- `MonsterTriggeredSave`
- `MonsterActionTrigger`
- source-only trigger aliases such as `on_hit`
- monster trait/action meta-rule fields such as `save`, `modifiesAction`, `checks`, `containment`, and `visibility`
- monster-only effect variants such as `kind: 'limb'` or the special `resource` payload for `per-missing-limb`

## Compatibility Notes

Some compatibility scaffolding still exists while the broader cleanup is being finished.

- some stringly typed identifiers in shared effect payloads still need future tightening where stable vocab types already exist.
- representative spell authoring still needs migration away from note-heavy payloads.

## Migration Status

- Classes: in progress
  Representative class features now use canonical `activation`, `save`, and `condition`.

- Monsters: in progress
  Monster actions and traits now author canonical `Effect[]` directly, former wrapper/meta-rule payloads have been removed, and the remaining monster-specific surface is limited to documented temporary `custom` contracts.

- Spells: partial
  Already store `Effect[]`, but authoring guidance still needs to converge on the canonical vocabulary.

- Enchantments: in progress
  System enchantment templates now author canonical effects directly; remaining work is shared-schema follow-up rather than enchantment-specific translation cleanup.

- Magic items: in progress
  The system item catalog now authors canonical effects directly and no longer relies on broad compatibility casts for modifier payloads, but broader item action/resource modeling still needs follow-up work.

## Authoring Checklist

When adding new effect-bearing content:

- author canonical `Effect[]` directly
- use canonical trigger ids
- use structured durations
- use `activation` for explicit action economy
- use `save` for saving throw gates
- use `check` for non-save ability or skill gates
- use canonical nested `Effect[]` outcomes instead of source-specific payload objects
- use `containment` and `visibility_rule` instead of source-specific monster meta fields
- avoid `custom` unless the mechanic clearly exceeds the current vocabulary
- do not introduce a new source-specific effect DSL
