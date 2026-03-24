---
name: Unified Action Badge Derivation
overview: Introduce a shared, React-free badge derivation pipeline that transforms CombatActionDefinition into an ordered list of badge descriptors, then refactor ActionRow and its specialized variants to consume pre-derived badges instead of formatting them inline.
todos:
  - id: phase-1-types
    content: Create ActionBadgeDescriptor and ActionBadgeKind types in encounter/domain/badges/action/combat-action-badges.types.ts
    status: completed
  - id: phase-1-derivation
    content: Implement deriveCombatActionBadges pure function in combat-action-badges.ts
    status: completed
  - id: phase-1-tests
    content: Write unit tests covering weapon, natural, spell, generic, and combat-effect action kinds
    status: completed
  - id: phase-1-exports
    content: Re-export from encounter/domain/index.ts barrel
    status: completed
  - id: phase-2-base
    content: Update ActionRowBase to accept ActionBadgeDescriptor[] and render badges internally
    status: completed
  - id: phase-2-wire
    content: Update ActionRow to call deriveCombatActionBadges and pass to specialized rows
    status: completed
  - id: phase-2-strip
    content: Remove inline badge formatting from WeaponActionRow, NaturalActionRow, SpellActionRow, GenericActionRow
    status: completed
  - id: phase-3-viewmodel
    content: Introduce ActionPresentationViewModel type with category slot; implement deriveActionPresentation wrapping badge derivation
    status: pending
  - id: phase-3-simplify
    content: Extract name/secondLine/footer derivation helpers; collapse specialized rows into single ActionRow consuming view model
    status: pending
  - id: phase-3-preview
    content: Migrate CombatActionPreviewCard to use deriveCombatActionBadges
    status: pending
isProject: false
---

# Unified Action Badge Derivation Plan

## Architectural Assessment

### Current State

Badge formatting is scattered across four specialized row components, each with inline JSX logic:

- **[WeaponActionRow](src/features/encounter/components/active/action-row/WeaponActionRow.tsx)** -- formats `+X to hit`, `range`, `damage damageType`
- **[NaturalActionRow](src/features/encounter/components/active/action-row/NaturalActionRow.tsx)** -- formats `damage`, `attackType damageType`, `To hit: +X`, `Xft`, `Sequence: label x count`
- **[SpellActionRow](src/features/encounter/components/active/action-row/SpellActionRow.tsx)** -- formats `resolutionMode`, `ABILITY DC X`, `range`, `concentration`
- **GenericActionRow** (inside [ActionRow.tsx](src/features/encounter/components/active/action-row/ActionRow.tsx)) -- builds `detailParts` string array, shows `Recharge X-Y` badge

A fifth consumer, [CombatActionPreviewCard](src/features/encounter/components/active/cards/CombatActionPreviewCard.tsx), independently rebuilds attack/save/damage strings from `CombatActionDefinition`.

Key inconsistencies:

- Character weapons: `+5 to hit` vs monster natural: `To hit: +5`
- Weapon rows show range from `displayMeta.range` (string like `60/120ft`); natural rows show `reach` as `5ft`
- Spell rows show raw `resolutionMode` enum value as a badge (`attack-roll`, `saving-throw`)
- Damage type sometimes combined with attack type (`melee bludgeoning`), sometimes standalone
- Sequence badges use verbose `Sequence: Claw x 2` format

### Why the current shape is sufficient as input

All four row variants already accept `CombatActionDefinition`. The type is rich enough to derive every badge that currently exists. The `displayMeta` discriminated union provides source-specific hints (`weapon.range`, `spell.concentration`, `natural.attackType/reach`). No intermediate normalized view model is needed for badge derivation; `CombatActionDefinition` itself is the normalization boundary.

---

## Recommended Module Location

```
src/features/encounter/domain/badges/action/
  combat-action-badges.ts       -- pure derivation function
  combat-action-badges.types.ts -- ActionBadgeDescriptor + ActionBadgeKind
  combat-action-badges.test.ts  -- unit tests
```

**Rationale:**

- Follows the existing pattern in `encounter/domain/badges/defense/`
- All current consumers live under `encounter/`
- `CombatActionDefinition` lives in `mechanics/domain/encounter/resolution/` -- the derivation module imports from there, not the other way around
- `formatSigned` (currently in `encounter/helpers/combatant-builders.ts`) should be extracted to a tiny shared utility (e.g. `src/features/mechanics/domain/formatting.ts` or left in place and imported -- low-stakes decision)
- If action badge derivation later needs to be shared with CharacterView or a builder surface, lifting the module from `encounter/domain/badges/action/` to `mechanics/domain/encounter/presentation/` or a new `src/features/actions/` is a clean move because the derivation has zero React dependencies

### Feature Boundary Recommendation

For this first pass: **keep it under encounter**. Reasons:

- ActionRow, NaturalActionRow, SpellActionRow, and CombatActionPreviewCard are all encounter-only today
- CharacterView's [CombatStatsCard](src/features/character/components/views/CharacterView/sections/CombatStatsCard.tsx) renders attacks as an HTML table with its own `AttackEntry` shape, not `CombatActionDefinition` -- it would need a separate adapter even with shared badges
- [SpellHorizontalCard](src/features/content/spells/components/cards/SpellHorizontalCard.tsx) uses `CardBadge` with spell-catalog-level data (level, school), not combat-resolved action data
- Introducing a top-level `features/actions/` directory now would be premature; the reuse demand does not yet exist

A future "actions feature" could emerge naturally if/when CharacterView or character builder adopt `CombatActionDefinition`-based rendering. At that point, the badge derivation module lifts cleanly because it has no React or encounter-state dependencies.

---

## Alignment with Condition Presentation System

The existing condition presentation pipeline in `encounter/domain/effects/` is the closest architectural precedent for what action badges will become. Both systems need: semantic kind, compact label, tone, priority, ordered badge rendering, and shared display across cards, drawers, and tooltips.

### Existing condition presentation contracts (for reference)

- `[CombatStatePresentation](src/features/encounter/domain/effects/presentable-effects.types.ts)` -- `{ label, tone, priority, defaultSection, rulesText?, userFacing?, summarize? }`
- `[CombatStateTone](src/features/encounter/domain/effects/presentable-effects.types.ts)` -- `'danger' | 'warning' | 'info' | 'success' | 'neutral'`
- `[CombatStatePriority](src/features/encounter/domain/effects/presentable-effects.types.ts)` -- `'critical' | 'high' | 'normal' | 'low' | 'hidden'`
- `[CombatStateSection](src/features/encounter/domain/effects/presentable-effects.types.ts)` -- `'critical-now' | 'ongoing-effects' | 'restrictions' | 'turn-triggers' | 'system-details'`
- `[COMBAT_STATE_UI_MAP](src/features/encounter/domain/effects/combat-state-ui-map.ts)` -- merged lookup from condition definitions + engine markers
- `getPriorityOrder()`, `getSectionOrder()` -- ordering utilities used by consumers

Both `CombatStateTone` and `AppBadgeTone` (from `ui/types`) share the same semantic vocabulary. The condition system uses `neutral` where the UI layer maps it to `default`. This is a well-understood boundary.

### Alignment decisions for the action badge contract

**Tone vocabulary**: The action badge contract should use `CombatStateTone` (not a new bespoke union). This avoids introducing a second tone system. The mapping to `AppBadgeTone` at render time is a single function (`neutral -> default`), already established by `previewToneToAppBadgeTone` in `[combatant-badges.tsx](src/features/encounter/components/shared/cards/combatant-badges.tsx)`. Action badges will use the same mapping.

**Priority model**: Conditions use categorical priority (`'critical' | 'high' | 'normal' | ...`) for visibility-tier decisions (which section, whether to show in header). Action badges need fine-grained ordering within a horizontal strip (to-hit before damage before range). These are genuinely different use cases. The recommendation:

- Action badges use numeric priority for ordering (stable sort key per badge kind)
- Define named constants for priority bands that map to the categorical tiers:
  - `PRIORITY_CRITICAL = 10` (combat-critical: to-hit, save-dc)
  - `PRIORITY_HIGH = 30` (attack-detail: damage, range)
  - `PRIORITY_NORMAL = 50` (context: concentration, sequence)
  - `PRIORITY_LOW = 70` (resource: recharge, uses)
- This lets a future shared rendering layer map between the two systems without changing either

**Extended detail**: Conditions use `rulesText` for tooltips. Action badges use `tooltip`. These serve the same purpose. Using a common field name (`tooltip` or `rulesText`) would make a future shared base type easier. Since action badges are dynamically derived (not static definitions), `tooltip` is the more natural name. A future shared base type could alias.

**Section/grouping**: Conditions use `defaultSection` to assign effects to UI sections. Action badges do not need this in first pass (they all render in the same badge strip). However, the broader action view model (see next section) will need a `category` field that serves a parallel purpose. Keeping `defaultSection` off the badge descriptor and on the action-level presentation model avoids conflating badge ordering with action grouping.

### What NOT to do in the first pass

- Do not introduce a shared `PresentationDescriptor` base type. The condition and action badge systems are close but not identical; premature generalization would create a leaky abstraction.
- Do not move condition presentation types to accommodate action badges. The condition system is stable and well-tested.
- Do not force action badges into the `CombatStatePresentation` shape. Conditions are enriched from static definitions; action badges are derived from runtime `CombatActionDefinition` data.

### What this alignment enables later

If a shared presentation primitive emerges, it would look like:

```typescript
interface CompactDisplayDescriptor {
  kind: string
  label: string
  tone: CombatStateTone
  priority: number | CombatStatePriority
  tooltip?: string
}
```

Both `ActionBadgeDescriptor` and `CombatStatePresentation` could conform to this interface without changes to their current contracts, because the tone vocabulary is shared and the priority models are convertible. This convergence can happen opportunistically when a shared rendering utility (badge strip, tooltip builder) naturally emerges.

---

## Future Action Categorization and View Model Boundary

### Sub-grouping intent

The user identified a future need for semantic action categories: **Attack, Spell, Utility, Heal, Buff, Item**. These differ from the current `CombatActionKind` (`weapon-attack`, `monster-action`, `spell`, `combat-effect`) which is a source-kind, not a semantic purpose-category.

`CombatantActionDrawer` already groups by `CombatActionKind` via `groupActionsByKind`. Future semantic categorization would replace or supplement this with purpose-based groups.

### Where categorization lives

Categorization is **per-action, not per-badge**. A single action has one category and N badges. Therefore:

- `ActionBadgeDescriptor` should NOT include a `category` field
- Category belongs on a broader **action presentation view model** that wraps badge derivation

### Proposed future action presentation view model shape

This is NOT implemented in the first pass, but the badge contract is designed to slot into it cleanly:

```typescript
type ActionSemanticCategory =
  | 'attack'
  | 'spell'
  | 'utility'
  | 'heal'
  | 'buff'
  | 'item'

interface ActionPresentationViewModel {
  actionId: string
  displayName: string
  category: ActionSemanticCategory
  badges: ActionBadgeDescriptor[]
  secondLine?: string
  footerLink?: { to: string; label: string; openInNewTab?: boolean }
}
```

A future `deriveActionPresentation(action: CombatActionDefinition): ActionPresentationViewModel` would call `deriveCombatActionBadges(action)` internally and add category/name/secondLine derivation around it. This is the natural Phase 3 evolution (collapse specialized rows into a single `ActionRow` consuming a view model).

### How the badge contract avoids blocking grouped rendering

- `deriveCombatActionBadges` is a standalone pure function: it does not assume any rendering context, grouping, or filtering strategy
- Badge descriptors are a flat list: consumers can filter, reorder, or slice them for any context (compact row, grouped drawer section, detail tooltip)
- The `kind` field on each badge enables programmatic filtering per-context (e.g. show `concentration` in spell group headers but not in compact rows)
- Priority is numeric: different rendering contexts can apply different caps (`maxBadges: 3` for compact rows, unlimited for detail views) without changing the derivation

### Context-sensitive display across surfaces

The same badge derivation can serve different surfaces with different constraints:

- **Encounter ActionRow** (compact): show top 3 badges by priority
- **CombatActionPreviewCard** (selected action detail): show all badges
- **CharacterView** (future): if `CombatActionDefinition` is adopted, same derivation, different layout
- **Tooltip/drawer detail**: show all badges plus extended tooltip text

This works because the derivation function returns a complete ordered list and each consumer slices or formats as needed. No context-specific logic leaks into the derivation layer.

### Whether "actions" should become its own feature

**Not yet.** The current evidence:

- Badge derivation has one consumer surface (encounter action rows + preview card)
- CharacterView uses `AttackEntry` (a different, simpler shape) for its attack table
- SpellHorizontalCard uses catalog-level `Spell` data, not `CombatActionDefinition`
- No character builder action presentation exists yet

**Trigger for promotion**: When a second feature area (CharacterView, character builder) needs to render `CombatActionDefinition`-based badges or adopts the `ActionPresentationViewModel`, that is the signal to create `features/actions/` or `mechanics/domain/action-presentation/` and lift the derivation module.

The first-pass placement under `encounter/domain/badges/action/` does not block this move because:

- The module has zero React dependencies
- It imports only from `mechanics/domain/encounter/resolution/` (the type definition)
- It has no encounter-state dependencies (no hooks, no context)

---

## Proposed Badge Descriptor Contract

```typescript
// combat-action-badges.types.ts

import type { CombatStateTone } from '../effects/presentable-effects.types'

type ActionBadgeKind =
  | 'to-hit'
  | 'damage'
  | 'damage-type'
  | 'range'
  | 'save-dc'
  | 'concentration'
  | 'recharge'
  | 'uses'
  | 'sequence'

interface ActionBadgeDescriptor {
  kind: ActionBadgeKind
  label: string            // compact display string, e.g. "+5 to hit"
  priority: number         // lower = more important = shown first
  tone: CombatStateTone    // reuses condition system tone vocabulary
  tooltip?: string         // optional expanded detail (breakdown, full text)
}
```

**Design notes:**

- `tone` reuses `CombatStateTone` (`'danger' | 'warning' | 'info' | 'success' | 'neutral'`) from the condition presentation system, not a bespoke type. This ensures alignment with the existing condition badge pipeline and the `previewToneToAppBadgeTone` mapping already used in combatant badge rendering. Most action badges use `'neutral'`; `'warning'` for recharge-not-ready or uses-exhausted; `'danger'` is reserved for future escalation.
- `label` is always the compact form. No separate `compact`/`full` variants in first pass -- tooltip covers expanded info.
- `kind` enables downstream filtering/grouping (e.g. "hide damage-type if damage badge already includes it") and future programmatic consumers (tooltips, detail drawers). It is a string union scoped to action badges, not shared with condition kinds.
- `priority` uses numeric values with named constants for band alignment with `CombatStatePriority`:
  - `PRIORITY_CRITICAL = 10` -- combat-critical facts (to-hit, save-dc)
  - `PRIORITY_HIGH = 30` -- attack detail (damage, range)
  - `PRIORITY_NORMAL = 50` -- context (concentration, sequence)
  - `PRIORITY_LOW = 70` -- resource state (recharge, uses)
- The `resolution-mode` kind from the original proposal is dropped. It was redundant with `to-hit` / `save-dc` and added no signal.

---

## Derivation Function Shape

```typescript
// combat-action-badges.ts

const PRIORITY_CRITICAL = 10
const PRIORITY_CRITICAL_SECONDARY = 20
const PRIORITY_HIGH = 30
const PRIORITY_HIGH_SECONDARY = 40
const PRIORITY_NORMAL = 50
const PRIORITY_NORMAL_SECONDARY = 60
const PRIORITY_LOW = 70
const PRIORITY_LOW_SECONDARY = 80

function deriveCombatActionBadges(
  action: CombatActionDefinition
): ActionBadgeDescriptor[]
```

Single pure function. No React, no hooks, no encounter state. Returns badges sorted by priority.

### Proposed First-Pass Badge Set and Priority Order


| Priority | Band     | Kind            | Condition                                                      | Label Format                              | Example                      |
| -------- | -------- | --------------- | -------------------------------------------------------------- | ----------------------------------------- | ---------------------------- |
| 10       | critical | `to-hit`        | `attackProfile` exists                                         | `+X to hit`                               | `+5 to hit`                  |
| 20       | critical | `save-dc`       | `saveProfile` exists                                           | `ABL DC N`                                | `WIS DC 14`                  |
| 30       | high     | `damage`        | damage exists (from `attackProfile.damage` or `action.damage`) | `XdY+Z type` (type appended when present) | `2d6+3 fire`                 |
| 40       | high     | `range`         | range derivable from `displayMeta`                             | compact range string                      | `60ft`, `Touch`, `5ft reach` |
| 50       | normal   | `concentration` | `displayMeta.source === 'spell'` and `concentration === true`  | `conc.`                                   | `conc.`                      |
| 60       | normal   | `sequence`      | `action.sequence` has entries                                  | `Multiattack xN` or `Name xN`             | `Claw x2`                    |
| 70       | low      | `recharge`      | `usage.recharge` exists                                        | `Rch N-M`                                 | `Rch 5-6`                    |
| 80       | low      | `uses`          | `usage.uses` exists                                            | `N/M`                                     | `0/1`                        |


The priority bands (`critical`, `high`, `normal`, `low`) intentionally parallel `CombatStatePriority` tiers from the condition system. This enables a future shared rendering layer to treat both action badges and condition badges with the same priority-based truncation or visibility logic.

**Badges NOT included in first pass (deferred to UX review):**

- `damage-type` as standalone -- folded into `damage` badge label. Only shown standalone if damage value is absent but type is known (rare edge case for log-only actions).
- `attackType` (e.g. `melee`, `ranged`) -- currently shown on NaturalActionRow combined with damageType. Low signal in compact rows; defer.
- `resolution-mode` -- redundant with `to-hit` / `save-dc` badges. Dropped from the kind union entirely.

---

## ActionRow Consumption Model

### Step 1: ActionRowBase accepts badge descriptors

```typescript
// Updated ActionRowBaseProps
type ActionRowBaseProps = {
  // ... existing props unchanged ...
  badges: ActionBadgeDescriptor[]  // was React.ReactNode
}
```

`ActionRowBase` maps `ActionBadgeDescriptor[]` to `AppBadge` JSX internally. This is the only place React rendering logic for action badges lives.

Optional: add a `maxBadges?: number` prop (default: unbounded) to enable truncation at the shell level. When truncated, remaining badges could collapse into a `+N` indicator or overflow into a tooltip.

### Step 2: Specialized rows become thin (then removable)

- `WeaponActionRow`, `NaturalActionRow`, `SpellActionRow` lose all badge formatting logic
- They still exist temporarily if they contribute non-badge presentation (e.g. `SpellActionRow` adds spell level to the name, sets `footerActionTo`; `NaturalActionRow` sets `secondLine` from `description`)
- `ActionRow` calls `deriveCombatActionBadges(action)` once and passes the result to whichever specialized row or directly to `ActionRowBase`

### Step 3 (future): Collapse specialized rows into ActionRow

Once badge derivation is shared, the remaining per-kind logic is:

- **Name decoration**: spell level in name (`Fireball . Lvl 3`) -- can become a name-derivation helper
- **Second line**: spell summary or natural action description -- can be derived from `displayMeta`
- **Footer link**: spell detail route -- can be a conditional in a single `ActionRow`

This would allow removing `WeaponActionRow`, `NaturalActionRow`, `SpellActionRow` entirely, making `ActionRow` a single component that calls `deriveCombatActionBadges` and `deriveActionRowDisplayProps` (name, secondLine, footerLink).

**Recommendation:** Do NOT collapse in this first pass. Keep specialized rows as thin wrappers to limit blast radius.

### Step 4 (future): CombatActionPreviewCard reuse

[CombatActionPreviewCard](src/features/encounter/components/active/cards/CombatActionPreviewCard.tsx) independently rebuilds `detailParts` from `CombatActionDefinition`. After this work, it could call `deriveCombatActionBadges` and render them in its own layout, eliminating its duplicated formatting.

---

## Ordering Strategy for Limited Space

1. **Sort by priority** (lower number first) -- the derivation function returns badges pre-sorted
2. **Badge count soft cap**: ActionRowBase should accept a `maxBadges` prop. Suggested default: **3** for compact encounter drawer rows. Overflow badges are hidden but available via tooltip on a `+N more` indicator.
3. **Future enhancement**: priority could be context-sensitive (e.g. in a tooltip/detail view, show all badges; in compact row, cap at 3). The descriptor contract supports this without changes -- the consumer just slices.

---

## Character vs Monster Divergence to Consolidate


| Current Divergence                                                             | Unified Behavior                                                                                                                       |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `WeaponActionRow`: `+5 to hit` vs `NaturalActionRow`: `To hit: +5`             | Standardize to `+5 to hit` (shorter, modifier-first matches D&D convention)                                                            |
| Weapon range from `displayMeta.range` (e.g. `60/120ft`) vs natural reach `5ft` | Derive range string uniformly: `displayMeta.range` if present, else `displayMeta.reach` + `ft` suffix, else `targeting.rangeFt` + `ft` |
| Natural row shows `attackType damageType` badge (e.g. `melee bludgeoning`)     | Drop `attackType` from compact badges (low signal); fold `damageType` into damage badge                                                |
| Spell row shows raw `resolutionMode` badge                                     | Drop -- redundant with `to-hit` / `save-dc` badges                                                                                     |
| Natural row: `Sequence: Claw x 2`                                              | Shorten to `Claw x2` (drop "Sequence:" prefix)                                                                                         |
| Generic row: second-line text for details, only `Recharge` badge               | Use same badge pipeline; second-line remains for description/summary                                                                   |


---

## Tradeoffs

### Derive semantic facts first vs directly formatting strings

**Recommendation: derive semantics.** The `ActionBadgeDescriptor` with `kind` + `label` gives us both. `kind` enables programmatic filtering (remove `damage-type` when already included in `damage` label), testing (`expect badges to contain kind 'to-hit'`), and future reuse (tooltips, detail views). The cost is trivial -- one extra enum field per badge.

### Whether damage type should always be shown

**Recommendation: fold into damage badge** (`2d6+3 fire`). Only show standalone `damage-type` badge if damage value is absent (e.g. log-only actions that note a type). This saves a badge slot in compact rows.

### Whether "attack-roll" is redundant when "to hit" exists

**Yes, redundant.** `+5 to hit` already implies attack-roll resolution. Drop the `resolutionMode` badge. Similarly, `save-dc` implies saving-throw resolution. Only show `resolutionMode` for `effects` or `log-only` if we decide those warrant a badge (not in first pass).

### Whether badge count should be capped in compact rows

**Yes, soft cap of 3.** The encounter action drawer has limited horizontal space (~350px content area at 420px drawer width). Three small `AppBadge` chips plus the action name fit comfortably. Overflow is indicated with a `+N` chip. This is a presentation-layer decision in `ActionRowBase`, not in the derivation layer.

---

## Phased Rollout Plan

### Phase 1: Add derivation module (no UI changes)

- Create `combat-action-badges.types.ts` with `ActionBadgeDescriptor`, `ActionBadgeKind`
- Create `combat-action-badges.ts` with `deriveCombatActionBadges(action)`
- Create `combat-action-badges.test.ts` with unit tests covering weapon, natural, spell, and generic action kinds
- Extract `formatSigned` to a shared location or keep importing from `combatant-builders` (low-stakes)
- Re-export from `encounter/domain/index.ts`

**Churn: zero** -- no existing code changes, purely additive.

### Phase 2: Wire ActionRow to use derived badges

- Update `ActionRowBase` to accept `ActionBadgeDescriptor[]` instead of `React.ReactNode`
- Add badge-to-JSX rendering inside `ActionRowBase` (map descriptors to `AppBadge` components)
- Update `ActionRow` to call `deriveCombatActionBadges(action)` and pass result through
- Update each specialized row to stop formatting badges; receive and forward `badges: ActionBadgeDescriptor[]` from parent `ActionRow`

**Churn: moderate** -- touches 5 files in `action-row/`, all in encounter feature. No API boundary changes.

### Phase 3: Simplify specialized rows and introduce view-model boundary

- Move remaining per-kind logic (name decoration, second line, footer link) into pure helper functions alongside badge derivation
- Introduce `ActionPresentationViewModel` type (see "Future Action Categorization" section above): `{ actionId, displayName, category, badges, secondLine?, footerLink? }`
- Implement `deriveActionPresentation(action: CombatActionDefinition): ActionPresentationViewModel` as a wrapper around `deriveCombatActionBadges`
- This is the natural boundary for future `ActionSemanticCategory` derivation -- category logic goes here, not in badge derivation
- Consider collapsing `WeaponActionRow`, `NaturalActionRow`, `SpellActionRow` into a single `ActionRow` consuming the view model
- Update `CombatActionPreviewCard` to use `deriveCombatActionBadges` instead of its inline `detailParts` logic

**Churn: low-medium** -- removes code, net negative line count. View model type is additive.

### Phase 4 (future): Broader reuse and categorization

- Implement `ActionSemanticCategory` derivation in `deriveActionPresentation` (Attack, Spell, Utility, Heal, Buff, Item)
- Update `CombatantActionDrawer`'s `groupActionsByKind` to group by semantic category instead of `CombatActionKind`
- If CharacterView or character builder adopts `CombatActionDefinition`-based rendering, lift derivation to `mechanics/domain/encounter/presentation/` or a new `features/actions/` module
- Evaluate whether a shared `CompactDisplayDescriptor` base type is warranted to unify action badges and condition presentation rendering utilities
- Extend `ActionBadgeDescriptor` with `compact`/`full` label variants if tooltip or detail-view needs diverge from row needs

---

## Risks and Edge Cases

- `**combat-effect` kind**: Currently falls through to `GenericActionRow`. Ensure `deriveCombatActionBadges` handles this kind gracefully (it may have no attack profile, no save, just effects).
- **Sequence child actions**: Beam/hit child actions (from spell sequences) have empty `cost: {}` and no `usage`. They should still get `to-hit` / `damage` badges. The derivation function should not assume `cost` is populated.
- **Recharge readiness**: `usage.recharge.ready` is a runtime state. The badge should reflect this (e.g. tone `'warning'` when `ready: false`). First pass can show the recharge range; readiness tone is a natural follow-up.
- `**displayMeta` absence**: Some actions (especially `combat-effect` kind) may lack `displayMeta`. The derivation function must handle `undefined` gracefully.
- **Spell level in name**: `SpellActionRow` currently bakes spell level into the name string (`Fireball . Lvl 3`). This is name decoration, not a badge. It should remain in the name-derivation path, not become a badge.
- **ActionRowBase backward compatibility**: During Phase 2, if any external consumer passes raw `React.ReactNode` as badges, we need to handle the transition. Current audit shows `ActionRowBase` is only consumed by the four specialized rows and `GenericActionRow`, all within `action-row/` -- so migration is contained.

---

## Summary of Recommendations

1. **Location**: `src/features/encounter/domain/badges/action/`
2. **Input**: `CombatActionDefinition` directly -- no intermediate view model needed for badge derivation
3. **Contract**: `ActionBadgeDescriptor` with `kind`, `label`, `priority` (numeric with named band constants), `tone` (reuses `CombatStateTone`), optional `tooltip`
4. **Tone alignment**: Reuse `CombatStateTone` from the condition presentation system; do not introduce a separate tone vocabulary
5. **Priority alignment**: Numeric with named bands (`PRIORITY_CRITICAL`, `PRIORITY_HIGH`, `PRIORITY_NORMAL`, `PRIORITY_LOW`) that parallel `CombatStatePriority` tiers
6. **Consumption**: `ActionRowBase` renders descriptors; `ActionRow` calls derivation once and distributes
7. **Ordering**: priority-sorted, soft cap of 3 in compact rows
8. **First-pass badges**: to-hit, save-dc, damage (with type folded in), range, concentration, sequence, recharge, uses
9. **Consolidation targets**: all four specialized row badge sections + CombatActionPreviewCard detail-parts
10. **Feature boundary**: encounter-scoped now; liftable later when reuse demand materializes
11. **Specialized rows**: keep as thin wrappers in first pass; collapse into single `ActionRow` consuming `ActionPresentationViewModel` in Phase 3
12. **View-model boundary**: Phase 3 introduces `ActionPresentationViewModel` as the wrapper around badge derivation, with a slot for `ActionSemanticCategory` (Attack, Spell, Utility, Heal, Buff, Item) -- not implemented until needed
13. **Categorization**: Per-action (not per-badge); lives on the view model, not on `ActionBadgeDescriptor`; does not block grouped rendering/filtering
14. **Condition system convergence**: No shared base type in first pass; contracts are designed to converge later via a `CompactDisplayDescriptor` interface if a shared rendering layer emerges

