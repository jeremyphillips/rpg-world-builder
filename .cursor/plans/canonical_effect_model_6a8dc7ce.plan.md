---
name: Canonical Effect Model
overview: Define a single canonical effect schema that classes, monsters, spells, magic items, and enchantments all author directly, then migrate existing content until normalization layers can be deleted. Include a docs deliverable so the target model and migration rules are explicit for future content work.
todos:
  - id: freeze-canonical-effect-schema
    content: Redesign `effects.types.ts` into the single canonical authoring schema for all effect-bearing content.
    status: pending
  - id: migrate-classes-to-canonical-effects
    content: Convert class and subclass feature data so all effects are authored directly as canonical `Effect[]`.
    status: pending
  - id: migrate-monsters-off-parallel-dsl
    content: Replace monster-specific effect/action/trait rule DSL types with canonical effect structures.
    status: pending
  - id: remove-descriptor-based-translation
    content: Delete enchantment and item descriptor normalization by migrating those sources to canonical effects.
    status: pending
  - id: publish-effect-model-doc
    content: Add a permanent docs file in `docs/` that defines the canonical effect model, migration rules, and forbidden legacy shapes.
    status: pending
isProject: false
---

# Canonical Effect Model

## Goal

Move the codebase to one effect authoring model so content is stored in the same shape it is executed in. The end state is:

- no source-specific normalization step for effects
- no parallel DSLs for monsters, classes, enchantments, and items
- one shared vocabulary for triggers, duration, cadence, targeting, application, and payloads
- one set of tests that every content source must satisfy
- one repo doc that defines the canonical model and migration rules: [docs/plans/effect_model_unification.md](docs/plans/effect_model_unification.md)

## Current Gaps To Close

The current duplication is structural, not cosmetic:

- runtime effects live in [src/features/mechanics/domain/effects/effects.types.ts](src/features/mechanics/domain/effects/effects.types.ts)
- monsters still use a parallel DSL in [src/features/content/monsters/domain/types/monster-effects.types.ts](src/features/content/monsters/domain/types/monster-effects.types.ts) and adjacent monster action/trait types
- subclasses still contain transitional custom payloads in [src/features/content/classes/domain/types/subclass.types.ts](src/features/content/classes/domain/types/subclass.types.ts)
- enchantments still depend on descriptor translation in [src/features/mechanics/domain/effects/descriptors/resolveEffectDescriptors.ts](src/features/mechanics/domain/effects/descriptors/resolveEffectDescriptors.ts)

```1:8:src/features/mechanics/domain/effects/effects.types.ts
import type { Condition } from '../conditions/condition.types';
import type { TriggerType } from '../triggers/trigger.types';
import type { StatTarget } from '../resolution/stat-resolver';
import type { FormulaEffect } from '../resolution/formula.engine';
import type { DiceOrFlat } from '../dice/dice.types';
import type { AbilityKey } from '../core/character';
import type { EffectDuration } from './timing.types';
```

```21:33:src/features/content/monsters/domain/types/monster-effects.types.ts
export type MonsterEffect =
  | MonsterConditionEffect
  | MonsterRollModifierEffect
  | { kind: 'damage'; damage: DiceOrFlat; damageType?: DamageType }
  | {
      kind: 'state';
      state: string;
      targetSizeMax?: MonsterSizeCategory;
```

```20:38:src/features/content/classes/domain/types/subclass.types.ts
type SubclassSaveEffect = {
  kind: 'save'
  ability: AbilityId
  onFail: {
    applyCondition: string
  }
}

type SubclassTriggerFeature = SubclassFeatureBase & {
  kind: 'trigger'
  trigger: TriggerType
```

## Target End-State Schema

Expand `effects.types.ts` from a runtime-only union into the canonical content schema. The model should be authored directly by catalogs and content forms.

Core concepts to standardize:

- `EffectMeta`: source, condition, duration, priority, text fallback
- `Targeting`: self, target, ally, area, entered-space, one-creature, creatures-in-area
- `Trigger`: attack, weapon_hit, hit, failed_save, successful_save, turn_start, turn_end, after_damage, contact, environment, movement, form-state
- `Cadence`: uses, recharge, interval, suppression windows
- `Payload`: formula, modifier, bonus, grant, condition, state, damage, move, resource, action, summon/spawn, note
- `Outcome`: on hit, on fail, on success, ongoing, death outcome, immunity windows

Recommended architectural move:

- promote a canonical `Effect` plus a small set of nested supporting types
- allow a narrow `CustomEffect` escape hatch only for truly unknown mechanics
- remove monster-specific top-level DSL types once migrated
- replace class custom feature payloads with plain canonical effects
- replace enchantment descriptors with canonical effects authored directly

## Recommended Migration Order

### 1. Freeze the canonical schema

Primary files:

- [src/features/mechanics/domain/effects/effects.types.ts](src/features/mechanics/domain/effects/effects.types.ts)
- [src/features/mechanics/domain/effects/timing.types.ts](src/features/mechanics/domain/effects/timing.types.ts)
- [src/features/mechanics/domain/conditions/condition.types.ts](src/features/mechanics/domain/conditions/condition.types.ts)
- [src/features/mechanics/domain/triggers/trigger.types.ts](src/features/mechanics/domain/triggers/trigger.types.ts)

Deliverables:

- one canonical `Effect` tree suitable for both content authoring and runtime use
- explicit decisions on `save`, `state`, `condition`, `interval`, `suppression`, `uses`, and `recharge`
- remove transitional payloads that only exist because some sources are not migrated yet

### 2. Make classes a first-class adopter

Primary files:

- [src/features/content/classes/domain/types/subclass.types.ts](src/features/content/classes/domain/types/subclass.types.ts)
- [src/features/mechanics/domain/core/rules/systemCatalog.classes.ts](src/features/mechanics/domain/core/rules/systemCatalog.classes.ts)

Deliverables:

- delete `active_buff` and custom subclass save payloads
- make subclass features author canonical `Effect[]` directly
- flatten nested transitional wrappers where possible

Success criteria:

- `Combat Superiority`, `Sacred Weapon`, `Draconic Ancestry`, and `Unarmored Defense` all use only canonical effect types

### 3. Convert monsters from parallel DSL to canonical effects

Primary files:

- [src/features/content/monsters/domain/types/monster-actions.types.ts](src/features/content/monsters/domain/types/monster-actions.types.ts)
- [src/features/content/monsters/domain/types/monster-effects.types.ts](src/features/content/monsters/domain/types/monster-effects.types.ts)
- [src/features/content/monsters/domain/types/monster-traits.types.ts](src/features/content/monsters/domain/types/monster-traits.types.ts)
- [src/features/mechanics/domain/core/rules/systemCatalog.monsters.ts](src/features/mechanics/domain/core/rules/systemCatalog.monsters.ts)

Migration rule:

- stop preserving a separate monster effect language
- monster actions and traits should author canonical effect trees directly, with action metadata only where needed for UI/combat presentation

Success criteria:

- `Pack Tactics`, `Rampage`, `Regeneration`, `Dreadful Glare`, `Rotting Fist`, `Engulf`, and `Multiple Heads` are expressible without `MonsterEffect`, `MonsterActionRule`, or `MonsterTraitRule`

### 4. Remove descriptor translation for enchantments and items

Primary files:

- [src/features/content/enchantments/domain/types/enchantment.types.ts](src/features/content/enchantments/domain/types/enchantment.types.ts)
- [src/features/mechanics/domain/effects/descriptors/resolveEffectDescriptors.ts](src/features/mechanics/domain/effects/descriptors/resolveEffectDescriptors.ts)
- [src/features/mechanics/domain/effects/sources/enchantments-to-effects.ts](src/features/mechanics/domain/effects/sources/enchantments-to-effects.ts)
- [src/features/mechanics/domain/effects/sources/magic-items-to-effects.ts](src/features/mechanics/domain/effects/sources/magic-items-to-effects.ts)

Deliverables:

- enchantments and items author canonical effects directly
- delete `EffectDescriptor` and the descriptor resolver
- source adapters become selection/filtering only, not semantic translation

### 5. Align spells with the same schema

Primary files:

- [src/features/content/spells/domain/types/spell.types.ts](src/features/content/spells/domain/types/spell.types.ts)
- [src/features/mechanics/domain/core/rules/systemCatalog.spells.ts](src/features/mechanics/domain/core/rules/systemCatalog.spells.ts)

Deliverables:

- spells use canonical timing/effect payloads instead of placeholder notes wherever possible
- concentration, duration, save results, and area targeting use the same types as monsters and class features

### 6. Delete normalization layers

Delete once migrations are complete:

- source-specific effect normalization functions
- monster-specific effect DSL files
- transitional subclass custom payloads
- descriptor resolver machinery
- tests that assert old normalization behavior instead of canonical authoring

## Docs Deliverable

Add a permanent design doc at [docs/plans/effect_model_unification.md](docs/plans/effect_model_unification.md) with:

- canonical type definitions and vocabulary rules
- allowed effect patterns with examples
- migration status by source: classes, monsters, spells, enchantments, items
- forbidden legacy shapes such as `active_buff`, `EffectDescriptor`, `MonsterActionRule`, and source-only trigger aliases
- a checklist for adding new content without introducing new dialects

## Test Strategy

Prioritize tests that enforce convergence rather than adapter behavior.

1. Canonical schema tests
  Assert valid and invalid effect shapes at the type and runtime-contract level.
2. Cross-source parity tests
  The same mechanic authored by a class, monster, spell, or item should produce the same runtime behavior with no translation layer.
3. Resolution contract tests
  Lock formula selection, modifier application order, condition gating, trigger matching, and duration handling.
4. Content migration regression tests
  Snapshot a small set of representative entries from each source during migration.

Best anchor cases:

- class: `Combat Superiority`, `Sacred Weapon`, `Draconic Ancestry`
- monster: `Pack Tactics`, `Regeneration`, `Dreadful Glare`, `Engulf`
- item: `Ring of Protection`, `Flame Tongue`, `Gauntlets of Ogre Power`
- spell: one concentration spell, one save-based spell, one persistent-area spell

## Definition Of Done

The unification is complete when all of these are true:

- all content sources author the same `Effect` schema directly
- there is no semantic normalization step between content and runtime
- monster/class/item/spell effects share one vocabulary for duration, trigger, and targeting
- legacy effect dialects and descriptor translators are deleted
- the docs file in `docs/` is the authoritative contract for future effect authoring

