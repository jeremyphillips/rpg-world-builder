---
name: Action intent categorization
overview: Refine action semantic category derivation to group by user intent (Attack/Heal/Buff/Utility/Item) instead of source type, improve multiattack and offensive spell handling in both categorization and the recommended block, and add a separate source tag for future source-based filtering.
todos:
  - id: type-model
    content: Remove 'spell' from ActionSemanticCategory, add ActionSourceTag type, add sourceTag to ActionPresentationViewModel
    status: completed
  - id: category-derivation
    content: Refine deriveCategory for offensive spells -> attack, multiattack -> attack; add deriveSourceTag; wire into deriveActionPresentation
    status: completed
  - id: recommended-actions
    content: "Improve deriveRecommendedActions: multiattack threshold bypass, child suppression, category-aware sorting"
    status: completed
  - id: drawer-grouping
    content: Remove spell from CATEGORY_ORDER/CATEGORY_LABELS in CombatantActionDrawer
    status: completed
  - id: tests-verify
    content: Update action-presentation tests for new category/sourceTag expectations, run tsc and vitest
    status: completed
isProject: false
---

# Action Intent Categorization and Recommendation Improvements

## Current Problems

1. `**spell` is a primary group category, but it is a source, not an intent.** Offensive spells (Fireball, Sacred Flame) categorize as `'spell'` rather than `'attack'`. The user's desired primary groups are Attack / Heal / Buff / Utility / Item -- no `spell` group.
2. **Multiattack categorizes as `utility`.** A multiattack `CombatActionDefinition` has `kind: 'monster-action'`, `resolutionMode: 'log-only'`, no `attackProfile`, and no `damage`. The current `deriveCategory` treats it as utility because of the log-only + no-attack-profile check. The `sequence` field that references offensive children is never consulted.
3. **Recommended is gated on `MIN_ACTIONS_FOR_RECOMMENDED = 4`.** High-value multiattack won't surface if the creature has fewer than 4 total actions.
4. **Recommended sorting only checks `attackProfile != null`**, missing `saveProfile`, `hostileApplication`, and multiattack `sequence`.
5. **Multiattack children redundantly appear in Recommended** alongside the parent multiattack action.

## Key Design Principle: Category vs. Source Separation

Primary organization is **user intent / combat purpose**:

- `ActionSemanticCategory`: `'attack' | 'heal' | 'buff' | 'utility' | 'item'`
- This is what drives grouping in the drawer now.

Source/origin is a **separate metadata axis**:

- `ActionSourceTag`: `'weapon' | 'spell' | 'natural' | 'feature' | 'item'`
- This is a distinct field on the view model, not mixed into category logic.
- Future source-filter chips/tabs will consume this field directly.

Examples of the two-axis model:

- Fire Bolt: category `attack`, source `spell`
- Healing Word: category `heal`, source `spell`
- Hunter's Mark: category `buff`, source `spell`
- Longsword: category `attack`, source `weapon`
- Lay on Hands: category `heal`, source `feature`
- Multiattack: category `attack`, source `natural`

Rules to preserve:

- No presentation logic should assume source and category are the same thing.
- Grouping logic should reference `category` only; `sourceTag` is metadata for future filtering.
- Naming should not conflate the two (no `sourceCategory`, no `kindGroup`).
- `ActionPresentationViewModel` should carry both fields distinctly.

## Derivation Boundary Design

```
spell-hostility.ts (unchanged)
  deriveSpellHostility(spell) -> already bridges into hostileApplication
                                 on CombatActionDefinition via adapter

action-presentation.ts (refine)
  deriveCategory(action) -> 'attack' | 'heal' | 'buff' | 'utility' | 'item'
    - Remove 'spell' as a category value
    - Offensive spells (hostileApplication/attackProfile/saveProfile) -> 'attack'
    - Multiattack (has sequence) -> 'attack'
    - Remaining spells -> 'utility'

  deriveSourceTag(action) -> 'weapon' | 'spell' | 'natural' | 'feature' | 'item'
    - Derived from displayMeta.source / action.kind
    - Separate concern from category

  deriveActionPresentation(action) -> vm with both category and sourceTag

CombatantActionDrawer.tsx (refine)
  deriveRecommendedActions(...)
    - Multiattack always eligible even below normal threshold
    - Suppress multiattack children when parent is recommended
    - Category-aware offensive sorting
  groupActionsByCategory(...)
    - Uses category field only; no 'spell' group
```

## Phase 1: Refine Type Model

**File:** [action-presentation.types.ts](src/features/encounter/domain/badges/action/action-presentation.types.ts)

- Remove `'spell'` from `ActionSemanticCategory`. New union: `'attack' | 'utility' | 'heal' | 'buff' | 'item'`.
- Add `ActionSourceTag` type: `'weapon' | 'spell' | 'natural' | 'feature' | 'item'`.
- Add `sourceTag: ActionSourceTag` to `ActionPresentationViewModel`.

## Phase 2: Refine Category and Source Derivation

**File:** [action-presentation.ts](src/features/encounter/domain/badges/action/action-presentation.ts)

Refine `deriveCategory`:

- For `kind === 'spell'`: check heal first; then offensive intent (`attackProfile != null` OR `saveProfile != null` OR `hostileApplication === true`) returns `'attack'`; then buff check; then fallback to `'utility'`.
- For `kind === 'monster-action'` / `kind === 'weapon-attack'`: if `action.sequence?.length > 0` return `'attack'` (multiattack is always an offensive turn option). Rest of existing logic unchanged.

Add `deriveSourceTag(action)`:

- `displayMeta?.source === 'weapon'` -> `'weapon'`
- `displayMeta?.source === 'spell'` -> `'spell'`
- `displayMeta?.source === 'natural'` -> `'natural'`
- `kind === 'combat-effect'` -> `'feature'`
- fallback -> `'feature'`

Wire `sourceTag` into `deriveActionPresentation` return value.

Update barrel exports in [domain/index.ts](src/features/encounter/domain/index.ts) for `ActionSourceTag`.

## Phase 3: Improve Recommended Actions

**File:** [CombatantActionDrawer.tsx](src/features/encounter/components/active/drawers/CombatantActionDrawer.tsx)

Refine `deriveRecommendedActions`:

1. **Gate rule**: require target selected (`validActionIdsForTarget != null`). Filter to resource-available + valid-for-target candidates.
2. **Threshold rule**: show recommended when EITHER total actions >= `MIN_ACTIONS_FOR_RECOMMENDED` (4) OR any candidate has a `sequence` (multiattack-like high-value option).
3. **Child suppression**: collect all `actionLabel` values from multiattack parents in the candidate pool. Remove candidates whose `label` matches a multiattack child label when the parent is also a candidate.
4. **Sorting**: multiattack (has `sequence`) first, then category `'attack'` (use `deriveActionPresentation`), then label fallback.
5. **Cap**: `MAX_RECOMMENDED` = 3.

## Phase 4: Update Drawer Grouping

**File:** [CombatantActionDrawer.tsx](src/features/encounter/components/active/drawers/CombatantActionDrawer.tsx)

- Remove `'spell'` from `CATEGORY_ORDER`. New order: `['attack', 'heal', 'buff', 'utility', 'item']`.
- Remove `spell: 'Spells'` from `CATEGORY_LABELS`.
- `groupActionsByCategory` already consumes `deriveActionPresentation` -- no changes needed there beyond the upstream category changes flowing through.

## Phase 5: Update Tests and Verify

- Update [action-presentation.test.ts](src/features/encounter/domain/badges/action/action-presentation.test.ts):
  - Offensive spell tests should now expect `'attack'` not `'spell'`.
  - Add multiattack-as-attack test case.
  - Add `sourceTag` assertions to existing and new tests.
- Run `tsc --noEmit` and `vitest run src/features/encounter/domain/badges/action/`.
- Verify barrel re-exports compile.

## Edge Cases / Risks

- **Spells with ambiguous hostility** (no `attackProfile`, no `saveProfile`, `hostileApplication` unset): fall to `'utility'`. Acceptable first pass; these can be reclassified later as more signals are available.
- **Multiattack child suppression by label** is a heuristic -- if a child action label doesn't exactly match the sequence step `actionLabel`, suppression won't fire. Worst case is mild duplication in Recommended; acceptable.
- **Removing `'spell'` category** is a breaking change for any consumer referencing it. Only `CombatantActionDrawer` (CATEGORY_ORDER/LABELS) and `action-presentation.test.ts` use the value; barrel re-exports the type.
- `**sourceTag` is new** and not consumed by rendering yet. Present on the view model for future filter readiness. No drawer UI changes needed for it now.
- **Future source-filter chips/tabs** can consume `vm.sourceTag` directly from `ActionPresentationViewModel` without touching grouping logic.

