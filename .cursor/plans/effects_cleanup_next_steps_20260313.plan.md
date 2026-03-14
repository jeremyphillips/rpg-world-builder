---
name: Effects Cleanup Next Steps
overview: Concrete follow-up plan for removing the remaining monster-only effect DSL, tightening the canonical effect schema, and converging spells on the same authoring vocabulary.
todos:
  - id: audit-monster-legacy-shapes
    content: Inventory and classify the remaining monster-only action, trait, and effect shapes.
    status: completed
  - id: resolve-monster-shape-mapping
    content: Decide which remaining monster rules become canonical effect kinds versus narrow CustomEffect contracts.
    status: completed
  - id: migrate-monster-authored-data
    content: Rewrite remaining monster catalog entries to author canonical Effect trees directly.
    status: completed
  - id: delete-monster-wrapper-types
    content: Remove MonsterEffect, MonsterOnHitEffect, MonsterTriggeredSave, MonsterActionTrigger, and related wrapper unions after data migration.
    status: completed
  - id: tighten-canonical-effects
    content: Remove dead compatibility types and narrow loose canonical effect payloads in effects.types.ts.
    status: pending
  - id: migrate-representative-spells
    content: Convert representative spells away from note-heavy authoring to structured canonical effects.
    status: pending
  - id: add-effect-guardrails
    content: Add tests and docs that forbid reintroducing source-specific effect dialects.
    status: completed
isProject: false
---

# Effects Cleanup Next Steps

## Goal

Finish the transition from "mostly canonical" to "actually canonical" for effect authoring.

The remaining work should:

- remove the last monster-only effect wrappers and meta-rule objects
- tighten `src/features/mechanics/domain/effects/effects.types.ts` so it is the authoritative contract
- move representative spells onto the same structured vocabulary
- add guardrails so old dialects do not return

## Current Remaining Cleanup Targets

### Monster-only wrappers still in the type layer

Remaining wrappers and special cases:

- documented monster-only `custom` contracts:
  - `monster.action_modifier`
  - `monster.resource_from_tracked_parts`
  - `monster.save_exception`

### Monster trait/action meta-rules still outside the canonical model

Authored today in:

- `src/features/mechanics/domain/core/rules/systemCatalog.monsters.ts`

Remaining meta-rules:

- `trigger`
- `requirements`
- `suppression`
- `uses`

### Canonical effect types that are still migration-loose

Primary file:

- `src/features/mechanics/domain/effects/effects.types.ts`

Notable cleanup targets:

- broad string payloads for ids and enums that should eventually use vocab-backed types

### Spell authoring that still relies too heavily on notes

Primary file:

- `src/features/mechanics/domain/core/rules/systemCatalog.spells.ts`

Representative patterns to convert:

- save-gated spells
- concentration spells
- persistent-area spells
- invisibility / transformation / ongoing-condition spells

## Recommended Decision Framework

### When to add a canonical effect kind

Use a new canonical kind when the mechanic:

- affects runtime resolution or combat state
- appears in more than one monster or is likely reusable by spells, hazards, items, or classes
- would become unclear or opaque if represented as generic `custom`

### When to use `CustomEffect`

Use `CustomEffect` only when the mechanic is:

- genuinely narrow
- hard to model without distorting the shared schema
- still unresolved enough that a dedicated canonical kind would be guesswork

`CustomEffect` must always have:

- a stable `id`
- a documented `params` shape
- a clear migration note about whether it is intended to stay custom or be replaced later

## Recommended Mapping For Remaining Monster Shapes

### Strong recommendations

1. `MonsterActionTrigger` -> canonical `trigger`

Recommended approach:

- remove the monster-specific wrapper
- use `TriggeredEffect` directly around the action outcome payload
- extend shared `TriggerType` only if the monster trigger cannot be expressed with existing ids

1. `MonsterTriggeredSave` -> canonical `save`

Recommended approach:

- remove the monster-specific wrapper
- author `SaveEffect` directly
- keep exceptions such as damage-type carveouts as either:
  - canonical `condition` / `condition` metadata if already modeled
  - a narrow `CustomEffect` if truly exceptional

1. `MonsterOnHitEffect` and `MonsterAppliedEffect` -> plain `Effect[]`

Recommended approach:

- collapse these aliases entirely
- use `Effect[]` for `onHitEffects`, `onFail`, `onSuccess`, and trait `effects`

1. `kind: 'limb'` -> extend `tracked_part`, do not keep a free-standing monster-only kind

Recommended approach:

- represent tracked anatomy with `tracked_part`
- extend `TrackedPartEffect` if needed to cover immediate sever/grow transitions
- avoid a separate monster-only mini-language for limb manipulation

### Recommended new canonical additions

1. `check`

Use case:

- current `MonsterTraitCheckRule`

Why canonical:

- this is the non-save equivalent of `save`
- it is reusable for hazards, traps, engulf/swallow escapes, and environmental interactions

Proposed shape direction:

- actor scope
- ability and optional skill
- dc
- optional action requirement
- `onSuccess` / `onFail`

1. `containment`

Use case:

- engulf/swallow-style occupancy rules

Why canonical:

- it changes target positioning, occupancy, and downstream resolution
- it is too semantic to hide in notes or generic custom blobs if it affects play

Proposed shape direction:

- canContainCreatures
- fillsEntireSpace
- cover granted to contained creatures
- capacity by size category

1. `visibility_rule`

Use case:

- transparency / notice-check / visibility handling in monster traits

Why canonical:

- this is runtime-facing and distinct from content access policy visibility

Proposed shape direction:

- transparent
- notice check definition
- optional exceptions such as witnessed movement/action

### Recommended temporary custom contracts

1. `custom` id: `monster.action_modifier`

Use case:

- current `modifiesAction` rules

Reason to keep custom for now:

- likely narrow
- semantics depend on downstream action-resolution architecture that is not yet generalized

Exit criteria:

- replace with a canonical `action_modifier` effect only if a second source needs the same mechanic

1. `custom` id: `monster.resource_from_tracked_parts`

Use case:

- current monster-only exhaustion/per-missing-limb resource adjustment

Reason to keep custom for now:

- tied closely to tracked-part resolution
- may deserve a more general "derived resource modifier" concept later, but not necessarily yet

Exit criteria:

- replace once a second shared use case appears or `resource` grows a clean derived-value contract

## Phase Plan

### Phase 1: Audit and classify remaining monster legacy shapes

Primary files:

- `src/features/content/monsters/domain/types/monster-effects.types.ts`
- `src/features/content/monsters/domain/types/monster-actions.types.ts`
- `src/features/content/monsters/domain/types/monster-traits.types.ts`
- `src/features/mechanics/domain/core/rules/systemCatalog.monsters.ts`

Tasks:

1. Enumerate every remaining authored use of:
  - `MonsterTriggeredSave`
  - `MonsterActionTrigger`
  - `modifiesAction`
  - `checks`
  - `containment`
  - `visibility`
  - `kind: 'limb'`
  - monster-only `resource`
2. Tag each as:
  - canonical existing
  - canonical new kind needed
  - narrow `CustomEffect`
3. Record representative catalog entries that exercise each case.

Deliverable:

- one inventory table with exact file/code locations and target mapping

Phase 1 inventory:


| Legacy shape            | Type-layer location                                                                                                                                                                                      | Remaining authored use                                                                                                                                         | Representative catalog entry | Target mapping                                                                                               | Classification            | Notes                                                                                                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MonsterActionTrigger`  | `src/features/content/monsters/domain/types/monster-effects.types.ts` -> `MonsterActionTrigger`; `src/features/content/monsters/domain/types/monster-actions.types.ts` -> `MonsterSpecialAction.trigger` | `src/features/mechanics/domain/core/rules/systemCatalog.monsters.ts` -> `Gnoll Warrior` -> bonus action `Rampage`                                              | `Rampage`                    | Replace action-level wrapper with canonical `trigger` effect wrapping the movement + action sequence outcome | canonical existing        | Shared trigger vocabulary still needs a way to express `after_damage` gated by `targetState: 'bloodied'`; this is trigger-surface work, not a new monster-only effect kind             |
| `MonsterTriggeredSave`  | `src/features/content/monsters/domain/types/monster-effects.types.ts` -> `MonsterTriggeredSave`; `src/features/content/monsters/domain/types/monster-traits.types.ts` -> `MonsterTrait.save`             | `src/features/mechanics/domain/core/rules/systemCatalog.monsters.ts` -> `Zombie` -> trait `Undead Fortitude`                                                   | `Undead Fortitude`           | Replace trait-level wrapper with canonical `save` effect                                                     | canonical existing        | The save itself is canonical; the `except` carveout for radiant / critical-hit bypass likely needs either a narrow companion custom contract or a later precondition/gating refinement |
| `modifiesAction`        | `src/features/content/monsters/domain/types/monster-traits.types.ts` -> `MonsterTrait.modifiesAction`                                                                                                    | `src/features/mechanics/domain/core/rules/systemCatalog.monsters.ts` -> `Gelatinous Cube` -> trait `Ooze Cube` -> `Engulf` save disadvantage on `enters_space` | `Ooze Cube`                  | Temporary `custom` effect with id `monster.action_modifier`                                                  | narrow `CustomEffect`     | Keep custom until a second non-monster source needs the same action-resolution hook                                                                                                    |
| `checks`                | `src/features/content/monsters/domain/types/monster-traits.types.ts` -> `MonsterTrait.checks` / `MonsterTraitCheckRule`                                                                                  | `src/features/mechanics/domain/core/rules/systemCatalog.monsters.ts` -> `Gelatinous Cube` -> trait `Ooze Cube` -> `Pull From Cube` / `Pull Object From Cube`   | `Ooze Cube`                  | New canonical `check` effect                                                                                 | canonical new kind needed | Reusable for escape, trap, hazard, and environment interactions; shape should preserve actor, optional action requirement, DC, and `onSuccess` / `onFail` effects                      |
| `containment`           | `src/features/content/monsters/domain/types/monster-traits.types.ts` -> `MonsterTrait.containment` / `MonsterContainmentRule`                                                                            | `src/features/mechanics/domain/core/rules/systemCatalog.monsters.ts` -> `Gelatinous Cube` -> trait `Ooze Cube`                                                 | `Ooze Cube`                  | New canonical `containment` effect                                                                           | canonical new kind needed | Runtime-facing occupancy and cover semantics are too important to hide in notes or custom blobs                                                                                        |
| `visibility`            | `src/features/content/monsters/domain/types/monster-traits.types.ts` -> `MonsterTrait.visibility` / `MonsterVisibilityRule`                                                                              | `src/features/mechanics/domain/core/rules/systemCatalog.monsters.ts` -> `Gelatinous Cube` -> traits `Ooze Cube` and `Transparent`                              | `Ooze Cube`, `Transparent`   | New canonical `visibility_rule` effect                                                                       | canonical new kind needed | Covers both passive transparency and notice-check logic with witnessed-action exceptions                                                                                               |
| `kind: 'limb'`          | `src/features/content/monsters/domain/types/monster-effects.types.ts` -> inline `MonsterEffect` limb variant                                                                                             | `src/features/mechanics/domain/core/rules/systemCatalog.monsters.ts` -> `Troll` -> trait `Loathsome Limbs`                                                     | `Loathsome Limbs`            | Fold into canonical `tracked_part` instead of keeping a separate monster-only effect kind                    | canonical existing        | Likely needs a small `tracked_part` extension for immediate sever / grow transitions authored outside the baseline tracked anatomy setup                                               |
| monster-only `resource` | `src/features/content/monsters/domain/types/monster-effects.types.ts` -> inline `MonsterEffect` resource variant                                                                                         | `src/features/mechanics/domain/core/rules/systemCatalog.monsters.ts` -> `Troll` -> trait `Loathsome Limbs` -> exhaustion `per-missing-limb`                    | `Loathsome Limbs`            | Temporary `custom` effect with id `monster.resource_from_tracked_parts`                                      | narrow `CustomEffect`     | Keep custom unless shared derived-resource semantics emerge elsewhere                                                                                                                  |


### Phase 2: Add the minimal remaining canonical surface

Primary file:

- `src/features/mechanics/domain/effects/effects.types.ts`

Recommended additions in this phase:

- `CheckEffect`
- `ContainmentEffect`
- `VisibilityRuleEffect`
- any small extension needed for `TrackedPartEffect`

Tasks:

1. Add only the missing shared kinds needed to remove the monster wrappers.
2. Keep fields narrow and reusable.
3. Prefer nested `Effect[]` outcomes over bespoke payload nesting.
4. Document any temporary `CustomEffect` ids added in this phase.

Success criteria:

- monster cleanup can proceed without inventing new monster-specific aliases

### Phase 3: Migrate authored monster data

Primary file:

- `src/features/mechanics/domain/core/rules/systemCatalog.monsters.ts`

Tasks:

1. Rewrite all remaining monster trait/action cases to direct canonical `Effect[]`.
2. Replace trait-level save/check/action modifiers with canonical or documented custom effects.
3. Fold action/trait trigger wrappers into canonical `trigger` usage where appropriate.
4. Remove rule-shaped metadata that has become executable effect data.

Priority monsters / actions:

- `Engulf`
- any transparent / notice-check creature
- any swallow / containment creature
- any limb-loss / hydra-adjacent creature

Success criteria:

- no remaining authored monster content depends on monster-specific effect wrappers

Status update:

- completed for current monster catalog entries in `systemCatalog.monsters.ts`
- migrated cases now use canonical `save`, `check`, `containment`, `visibility_rule`, `trigger`, and `tracked_part` effects plus documented temporary `custom` ids where needed

### Phase 4: Delete monster wrapper types

Primary files:

- `src/features/content/monsters/domain/types/monster-effects.types.ts`
- `src/features/content/monsters/domain/types/monster-actions.types.ts`
- `src/features/content/monsters/domain/types/monster-traits.types.ts`

Tasks:

1. Remove:
  - `MonsterEffect`
  - `MonsterAppliedEffect`
  - `MonsterOnHitEffect`
  - `MonsterTriggeredSave`
  - `MonsterActionTrigger`
2. Update monster action and trait types so they point at canonical `Effect[]`.
3. Remove any imports that only existed for the wrapper DSL.

Status update:

- completed for `MonsterEffect`, `MonsterAppliedEffect`, `MonsterOnHitEffect`, `MonsterTriggeredSave`, and `MonsterActionTrigger`
- completed for monster trait/action wrapper fields (`save`, `modifiesAction`, `checks`, `containment`, `visibility`, action-level `trigger`)
- monster action and trait types now point directly at shared `Effect[]`

Success criteria:

- monster types describe presentation/combat structure only
- effect semantics come exclusively from shared canonical effect types

### Phase 5: Tighten the canonical schema

Primary file:

- `src/features/mechanics/domain/effects/effects.types.ts`

Tasks:

1. Remove `BonusEffect` if `modifier` fully supersedes it.
2. Replace `GrantEffect.value: unknown` with discriminated grant payloads.
3. Split `ModifierValue` into smaller, more explicit value variants if it keeps growing.
4. Replace obvious stringly typed ids with vocab types where stable vocab already exists.

Status update:

- completed for `BonusEffect`
- completed for discriminated `GrantEffect` payloads
- completed for splitting `ModifierValue` into explicit variants
- remaining follow-up is the broader stringly-typed id/vocab tightening work

Success criteria:

- the shared effect schema is simpler and stricter than the migrated source adapters it replaced

### Phase 6: Convert representative spells

Primary file:

- `src/features/mechanics/domain/core/rules/systemCatalog.spells.ts`

Tasks:

1. Pick one spell for each pattern:
  - save-gated
  - concentration
  - persistent area
  - invisibility / altered visibility
2. Convert those entries away from note-heavy authoring.
3. Reuse the same `save`, `condition`, `targeting`, `interval`, `visibility_rule`, and duration structures used by monsters/classes/items.

Success criteria:

- the canonical model is demonstrated across at least classes, monsters, items, enchantments, and representative spells

### Phase 7: Add guardrails

Primary files:

- `src/features/mechanics/domain/core/rules/systemCatalog.normalization.test.ts`
- monster/effect source tests
- `docs/EFFECT_MODEL_UNIFICATION_PLAN.md`

Tasks:

1. Add regression assertions that legacy monster effect wrappers are gone.
2. Add representative content snapshots for migrated monster and spell cases.
3. Update docs with:
  - newly added canonical effect kinds
  - allowed `CustomEffect` ids
  - forbidden legacy shapes

Status update:

- regression assertions have been added for migrated monster save/trigger/meta-rule cases
- `docs/EFFECT_MODEL_UNIFICATION_PLAN.md` now documents the new canonical kinds, allowed temporary `CustomEffect` ids, and forbidden legacy shapes
- catalog-wide guardrail coverage now forbids reintroducing legacy monster wrapper fields and legacy monster-only effect payloads
- remaining follow-up is adding representative spell snapshots once spell migration lands

Success criteria:

- future migrations cannot silently reintroduce source-specific effect DSLs

## Concrete First Slice

If doing this incrementally, take this first slice:

1. Audit the remaining monster entries using:
  - `modifiesAction`
  - `checks`
  - `containment`
  - `visibility`
  - `MonsterTriggeredSave`
  - `kind: 'limb'`
2. Add the minimal shared types needed:
  - `check`
  - `containment`
  - `visibility_rule`
  - small `tracked_part` extension if required
3. Migrate those monster entries in `systemCatalog.monsters.ts`.
4. Delete `MonsterTriggeredSave` and `MonsterActionTrigger`.
5. Update tests and docs.

This slice should produce the largest reduction in monster-specific dialect surface with the least schema churn.

## Definition Of Done

This cleanup is complete when all of the following are true:

- monster actions and traits author plain canonical `Effect[]`
- monster-only wrapper unions and save/trigger helpers are deleted
- remaining rare mechanics are either canonical or explicit documented `CustomEffect` contracts
- `effects.types.ts` no longer contains obvious migration-only compatibility baggage
- representative spells use the same structured vocabulary
- tests and docs forbid reintroducing source-specific effect DSLs

