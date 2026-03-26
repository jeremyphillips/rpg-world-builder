# Badge Presentation Systems

Reference for the two badge-producing pipelines in the encounter UI:
**action badges** (properties of a combat action) and **condition badges**
(states applied to a combatant). Both converge to the shared `AppBadge`
UI primitive but have intentionally separate derivation logic.

---

## Action Badge Pipeline

### Purpose

Produce compact, ordered badge chips for combat action rows and cards
(to-hit bonus, damage, range, save DC, concentration, recharge, etc.).

### Key files

| File | Role |
|---|---|
| `src/features/encounter/domain/badges/action/combat-action-badges.types.ts` | `ActionBadgeKind`, `ActionBadgeDescriptor` |
| `src/features/encounter/domain/badges/action/combat-action-badges.ts` | `deriveCombatActionBadges()` -- pure derivation |
| `src/features/encounter/domain/badges/action/combat-action-badges.test.ts` | Unit tests (21 cases) |
| `src/features/encounter/domain/badges/action/action-presentation.types.ts` | `ActionPresentationViewModel`, `ActionSemanticCategory`, `ActionSourceTag` |
| `src/features/encounter/domain/badges/action/action-presentation.ts` | `deriveActionPresentation()` -- wraps badge derivation with name, category, sourceTag |
| `src/features/encounter/domain/badges/action/action-presentation.test.ts` | Unit tests (29 cases) |
| `src/features/encounter/components/active/action-row/ActionRowBase.tsx` | Maps `ActionBadgeDescriptor[]` to `AppBadge` components |
| `src/features/encounter/components/active/action-row/ActionRow.tsx` | Consumes `ActionPresentationViewModel` |
| `src/features/encounter/components/active/cards/CombatActionPreviewCard.tsx` | Also uses `deriveCombatActionBadges` directly |

### Data flow

```
CombatActionDefinition
  --> deriveActionPresentation(action)
        --> deriveCombatActionBadges(action) --> ActionBadgeDescriptor[]
        --> deriveCategory(action)           --> ActionSemanticCategory
        --> deriveSourceTag(action)          --> ActionSourceTag
        --> deriveDisplayName / secondLine / footerLink
  --> ActionPresentationViewModel
        --> ActionRow --> ActionRowBase --> AppBadge[]
```

### ActionBadgeDescriptor

```typescript
type ActionBadgeDescriptor = {
  kind: ActionBadgeKind    // semantic badge type
  label: string            // compact display text
  priority: number         // lower = rendered first (10-80 range)
  tone: CombatStateTone    // shared tone vocabulary from condition system
  tooltip?: string         // hover detail (optional)
}
```

### Badge kinds and priority tiers

| Kind | Example label | Priority constant | Tier |
|---|---|---|---|
| `to-hit` | `+7 to hit` | `PRIORITY_CRITICAL` (10) | Critical |
| `save-dc` | `DEX DC 15` | `PRIORITY_CRITICAL_SECONDARY` (20) | Critical |
| `damage` | `2d6+4 slashing` | `PRIORITY_HIGH` (30) | High |
| `range` | `60ft` | `PRIORITY_HIGH_SECONDARY` (40) | High |
| `concentration` | `conc.` | `PRIORITY_NORMAL` (50) | Normal |
| `sequence` | `Rend x3` | `PRIORITY_NORMAL_SECONDARY` (60) | Normal |
| `recharge` | `Rch 5-6` | `PRIORITY_LOW` (70) | Low |
| `uses` | `1/1` | `PRIORITY_LOW_SECONDARY` (80) | Low |

Badges are sorted ascending by priority before rendering.

### ActionPresentationViewModel

```typescript
type ActionPresentationViewModel = {
  actionId: string
  displayName: string           // "Fireball . Lvl 3" for spells, label for others
  secondLine?: string           // spell summary or natural action description
  badges: ActionBadgeDescriptor[]
  category: ActionSemanticCategory  // primary user-intent grouping
  sourceTag: ActionSourceTag        // origin metadata for future filtering
  footerLink?: ActionFooterLink     // spell detail link
}
```

### Category vs Source (two-axis model)

Primary grouping is by **user intent** (`category`), not by source type:

| `ActionSemanticCategory` | Groups actions by... |
|---|---|
| `attack` | Offensive: weapons, offensive spells, multiattack, hostile effects |
| `heal` | Healing: cure spells, healing features |
| `buff` | Buffs: non-hostile spells/effects that grant modifiers or states |
| `utility` | Everything else: non-offensive, non-heal, non-buff |
| `item` | Item-based actions (future) |

Source/origin is a **separate metadata axis** (`sourceTag`) for future filtering:

| `ActionSourceTag` | Origin |
|---|---|
| `weapon` | Weapon-based actions |
| `spell` | Spell-based actions |
| `natural` | Monster natural/special actions |
| `feature` | Class features, combat effects, fallback |
| `item` | Item-based (future) |

**Rules:** grouping logic references `category` only. `sourceTag` is never used
for primary organization. No presentation logic should assume source and category
are the same thing.

### Category derivation rules

**Spells:**
1. Has healing effect --> `heal`
2. Has `attackProfile`, `saveProfile`, or `hostileApplication` --> `attack`
3. Has buff-like effects (modifier, grant, state) and NOT hostile --> `buff`
4. Fallback --> `utility`

**Weapon / monster actions:**
1. Has `sequence` (multiattack) --> `attack`
2. `log-only` with no attack profile and no damage --> `utility`
3. Fallback --> `attack`

**Combat effects:** --> `utility`

---

## Condition Badge Pipeline

### Purpose

Present active conditions and combat states on a combatant as compact badges
organized by urgency sections (Critical Now, Ongoing Effects, Restrictions,
Turn Triggers, System Details).

### Key files

| File | Role |
|---|---|
| `src/features/mechanics/domain/conditions/effect-condition-definitions.ts` | `EFFECT_CONDITION_DEFINITIONS` -- PHB condition data; `DAMAGE_IMPLIES_CONDITION` -- damage→condition dedup map |
| `src/features/mechanics/domain/encounter/state/condition-rules/condition-definitions.ts` | `CONDITION_RULES` -- mechanical consequence rules |
| `src/features/encounter/domain/effects/presentable-effects.types.ts` | `CombatStateTone`, `CombatStatePriority`, `CombatStateSection`, `CombatStatePresentation`, `EnrichedPresentableEffect` |
| `src/features/encounter/domain/effects/presentable-effects.ts` | `collectPresentableEffects`, `enrichPresentableEffects`, `sortByPriority`, `groupBySection` |
| `src/features/encounter/domain/effects/combat-state-ui-map.ts` | `COMBAT_STATE_UI_MAP` -- merged lookup from condition definitions + engine markers |
| `src/features/encounter/domain/badges/defense/encounter-defense-badges.ts` | `buildEncounterDefensePreviewChips` -- defense preview chips with filtering options |
| `src/features/encounter/helpers/build-combatant-preview-chips.ts` | `buildCombatantPreviewChips` -- priority-driven preview chip pipeline |
| `src/features/encounter/helpers/format-turn-duration.ts` | `formatTurnDuration` -- shared turn-duration formatter |
| `src/features/encounter/components/active/combat-log/PresentableEffectsList.tsx` | Section-grouped badge list rendering |
| `src/features/encounter/components/active/drawers/CombatantActionDrawer.tsx` | Inline condition badge rendering in drawer |
| `src/features/encounter/components/shared/cards/combatant-badges.tsx` | `CombatantPreviewChipRow` -- preview card chips with `maxVisible` overflow |

### Data flow: full effects list (drawers / panels)

```
CombatantInstance
  --> collectPresentableEffects(combatant) --> PresentableCombatEffect[]
  --> enrichPresentableEffects(effects)    --> EnrichedPresentableEffect[]
  --> sortByPriority(enriched)             --> ordered list
  --> groupBySection(sorted)               --> Record<CombatStateSection, EnrichedPresentableEffect[]>
  --> PresentableEffectsList / drawer      --> AppBadge[]
```

### Data flow: preview card chips (roster lane / compact identity)

```
CombatantInstance
  --> buildCombatantPreviewChips(combatant, options?)
        1. Collect candidates:
           participation / defeated (`participation_defeated` in COMBAT_STATE_UI_MAP when `isDefeatedCombatant`; prepended first)
           bloodied (derived from HP ≤ 50%)
           concentration (uniform chip + timeLabel)
           conditions (priority + tone from COMBAT_STATE_UI_MAP)
           states (priority + tone from COMBAT_STATE_UI_MAP)
           defense chips (via buildEncounterDefensePreviewChips with filtering)
        2. Sort by CombatStatePriority (critical > high > normal > low)
        3. Attach tooltips (always on) and timeLabel
  --> PreviewChip[]
        --> CombatantPreviewChipRow (maxVisible=4, +N overflow with tooltip)
```

### CombatStatePresentation

```typescript
type CombatStatePresentation = {
  label: string
  tone: CombatStateTone            // danger | warning | info | success | neutral
  priority: CombatStatePriority    // critical | high | normal | low | hidden
  defaultSection: CombatStateSection
  rulesText?: string               // SRD tooltip text
  userFacing?: boolean
}
```

### PreviewChip

```typescript
type PreviewChip = {
  id: string
  label: string
  tone?: PreviewTone
  tooltip?: string
  priority?: CombatStatePriority    // sorting rank for preview card display
  timeLabel?: string                // compact duration, e.g. "6s/60s" or "18s left"
}
```

`timeLabel` is produced by the shared `formatTurnDuration` helper
(`src/features/encounter/helpers/format-turn-duration.ts`). It accepts
concentration-style `{ remainingTurns, totalTurns }` or marker-style
`{ remainingTurns }` and returns `"Xs/Ys"` or `"Xs left"` respectively.

### Tone vocabulary (shared)

```typescript
type CombatStateTone = 'danger' | 'warning' | 'info' | 'success' | 'neutral'
```

Defined in `presentable-effects.types.ts`. Reused by `ActionBadgeDescriptor.tone`.
Mapped to `AppBadgeTone` at render time (`neutral` --> `default`).

### Priority model (condition-specific)

Categorical: `critical > high > normal > low > hidden`.
Used for section triage, cross-section ordering, **and preview chip sorting**.
Different from action badges which use numeric priority for within-row ordering.

### Section placement

| Section | Content |
|---|---|
| `critical-now` | Active conditions needing immediate attention |
| `ongoing-effects` | Persistent effects with duration |
| `restrictions` | Movement/action limitations |
| `turn-triggers` | Start/end-of-turn effects |
| `system-details` | Engine-internal markers |

---

## Shared Infrastructure

### AppBadge (UI primitive)

Both pipelines render to the same component at `src/ui/primitives/`.

```typescript
<AppBadge label={...} tone={...} variant="outlined" size="small" />
```

`AppBadgeTone`: `default | info | success | warning | danger | primary`

### Tone mapping

A single shared function bridges `CombatStateTone` / `PreviewTone` to `AppBadgeTone`:

```typescript
combatToneToAppBadgeTone(tone) // in combatant-badges.tsx, exported
```

All badge-rendering components import this shared mapper (`neutral` --> `default`).

### Immunity deduplication: `DAMAGE_IMPLIES_CONDITION`

`src/features/mechanics/domain/conditions/effect-condition-definitions.ts` exports
`DAMAGE_IMPLIES_CONDITION`, a map from damage-type ids to their condition counterpart:

```typescript
{ poison: 'poisoned' }
```

When `partitionMonsterImmunities` encounters a damage type in this map, it
automatically infers the condition immunity. Monster authors only need the
damage-type id (e.g. `'poison'`); the condition id (`'poisoned'`) is derived.
This prevents duplicate badges at the source rather than patching display logic.

### Damage defense badge labels (two `label` concepts)

- **`DamageResistanceMarker.label`** (on `CombatantInstance.damageResistanceMarkers`) — runtime / authoring / debug text (e.g. `immunity to fire` when the marker is built). It is **not** the source of truth for what the encounter UI shows on badges.
- **Derived badge label** — canonical presentational copy produced only by **`formatDamageDefenseLabel(level, damageType)`** in `encounter-defense-badges.ts` (`Immune:`, `Resistance:`, `Vulnerability:` plus the mapped damage-type display name). `deriveEncounterDefenseBadges` attaches this to `EncounterDamageDefenseBadge.label`; preview chips and presentable effects both consume that derived string.

Do not use `DamageResistanceMarker.label` for damage-defense badge UI — it can contain legacy phrasing.

### Condition and state labels (presentation pipeline)

- **`RuntimeMarker.label`** identifies the marker for logs and mechanics; it is **not** canonical user-facing copy. Prefer **`marker.id`** (semantic condition/state id) for presentation lookup when present.

#### Two-tier taxonomy

Presentation resolves in order: **core** → **specialized** → **fallback** (`resolveEffectPresentation` in [`combat-state-ui-map.ts`](../../src/features/encounter/domain/effects/combat-state-ui-map.ts)).

| Tier | Source | Examples |
|------|--------|----------|
| **Core** | [`core-combat-state-presentation.ts`](../../src/features/encounter/domain/effects/core-combat-state-presentation.ts) | PHB `EffectConditionId` rows, immunity-only condition ids (e.g. `exhaustion`), universal engine markers (`bloodied`, `concentrating`, `banished`) |
| **Specialized** | [`specialized-effect-presentation.ts`](../../src/features/encounter/domain/effects/specialized-effect-presentation.ts) | Named monster/affliction/system-detail markers (`mummy-rot`, `engulfed`, `limb-severed`, …) — not universal PHB statuses |
| **Fallback** | `getFallbackPresentation` | Unknown spell/state ids, dynamic hook keys, etc. Title-cased for resilience; **not** a substitute for adding core/specialized rows when a key is stable |

**Defense badges** use a separate path (`presentationTier: 'defense'`): [`formatDamageDefenseLabel`](../../src/features/encounter/domain/badges/defense/encounter-defense-badges.ts) from semantic `level` + `damageType`, not raw `DamageResistanceMarker.label`.

- **Merged lookup** [`COMBAT_STATE_UI_MAP`](../../src/features/encounter/domain/effects/combat-state-ui-map.ts) = core ∪ specialized (backward-compatible `getCombatStatePresentation`).
- **`enrichWithPresentation`** sets canonical **`label`**, **`presentationTier`**, and **`usedFallbackPresentation`** (true only for generic fallback tier).
- **`getUserFacingEffectLabel`** returns post-enrichment badge text. List and drawer surfaces should use this or **`effect.label`** after enrich.
- **Preview chips** use **`resolvePresentationForSemanticKey`** (same tier order).
- **Tests** ([`presentation-map-coverage.test.ts`](../../src/features/encounter/domain/effects/presentation-map-coverage.test.ts)): core keys and specialized keys must not hit generic fallback; unknown keys may; **`FALLBACK_ONLY_PRESENTATION_KEYS`** allowlists keys that never get rows (e.g. dynamic ids).

### Barrel exports

`src/features/encounter/domain/index.ts` re-exports:
- `deriveCombatActionBadges`, `ActionBadgeDescriptor`, `ActionBadgeKind`
- `deriveActionPresentation`, `ActionPresentationViewModel`, `ActionSemanticCategory`, `ActionSourceTag`, `ActionFooterLink`
- `CombatStateTone`, `CombatStatePriority`, `CombatStateSection`, `CombatStatePresentation`, `EnrichedPresentableEffect`
- `getUserFacingEffectLabel`, `resolvePresentationForSemanticKey`, `resolveEffectPresentation`, `CORE_COMBAT_STATE_MAP`, `SPECIALIZED_EFFECT_PRESENTATION_MAP`, `PresentationTier`, condition enrichment and grouping functions

---

## Drawer: Recommended Actions

The `CombatantActionDrawer` includes a "For this target" recommended block
at the top of each action list section.

### When it renders

- A target must be selected (`validActionIdsForTarget` is not null)
- At least one action must be both resource-available AND valid for the target

### How validity is determined

`EncounterActiveRoute.tsx` computes `validActionIdsForTarget` using
`isValidActionTarget()` from the mechanics domain. This checks:
range, sight, creature type, hostile/charm rules, allegiance, and
all other existing targeting constraints.

### Sorting

1. Multiattack (has `sequence`) first
2. Then by category priority: attack > heal > buff > utility > item
3. Then alphabetical by label

### Multiattack handling

- Multiattack always eligible regardless of total action count
- When multiattack parent is recommended, its child actions (matched by label)
  are suppressed from the recommended list to avoid redundancy
- Capped at 3 recommended actions

### Target-change reconciliation

When the user clicks a new target, `handleSelectTarget` in
`EncounterActiveRoute.tsx` reconciles the selected action:
- If the action is still valid for the new target (via `isValidActionTarget`),
  it is preserved
- If not, the action is cleared
- The new target is always set (target clicks are authoritative)

---

## Overlap and Alignment Assessment

### What both systems share

- `CombatStateTone` vocabulary (intentional, via import)
- Terminal `AppBadge` primitive
- Tone mapping glue (duplicated but trivial)
- Compact label + optional tooltip pattern

### What stays intentionally separate

| Aspect | Actions | Conditions |
|---|---|---|
| Input | `CombatActionDefinition` | `CombatantInstance` |
| Priority | Numeric (10-80) | Categorical (critical/high/normal/low) |
| Sectioning | None (scoped to action row) | Section-based triage |
| Duration/source | N/A | Duration, source metadata |
| Derivation | Pure function from action | Static lookup + runtime enrichment |

### Why not to unify further now

- Tone mapping is now consolidated (single `combatToneToAppBadgeTone`)
- Both pipelines are still evolving
- Different priority granularity serves different needs
- Premature abstraction would constrain both systems

---

## Future Enhancement Recommendations

### Near-term

1. **Source-filter chips/tabs**: `ActionSourceTag` is on the view model
   and ready for future filter UI without reworking grouping logic.

2. **Additional badge kinds**: `damage-type` kind exists in the type union
   but is not yet emitted by `deriveCombatActionBadges`. Could be added
   when damage type badges are desired as separate chips.

3. **Condition-aware action badges**: Actions that interact with conditions
   (e.g., "advantage against stunned targets") could derive contextual badges.
   This would require encounter state as input, which the current pure
   derivation does not accept.

### Medium-term

4. **Shared `CompactBadgeDescriptor`**: When a third badge-producing pipeline
   appears (equipment, spell slots, resources), extract a minimal shared type
   to `src/ui/types/`:
   ```typescript
   type CompactBadgeDescriptor = {
     label: string
     tone: CombatStateTone
     tooltip?: string
   }
   ```
   Both `ActionBadgeDescriptor` and `CombatStatePresentation` can extend or
   map to it. Include a shared tone-mapping utility at the same time.

5. **`PreviewChip` alignment**: ~~The existing `PreviewChip` type in
   `encounter-view.types.ts` uses `PreviewTone`.~~ **Addressed:**
   `PreviewChip` now includes `priority?: CombatStatePriority` and
   `timeLabel?: string`. `buildCombatantPreviewChips` assigns priority
   from `COMBAT_STATE_UI_MAP` and sorts by it. The tone mapper is
   consolidated as `combatToneToAppBadgeTone`. Full tone-type
   unification (`PreviewTone` → `CombatStateTone`) can follow if needed.

### Long-term

6. **Cross-surface action presentation**: `ActionPresentationViewModel`
   is designed to be surface-agnostic. Future CharacterView or builder
   surfaces can consume it directly without encounter-specific concerns.

7. **Grouped/filterable action lists**: The category + sourceTag two-axis
   model supports future multi-axis filtering (group by intent, filter by
   source) without restructuring the derivation layer.

8. **Condition + action convergence**: If both systems eventually need
   shared rendering in the same compact layout (e.g., a unified "status
   bar" with both conditions and action properties), the shared tone
   vocabulary makes this feasible without prior unification work.
