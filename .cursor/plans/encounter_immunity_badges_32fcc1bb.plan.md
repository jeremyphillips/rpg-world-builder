---
name: Encounter immunity badges
overview: Derive encounter defense badges from unconditional condition immunities plus structured scoped grants, with damage defenses in a separate view-model; enforce an engine invariant that flat conditionImmunities is unconditional-only; Phase 1 presentation; Phase 2 persist + concentration cleanup; Phase 3 isImmuneToConditionIncludingScopedGrants for addCondition, saves, repeat saves.
todos:
  - id: invariant-docs-types
    content: Document invariant on combatant.conditionImmunities (unconditional only); align types so scoped grants never use flat includes() paths
    status: completed
  - id: encounter-badge-view-models
    content: Add EncounterConditionImmunityBadge + EncounterDamageDefenseBadge (separate selectors); map to PresentableCombatEffect / UI without mixing domains
    status: completed
  - id: phase1-derived-ui
    content: deriveEncounterDefensePresentation — intrinsic + damage badges + presentational scoped badges (tooltips/source); no resolution changes
    status: completed
  - id: phase1-preview
    content: Shared chip builder; OpponentCombatantActivePreviewCard (+ Ally preview) parity
    status: cancelled
  - id: phase1-tests
    content: Tests for selectors + presentable; assert Phase 1 does not change condition application for scoped grants
    status: cancelled
  - id: phase2-persist-grants
    content: Persist structured EffectConditionImmunityGrant on activeEffects; never merge into conditionImmunities
    status: completed
  - id: phase3-resolution-scope
    content: Rules evaluation of scoped immunity vs incoming effect metadata (addConditionToCombatant, save shortcuts)
    status: completed
isProject: true
---

# Encounter immunity badges

## Invariant: `conditionImmunities` is unconditional-only

**Treat this as a hard rule, not an implementation detail.**

Today, engine paths assume **binary, always-on** immunity:

- `combatant.conditionImmunities`
- `.includes(...)` checks
- `[condition-mutations.ts](src/features/mechanics/domain/encounter/state/condition-mutations.ts)` (blocking condition application)
- Save-flow shortcuts (`[action-effects.ts](src/features/mechanics/domain/encounter/resolution/action/action-effects.ts)`, `[turn-hooks.ts](src/features/mechanics/domain/encounter/state/turn-hooks.ts)`)

If PfEG-style **scoped** rows were folded into the flat array, the engine would **silently over-block** condition application (wrong rules while looking plausible). That is **worse than missing support**.

**Rule (plain):**

- `**conditionImmunities` is reserved for unconditional immunities only.**
- **Scoped or source-limited grants must remain structured/derived** and **must not** participate in flat `includes()` checks on that array.

Scoped grants live on effects / derived structures; presentation reads them; resolution (Phase 3) evaluates scope against incoming metadata.

---

## Three layers (mental model)

1. **Intrinsic / static** — Baseline creature data (stat block). Feeds **unconditional** entries only into `conditionImmunities` and innate `damageResistanceMarkers`.
2. **Derived active** — Structured grants (spells, auras, items): `ScopedConditionImmunityGrant` / `EffectConditionImmunityGrant`; **never** merged into flat `conditionImmunities`.
3. **Presentation** — Badges built from **both**, with honest copy and tooltips; may **merge visually** in a “Defenses” UI section without merging **selectors** or **resolver** data.

---

## Separate encounter view models (condition vs damage)

Keep **condition immunity** and **damage** defenses **separate in selectors and view models**, even if the UI later merges them into one “Defenses” region. Mixing domains early invites muddy labels, wrong grouping, and resolver coupling.

**Example split (presentation-oriented):**

```ts
type EncounterConditionImmunityBadge = {
  kind: 'condition-immunity'
  condition: ConditionName // align with ConditionImmunityId in code
  label: string
  scopeLabel?: string
  sourceLabel?: string
  conditional: boolean // true when scoped / source-limited; false for intrinsic unconditional
}

type EncounterDamageDefenseBadge = {
  kind: 'damage-immunity' | 'damage-resistance' | 'damage-vulnerability'
  damageType: DamageType // or CreatureDamageImmunityType as appropriate
  label: string
  sourceLabel?: string
  conditional: boolean
}
```

Map these into `[PresentableCombatEffect](src/features/encounter/domain/presentable-effects.types.ts)` (or adjacent helper) without conflating `kind`/`key` namespaces between damage and condition rows.

---

## Canonical mechanics types (recap)

- `CreatureDefenses.conditionImmunities` — **unconditional only** (intrinsic baseline).
- `ScopedConditionImmunityGrant` with optional `scope` (creature types, tags, magical-only, while-effect-active).
- `EffectConditionImmunityGrant` — `{ type: 'condition-immunity', grants: ScopedConditionImmunityGrant[] }` on structured effects.

Derived selector conceptually:

- `baseConditionImmunities` — from intrinsic / flat `conditionImmunities` only.
- `activeConditionImmunityGrants` — from `activeEffects` (Phase 2+), never folded into the flat array.

---

## Phase 1 — Honest presentation only (contract)

**Phase 1 ships:**

- Intrinsic **condition** immunity badges (from flat `conditionImmunities`, unconditional only).
- **Damage** immunity / resistance / vulnerability badges (from `damageResistanceMarkers`).
- **Scoped/conditional** active immunity badges **when data exists** (or fixtures), with **clear tooltip / scope / source text**.

**Phase 1 does not:**

- Change condition application, saves, or other resolution to honor scoped immunity.

**Explicit contract:**

> Scoped immunity badges in encounter UI are **presentational in Phase 1** and **do not** alter condition application or resolution. **Rules evaluation for scoped immunity is deferred to Phase 3.**

This avoids the trap where UI implies a capability the engine does not yet enforce.

---

## Phase 2 — Persist structured grants

- Persist spell/item grants as structured effects (`EffectConditionImmunityGrant` or equivalent on `activeEffects`) including scope.
- **Never** append scoped grants to `conditionImmunities`.
- Improve runtime labels / derivation so `activeConditionImmunityGrants` is populated.
- **Concentration lifecycle:** For concentration spells, each grant gets a stable `concentrationLinkId` (also pushed into `createdMarkerIds` / `linkedMarkerIds`). `dropConcentration` removes matching rows from **all** combatants’ `activeEffects` so PfEG-style buffs clear when concentration ends.

---

## Phase 3 — Rules evaluation

- **Implemented:** `[isImmuneToConditionIncludingScopedGrants](src/features/mechanics/domain/encounter/state/condition-immunity-resolution.ts)` — flat `conditionImmunities` **or** a matching `activeEffects` grant whose `effect.condition` evaluates with `self` = target and `source` = applying combatant.
- Wired into `[addConditionToCombatant](src/features/mechanics/domain/encounter/state/condition-mutations.ts)` (uses `options.sourceInstanceId`), save `autoSuccessIfImmuneTo` in `[action-effects.ts](src/features/mechanics/domain/encounter/resolution/action/action-effects.ts)` (uses `actor`), and `repeatSave.autoSuccessIfImmuneTo` in `[turn-hooks.ts](src/features/mechanics/domain/encounter/state/turn-hooks.ts)` (uses `casterInstanceId` when present).
- Requires `**combatant.creatureType`** on the source for `creature-type` conditions; omitting `sourceInstanceId` skips scoped checks (intrinsic only).

---

## Current gaps (reference)

- Phase 3: scoped immunity **rules** vs intrinsic flat checks (see Phase 3 section).
- Non-concentration spells with timed grants may need duration wiring beyond `concentrationDurationTurns` when display meta is extended.

---

## Docs (optional)

- Invariant + Phase 1/3 boundary in a short encounter or mechanics note so future contributors do not fold scoped grants into `conditionImmunities`.

