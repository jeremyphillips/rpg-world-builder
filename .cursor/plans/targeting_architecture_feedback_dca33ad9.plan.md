---
name: Targeting architecture feedback
overview: Evaluation of six architectural recommendations for the targeting/condition system, with verdict on timing (immediate vs deferred), concerns, and ambiguities.
todos: []
isProject: false
---

# Targeting Architecture Feedback

## Evaluation Summary


| #   | Recommendation                   | Verdict                | Rationale                                           |
| --- | -------------------------------- | ---------------------- | --------------------------------------------------- |
| 1   | Composable targeting model       | **Defer**              | 6 kinds, stable; no explosion pressure yet          |
| 2   | Filter pipeline for restrictions | **Defer**              | Only 3 checks today; pipeline is premature          |
| 3   | Rename EffectConditionId         | **Defer with caution** | Name collision risk with existing `Condition` types |
| 4   | Source/relationship helpers      | **Defer**              | Only 1 source-aware query exists today              |
| 5   | UI consumes shared targeting     | **Already done**       | `getActionTargetCandidates` from this session       |
| 6   | `normalizeActionTargeting`       | **Skip**               | Profile is already a clean 2-field object           |


---

## 1. Composable Targeting Model --- Defer

**Current state:** `CombatActionTargetingProfile` is a lean 2-field type:

```39:42:src/features/mechanics/domain/encounter/resolution/combat-action.types.ts
export interface CombatActionTargetingProfile {
  kind: 'single-target' | 'all-enemies' | 'entered-during-move' | 'self' | 'single-creature' | 'dead-creature'
  creatureTypeFilter?: string[]
}
```

6 kinds, all actively used, all mapping cleanly to current spell/monster data. The surface is small and stable.

**Why defer:** The composable model (allegiance x lifeState x cardinality x entityType) is the right long-term direction, but refactoring now means:

- Migrating all spell adapter output, monster adapter output, and test data
- The `isValidActionTarget` predicate we just built would need to be rewritten against dimension fields instead of kind matching
- No new kind has been requested or is visibly imminent

**When to act:** When you find yourself wanting to add a 7th or 8th kind, especially if it overlaps with existing ones (e.g., `single-ally` vs `single-creature`). That is the signal that the flat union is under pressure.

**Immediate value:** Adopt this as a **design principle** --- when the next targeting need arises, evaluate whether it fits a new kind or whether it is time to decompose into dimensions. No code change needed now.

### Concern: Area targeting is a different axis entirely

The composable model describes *who* you can target. Area targeting (cone, sphere, line, cube) describes *how* you select a region. These are orthogonal concerns:

```
targeting: {
  who: { allegiance: 'enemy', lifeState: 'alive', cardinality: 'all' },
  how: { shape: 'cone', size: 30 }  // future: spatial selection
}
```

If AoE spells are on the horizon, factor this into the design so you don't end up with `kind: 'all-enemies-in-cone'`.

### Concern: Migration path

A migration from flat kinds to dimensional fields would touch every spell/monster adapter and all test fixtures. Consider a `normalizeTargetingKind(kind) -> dimensions` bridge function during migration rather than a big-bang rewrite.

---

## 2. Filter Pipeline for Restrictions --- Defer

**Current state:** `isValidActionTarget` has exactly 3 restriction checks:

1. `combatant.states.some((s) => s.label === 'banished')` --- banished exclusion
2. `passesCreatureTypeFilter(combatant, ...)` --- creature type filter
3. `getCharmedSourceIds(actor).includes(combatant.instanceId)` --- charmed exclusion (hostile actions only)

**Why defer:** A filter pipeline (`[banishedFilter, charmFilter, creatureTypeFilter]`) adds abstraction and indirection for 3 checks. The function is 19 lines and reads clearly. The overhead of a pipeline (filter registry, composition, per-filter types) is not justified.

**When to act:** When a 5th or 6th restriction arrives, or when restrictions start needing configuration (e.g., "this spell ignores the frightened restriction"). At that point, the function would be growing unwieldy and a pipeline pays for itself.

**Immediate value:** None. The current implementation *is* the right shape at this scale.

### Concern: Conditional restriction logic

The charmed check is already conditional --- it only applies to hostile actions. A naive filter pipeline would need to handle "this filter only applies when X". Design the pipeline interface to accept context, not just combatant:

```typescript
type TargetFilter = (combatant: CombatantInstance, actor: CombatantInstance, action: CombatActionDefinition) => boolean
```

This is effectively what `isValidActionTarget` already is --- a single composite filter.

---

## 3. Rename EffectConditionId --- Defer With Caution

**Current state:** `EffectConditionId` is the 14 SRD status conditions (blinded, charmed, ... unconscious).

**The collision problem:** The codebase already has **two** separate `Condition` types:

- `[src/ui/patterns/form/conditions.ts](src/ui/patterns/form/conditions.ts)` --- form visibility predicates (`{ op: 'eq', path, value }`)
- `[src/features/mechanics/domain/conditions/condition.types.ts](src/features/mechanics/domain/conditions/condition.types.ts)` --- effect evaluation predicates (`StateCondition | EventCondition | ComparisonCondition | ...`)

Renaming `EffectConditionId` to `ConditionId` would create a third `Condition`-adjacent name competing for meaning. The `Effect` prefix, while verbose, is actually disambiguating --- it means "a status condition that effects can apply."

**Why defer:** The name works. It is not actively causing confusion. The cost of renaming across ~15 files is real, and the resulting `ConditionId` would sit uncomfortably next to the two `Condition` types.

**Better rename if you do it:** `StatusConditionId` or `StatusId` --- these clearly denote "a status effect on a combatant" without colliding with the predicate-style `Condition` types. But only rename when there is a forcing function (e.g., adding non-SRD statuses like `bloodied` or `hidden`).

### Ambiguity: What happens when you need non-SRD statuses?

`EffectConditionId` is explicitly the SRD list. If you add `bloodied`, `hidden`, or `dying`, does that belong in this type or in the separate `states` system? The codebase already uses `states` for `banished` and `concentrating`. The line between "condition" and "state" would benefit from a documented distinction before the vocabulary grows.

---

## 4. Source/Relationship Helpers --- Defer

**Current state:** Helpers already exist:

- `hasCondition(combatant, label)` in `[shared.ts](src/features/mechanics/domain/encounter/state/shared.ts)`
- `hasState(combatant, label)` in `[shared.ts](src/features/mechanics/domain/encounter/state/shared.ts)`
- `getCharmedSourceIds(combatant)` in `[action-targeting.ts](src/features/mechanics/domain/encounter/resolution/action/action-targeting.ts)`

The suggestion to add `hasConditionFromSource(target, conditionId, sourceId)` and `getConditionSourceIds(target, conditionId)` is sound, but today only `getCharmedSourceIds` queries by source --- exactly one call site.

**Why defer:** Building generalized helpers before a second use case exists means guessing at the API. When another source-aware query appears (e.g., "is this creature frightened by *me* specifically?"), build the helper then, informed by real requirements.

**When to act:** When you see a second `combatant.conditions.filter((m) => m.label === 'X' && m.sourceInstanceId)` pattern appear.

---

## 5. UI Consumes Shared Targeting --- Already Done

This is exactly what we implemented in this session. The `availableActionTargets` memo in `[useEncounterState.ts](src/features/encounter/hooks/useEncounterState.ts)` now calls `getActionTargetCandidates` from the domain layer rather than re-deriving targeting rules.

---

## 6. `normalizeActionTargeting(action)` --- Skip

**Current state:** `CombatActionTargetingProfile` is already a 2-field interface (`kind` + `creatureTypeFilter`). There is nothing to normalize --- it is not embedded in a larger structure that needs extraction, and `action.targeting` is accessed in exactly one module (`action-targeting.ts`, plus one UI label lookup).

**Why skip:** This recommendation makes sense in a world where targeting is scattered across multiple fields on the action definition. In this codebase, targeting is already a clean sub-object. Adding a `normalizeActionTargeting` call would be a pass-through function with no transformation.

**When it becomes relevant:** If the composable targeting model (recommendation 1) is adopted, normalization could serve as the migration bridge --- converting old `kind` values into dimensional objects. But that is a concern for when/if the composable model is built.

---

## List of Concerns and Ambiguities

1. **Condition vs State distinction is undocumented.** `conditions` holds SRD status conditions (charmed, prone, etc.). `states` holds custom markers (banished, concentrating, immune-to-X). This distinction is implicit. Before either system grows, document the boundary --- otherwise new markers land in the wrong array.
2. **Area targeting is unaddressed.** None of the 6 current targeting recommendations address spatial/AoE targeting (cone, sphere, line). If AoE spells are planned, this is a bigger design question than composable creature targeting, and should be considered in any targeting redesign to avoid doing it twice.
3. `**Condition` is already overloaded.** Three distinct concepts share the name: form visibility predicates, effect evaluation predicates, and SRD status conditions. Any naming changes should account for all three.
4. `**entered-during-move` is a fundamentally different targeting kind.** It is not creature-selectable --- it is triggered by movement events. A composable model would need to handle event-triggered targeting as a separate axis, not just allegiance/lifeState/cardinality.
5. `**getCharmedSourceIds` recomputes on every call.** In `isValidActionTarget`, this runs per-combatant when evaluating candidates. For hostile actions in large encounters, this means repeated `.conditions.filter().map()` on the actor. Not a problem at current scale, but worth noting if the filter pipeline grows --- consider computing restrictions once and closing over them.

