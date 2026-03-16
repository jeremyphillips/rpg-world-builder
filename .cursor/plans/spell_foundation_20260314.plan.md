---
name: Spell Foundation
overview: Establish spells as canonical content authored with shared effect primitives, normalize timing/effect vocabulary globally, standardize system spell IDs to kebab-case with a manual DB migration path, and define the first repeatable authoring patterns, fixtures, and reference docs before broader spell migration.
todos:
  - id: lock-canonical-vocabulary
    content: Freeze the canonical cross-domain vocabulary for timing/effect discriminants, spell trigger authoring, concentration ownership, and area ownership.
    status: completed
  - id: normalize-system-spell-ids
    content: Convert all `systemCatalog.spells.ts` spell IDs to kebab-case and add a manual DB migration script under `scripts/` for persisted spell references.
    status: completed
  - id: normalize-global-timing-names
    content: Migrate shared timing/effect discriminants and all content/runtime consumers to one canonical naming style.
    status: completed
  - id: loosen-spell-reaction-trigger-typing
    content: Change spell reaction triggers to descriptive strings until the shared trigger model is mature enough to replace them.
    status: completed
  - id: define-save-spell-pattern
    content: Define and document the default save-based spell authoring pattern using shared targeting, save, and outcome effects.
    status: completed
  - id: add-foundation-fixtures
    content: Add anchor fixtures for Fireball and one object-targeting spell to validate the schema and authoring rules.
    status: completed
  - id: document-under-modeling-and-scaling
    content: Document intentional under-modeling rules, targeting scope, adapter philosophy, and reserve a structured scaling extension point.
    status: completed
  - id: publish-authoritative-effects-reference
    content: Create and finalize an authoritative effects reference in `docs/reference/` covering philosophy, current shared shapes, cross-domain usage, and known unsupported/undefined areas.
    status: completed
isProject: false
---

# Spell Foundation

## Goal

Build a solid, repeatable spell foundation that uses the same shared effect primitives as monsters, classes, items, and future runtime adapters without forcing fake precision into spell content.

The target state is:

- spells are canonical content, not runtime action definitions
- system spell IDs are canonical kebab-case identifiers
- shared timing/effect vocabulary is globally consistent
- spell-level metadata stays the primary source of truth
- save-based and area-based spells follow predictable authoring patterns
- unsupported mechanics are intentionally under-modeled and preserved honestly in text/notes
- runtime systems consume spells through adapters and may support only a subset
- the repo has one authoritative effects reference doc for shared authoring guidance

## Locked Decisions

These decisions are already settled and should be treated as plan constraints:

- spells are canonical content
- combat simulation and other runtime systems are adapter consumers
- reaction spell triggers remain descriptive `string` values for now
- fake mapping into the current shared `TriggerType` is not allowed
- shared timing/effect discriminants should be normalized globally now
- spell-level `range` defines where the spell origin or target point may be chosen
- targeting/area effects define who or what is affected after placement
- concentration belongs on spell duration by default
- effect-level duration is only authored when it differs from spell-level duration
- intentionally partial modeling is acceptable when the shared effect schema cannot yet express the full mechanic cleanly

## Priority Order

### 1. Lock the canonical vocabulary contract

Before broad migration work, freeze the naming and ownership rules so cleanup is converging on a stable target instead of creating churn.

Decisions to encode explicitly:

- one discriminant style across domains, preferably `kebab-case`
- use `kind: 'until-turn-boundary'` everywhere
- shared timing/effect names are canonical across spells, monsters, classes, and adapters
- reaction triggers in spells are descriptive strings until replaced by a richer cross-domain trigger model
- spell-level ownership rules:
  - `range` = placement distance
  - `duration` = default spell duration and concentration ownership
  - `castingTime` = casting cadence and reaction trigger text
- effect-level ownership rules:
  - `targeting` = who/what is affected
  - `save` = saving throw and branching outcomes
  - `damage`, `condition`, `modifier`, `immunity`, `note` = result payloads

Primary files:

- `src/features/content/spells/domain/types/spell.types.ts`
- `src/features/mechanics/domain/effects/effects.types.ts`
- `src/features/mechanics/domain/effects/timing.types.ts`
- adjacent timing/trigger consumers

### 2. Normalize shared timing/effect names globally

Do one migration pass now while the churn is manageable.

Scope:

- shared timing/effect types
- class content and consumers
- monster content and consumers
- spell types and spell catalog entries
- combat/runtime adapters and tests

Migration rule:

- content schemas and shared effects conform to the canonical names
- adapters may translate for runtime constraints, but canonical content does not preserve legacy naming drift

Success criteria:

- no mixed `snake_case` / `kebab-case` discriminants for equivalent concepts
- no split vocabulary for turn-boundary duration semantics

### 3. Normalize system spell IDs to kebab-case and add a manual DB migration script

Standardize all spell IDs in `src/features/mechanics/domain/core/rules/systemCatalog.spells.ts` to kebab-case before more content and persistence paths depend on the current mixed naming.

Deliverables:

- convert existing system spell IDs to kebab-case
- update code references that depend on those IDs
- add a manual migration script under `scripts/` for persisted DB records and any other stored spell references
- document any intentionally manual migration steps and safety checks

Migration rule:

- system content IDs should be canonical and human-predictable
- migration scripts may map legacy IDs to canonical IDs, but content should not preserve mixed legacy naming

Success criteria:

- no mixed camelCase spell IDs remain in the system spell catalog
- a repo-local migration path exists for persisted records that still reference legacy spell IDs

### 4. Change spell reaction triggers to descriptive strings

Implement the short-term honest model:

```ts
type SpellCastingTimeMode = {
  value: number;
  unit: CastingTimeUnit;
  trigger?: string;
  ritual?: boolean;
};
```

Rationale:

- avoids fake precision
- keeps spell authoring honest
- avoids forcing spell triggers into an immature shared trigger model

Future direction:

- migrate from `string` to structured shared triggers once the cross-domain trigger model is actually ready

### 5. Define the default save-based spell pattern

This should become the canonical authoring pattern for spells like `Fireball`.

Pattern:

- `targeting` describes who or what is affected
- `save` describes the saving throw
- `save.onFail` / `save.onSuccess` own the branching outcomes
- damage belongs inside save outcomes when the save changes damage

Rule of thumb:

- if a save changes the result, the save owns the branching outcomes

Avoid:

- floating damage effects that rely on prose to explain success/failure branching
- spell text as the only source of save logic when the shared effect schema already fits

### 6. Add foundation fixtures

Add a small fixture set that forces the schema into a repeatable shape before larger spell migration begins.

Initial fixtures:

- `Fireball`
  - save-based
  - area placement from a chosen point
  - area targeting
  - branching damage outcomes
- one object-targeting spell
  - validates non-creature targeting guidance early

Recommended follow-up fixtures after the first pass:

- one concentration spell
- one ritual spell
- `Magic Missile` as an intentionally under-modeled multi-instance spell
- one upcast spell once scaling lands

Success criteria:

- the fixture set is enough to validate save ownership, area ownership, and non-creature targeting

### 7. Document intentional under-modeling, targeting scope, and scaling direction

This is the guidance layer that keeps future authoring honest.

#### Intentional under-modeling rule

Some spells will be only partially modeled when the shared effect schema cannot yet represent the full mechanic cleanly.

Example:

- `Magic Missile` may currently model:
  - targeting
  - damage
  - notes
- but not yet fully model:
  - auto-hit semantics
  - simultaneous resolution
  - split/stack nuances

This should be treated as an explicit temporary state, not as complete modeling.

#### Targeting scope rule

Targeting guidance must support:

- creatures
- objects
- creatures or objects
- points in space
- self
- self plus secondary targets
- areas originating from self or a chosen point

Do not let spell authoring drift into creature-only assumptions.

#### Scaling direction

Reserve a structured extension point now:

```ts
scaling?: SpellScalingRule[];
```

Likely future categories:

- extra damage
- extra targets
- expanded area or range
- longer duration
- other text-defined improvements

Do not defer this into ad hoc `higherLevelText` or scattered notes.

#### Adapter philosophy

Runtime systems should consume spells through adapters.

Rules:

- spell content reflects the rules cleanly
- runtime systems may support only a subset
- unsupported spell behavior degrades to log/text
- content authoring must not be distorted to satisfy current runtime limits

### 8. Publish the authoritative effects reference doc

Create `docs/reference/effects.md` as the permanent, authoritative reference for shared effect authoring across domains.

The doc should cover:

- philosophy and authoring rules
- canonical vocabulary and naming rules
- current shared shapes and their responsibilities
- how shared effects are used across spells, monster actions, class effects, items, and other sources
- examples of the default save-based spell pattern and area ownership rules
- explicit unsupported, partially supported, or under-defined areas
- adapter philosophy and runtime boundary notes

Authoring guidance:

- a draft can be created early to lock structure and vocabulary
- the final authoritative pass should happen after the migration work so the doc matches actual code, not intended code

## Concerns To Watch

### Shared effect schema still has runtime-shaped naming

This is not a spell-only cleanup. The migration must include:

- shared timing/effect types
- monster action consumers
- class/spell consumers
- combat/runtime adapters

### Object targeting is still easy to under-specify

The first non-creature fixture should be chosen intentionally so the schema does not become creature-biased by habit.

### Magic Missile still reveals a future shared primitive gap

Likely future direction:

- shared targeting
- shared damage
- possibly a shared resolution or delivery pattern primitive

Do not solve this with a spell-only hack.

## Recommended Implementation Sequence

1. Freeze the canonical vocabulary contract, including global naming, ownership rules, and the scope of the migration.
2. Create an early draft of `docs/reference/effects.md` to lock terminology, structure, and examples before the implementation pass grows.
3. Normalize shared timing/effect discriminants in `effects.types.ts`, `timing.types.ts`, and affected consumers.
4. Convert system spell IDs to kebab-case and add the manual DB migration script in `scripts/`.
5. Update `spell.types.ts` to use descriptive reaction trigger strings and lock spell-level ownership comments/rules.
6. Update representative class/monster/runtime usage sites and tests to the canonical vocabulary.
7. Codify the default save-based spell pattern in types and guidance.
8. Author the `Fireball` fixture using the canonical save-based pattern.
9. Author one object-targeting fixture and refine targeting guidance based on what it exposes.
10. Add docs/comments covering intentional under-modeling, adapter philosophy, and scaling direction.
11. Finalize `docs/reference/effects.md` so it reflects the implemented shapes and known gaps precisely.

## Test Strategy

Prioritize tests and fixture assertions that enforce authoring consistency, not just runtime translation.

1. Vocabulary normalization tests
  Assert canonical discriminants and reject drift in representative content.
2. Save-based spell pattern tests
  Lock the expected shape for `targeting + save + branched outcomes`.
3. Fixture regression tests
  Snapshot or assert representative spell entries so authoring does not drift.
4. Adapter boundary tests
  Confirm runtime consumers degrade unsupported spell mechanics to log/text instead of inventing fake behavior.
5. ID migration validation
  Verify legacy spell IDs are mapped safely to canonical kebab-case IDs by the manual migration script and any affected reference checks.

## Definition Of Done

This plan is complete when:

- all system spell IDs are canonical kebab-case values
- a manual DB migration script exists for legacy persisted spell IDs
- shared timing/effect names are globally normalized
- spell reaction triggers are descriptive strings, not fake shared trigger enums
- the default save-based spell pattern is documented and exercised by fixtures
- at least one area save spell and one object-targeting spell are authored canonically
- intentional under-modeling is documented as a first-class rule
- targeting guidance is explicitly non-creature-biased
- a structured scaling extension point exists for future upcasting work
- `docs/reference/effects.md` exists and is authoritative about current shared effect philosophy, shapes, usage, and known gaps

