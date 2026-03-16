# Combat State UI Map – Phased Build Plan

## Overview

Introduce a **state UI map** that separates engine state classification from UI presentation. The flow:

```
engine state → normalize into PresentableCombatEffect → enrich with UI metadata → sort/group for rendering
```

---

## Current State

### Engine State Sources (CombatantInstance)

| Source | Type | Key/ID | Examples |
|--------|------|--------|----------|
| `conditions` | `RuntimeMarker[]` | `label` (from `conditionId`) | prone, frightened, grappled |
| `states` | `RuntimeMarker[]` | `label` (from `stateId`) | bloodied, concentrating, mummy-rot |
| `runtimeEffects` | `RuntimeEffectInstance[]` | `effectKind`, `label` | modifier, condition, state |
| `turnHooks` | `RuntimeTurnHook[]` | `id`, `label`, `boundary` | start/end + effects |
| `suppressedHooks` | `RuntimeMarker[]` | `label` | suppression markers |
| `statModifiers` | `StatModifierMarker[]` | `label`, `target` | AC modifiers |
| `activeEffects` | `Effect[]` | `kind` | pre-combat loadout (not runtime) |

### Current UI

- `CombatSimulationCards`: flat sections (RuntimeEffectList, TurnHookList, MarkerList × 3)
- All chips use same `variant="outlined"`, no tone/color
- No header chips, no grouping by section
- Labels come from `formatMarkerLabel`, `formatRuntimeEffectLabel`, `formatEffectLabel`

---

## Target Architecture

### 1. Engine State Classification (unchanged)

Engine state stays as-is. No new types or mutations. The engine continues to use:

- `conditions`, `states` for markers
- `runtimeEffects`, `turnHooks`, `suppressedHooks`, `statModifiers` for their respective purposes

### 2. PresentableCombatEffect (normalization layer)

Normalize all engine state into a single shape for rendering:

```ts
type PresentableCombatEffect = {
  id: string;
  kind: 'condition' | 'effect' | 'trigger' | 'modifier' | 'suppression';
  key: string;           // lookup key for UI map (e.g. 'prone', 'bloodied', 'on_turn_start_bleed')
  label: string;         // fallback label if no UI map entry
  summary?: string;
  duration?: string;
  source?: string;
  mechanicalImpact?: string[];
  isNegative?: boolean;
  isHidden?: boolean;
};

// For turn hooks, also include:
type PresentableTurnHook = PresentableCombatEffect & {
  kind: 'trigger';
  boundary: 'start' | 'end';
  requirements?: string[];
  suppressed?: boolean;
};
```

### 3. Combat State UI Map (presentation layer)

```ts
type CombatStatePriority =
  | 'critical'
  | 'high'
  | 'normal'
  | 'low'
  | 'hidden';

type CombatStateTone =
  | 'danger'
  | 'warning'
  | 'info'
  | 'success'
  | 'neutral';

type CombatStateSection =
  | 'critical-now'
  | 'ongoing-effects'
  | 'restrictions'
  | 'turn-triggers'
  | 'system-details';

type CombatStatePresentation = {
  label: string;
  tone: CombatStateTone;
  priority: CombatStatePriority;
  defaultSection: CombatStateSection;
  showAsChip?: boolean;
  showInHeader?: boolean;
  userFacing?: boolean;
  summarize?: (state: unknown) => string;
};

export const COMBAT_STATE_UI_MAP: Record<string, CombatStatePresentation> = {
  // conditions, states, turn hooks, etc.
};
```

### 4. Enrichment Flow

```ts
function enrichWithPresentation(
  effect: PresentableCombatEffect,
  map: Record<string, CombatStatePresentation>
): PresentableCombatEffect & { presentation: CombatStatePresentation } {
  const presentation = map[effect.key] ?? getFallbackPresentation(effect);
  return { ...effect, presentation };
}
```

---

## Phased Build Plan

### Phase 1: Types and UI Map (no UI changes)

**Goal:** Add types and the map without changing behavior.

1. **Add types** in `src/features/combatSimulation/domain/` or `src/features/mechanics/domain/encounter/`:
   - `PresentableCombatEffect`
   - `CombatStatePriority`, `CombatStateTone`, `CombatStateSection`
   - `CombatStatePresentation`

2. **Create `COMBAT_STATE_UI_MAP`** in a new file:
   - `src/features/combatSimulation/domain/combat-state-ui-map.ts` (or under mechanics)
   - Populate with `EffectConditionId` values (blinded, charmed, deafened, frightened, grappled, incapacitated, invisible, paralyzed, petrified, poisoned, prone, restrained, stunned, unconscious)
   - Populate known states: bloodied, concentrating, mummy-rot, engulfed, limb-severed, battle-focus
   - Add placeholder entries for common turn-hook patterns (e.g. `on_turn_start_bleed`, `suppression_shield_bonus`)

3. **Add `getFallbackPresentation`** for keys not in the map.

**Deliverables:** New types, map file, fallback logic. No changes to existing components.

---

### Phase 2: Normalization (collect → PresentableCombatEffect)

**Goal:** Flatten all engine state into `PresentableCombatEffect[]`.

1. **Create `collectPresentableEffects(combatant: CombatantInstance): PresentableCombatEffect[]`**:
   - Map `conditions` → `{ kind: 'condition', key: marker.label, ... }`
   - Map `states` → `{ kind: 'condition' | 'effect', key: marker.label, ... }` (consider `bloodied` as derived state)
   - Map `runtimeEffects` → `{ kind: 'effect', key: effect.effectKind or label, ... }`
   - Map `turnHooks` → `{ kind: 'trigger', key: deriveKey(hook), boundary, ... }`
   - Map `suppressedHooks` → `{ kind: 'suppression', key: marker.label, ... }`
   - Map `statModifiers` → `{ kind: 'modifier', key: modifier.label or target, ... }`

2. **Decisions:**
   - **bloodied:** Derived from `currentHitPoints <= maxHitPoints / 2`; add to presentable list when true, key `bloodied`.
   - **Turn hook key:** Use `hook.label` or derive from `hook.boundary` + effect kinds (e.g. `on_turn_start_bleed`). May need convention for hook IDs.
   - **Runtime effect key:** Use `effectKind` or `label`; some effects may need custom keys (e.g. `concentration` from spell duration).

3. **Handle duration:** `RuntimeMarker.duration` and `RuntimeEffectInstance.duration` → `duration` string on `PresentableCombatEffect`.

**Deliverables:** `collectPresentableEffects` function, unit tests.

---

### Phase 3: Enrichment and Sorting

**Goal:** Enrich presentable effects with UI metadata and sort/group for rendering.

1. **Create `enrichWithPresentation(effect, map)`** and **`enrichPresentableEffects(effects, map)`**.

2. **Create `groupBySection(effects)`** and **`sortByPriority(effects)`**:
   - `defaultSection` from presentation map
   - `priority` for ordering within sections

3. **Filter by `userFacing`** when rendering for players (optional: support debug mode).

**Deliverables:** Enrichment, grouping, sorting.

---

### Phase 4: UI Integration

**Goal:** Render from enriched presentable effects instead of raw engine state.

1. **Replace flat sections** in `CombatSimulationCards` with a single `PresentableEffectsList` (or similar) that:
   - Renders sections by `CombatStateSection`
   - Uses `tone` for chip color (danger → error, warning → warning, info → info, success → success, neutral → default)
   - Uses `showAsChip` vs list item (if both are needed)
   - Uses `showInHeader` to surface critical chips in card header

2. **Header chips:** Add a row of `showInHeader` chips next to name/AC/HP for critical-now items.

3. **Section ordering:** critical-now → ongoing-effects → restrictions → turn-triggers → system-details.

**Deliverables:** Updated `CharacterCombatantCard`, `MonsterCombatantCard`, shared `PresentableEffectsList`.

---

### Phase 5: Polish and Extensibility

**Goal:** Custom summaries, edge cases, and documentation.

1. **Implement `summarize`** for effects that need custom text (e.g. bleed: "Start of turn: take bleed damage").

2. **Add missing map entries** as new conditions/states appear in content.

3. **Document** key conventions (naming, section semantics) and how to add new entries.

---

## Concerns and Ambiguities

### 1. Key Stability

- **Condition keys:** Use `EffectConditionId` (closed union) – stable.
- **State keys:** `stateId` is open string. Content can introduce new states (e.g. `mummy-rot`, `engulfed`). Map will have gaps; fallback presentation is required.
- **Turn hook keys:** Hooks have `id` and `label` from monster/class content. No canonical key vocabulary. Options:
  - Use `hook.id` if stable and unique
  - Derive from `boundary` + first effect (e.g. `turn_start:bleed`) – fragile
  - **Recommendation:** Prefer `hook.id` when present; otherwise `hook.label` normalized (lowercase, underscores). Document that authors should use stable IDs for hooks that need custom UI.

### 2. bloodied as Derived State

- `bloodied` is not stored in `states`; it’s derived from HP. `requirementMet` already checks `currentHitPoints <= maxHitPoints / 2` for `self-state: bloodied`.
- **Recommendation:** Include `bloodied` in `collectPresentableEffects` when the condition holds. Treat it as a synthetic presentable effect with key `bloodied`.

### 3. Turn Hooks vs Conditions/States

- Turn hooks are structurally different: they have boundary, requirements, nested effects, and suppression.
- **Recommendation:** Normalize each hook as one `PresentableCombatEffect` with `kind: 'trigger'`. Optionally expand to one presentable effect per nested effect if you want finer-grained display. Start with one-per-hook for simplicity.

### 4. activeEffects vs runtimeEffects

- `activeEffects`: pre-combat loadout (equipment, class features). Shown as "Active Effects" chips.
- `runtimeEffects`: derived from `activeEffects` with duration; shown as "Timed Effects".
- **Recommendation:** Keep both. `collectPresentableEffects` can include `activeEffects` as `kind: 'effect'` with a section like `ongoing-effects`, and `runtimeEffects` as timed variants. Clarify whether "Active Effects" and "Timed Effects" map to different sections or the same.

### 5. suppression_shield_bonus and Engine-Only Keys

- Some markers are engine-only (e.g. `suppression_shield_bonus`). Map them with `userFacing: false`.
- **Recommendation:** Filter by `userFacing` only when a "player view" mode exists. Until then, show all but use `priority: 'low'` and `defaultSection: 'system-details'` to keep them out of the way.

### 6. summarize Signature

- `summarize?: (state: unknown) => string` – `state` is vague. For conditions/states it could be `RuntimeMarker`; for hooks, `RuntimeTurnHook`.
- **Recommendation:** Use a union: `summarize?: (effect: PresentableCombatEffect) => string`. The normalizer already has context; pass the presentable effect. For hooks, include boundary/requirements in the presentable effect so `summarize` can use them.

### 7. File Location

- **Option A:** `src/features/combatSimulation/domain/` – keeps UI map with combat simulation.
- **Option B:** `src/features/mechanics/domain/encounter/` – keeps it with encounter/engine.
- **Recommendation:** Option A. The map is presentation metadata; combat simulation owns the UX. Mechanics stays engine-focused.

### 8. Conditions vs States Semantics

- Conditions: D&D conditions (prone, frightened, etc.).
- States: custom ongoing states (concentrating, mummy-rot, engulfed).
- Both become `RuntimeMarker` with `label`. The UI map can treat them the same; `kind` in `PresentableCombatEffect` distinguishes for any future logic.

---

## Suggested File Structure

```
src/features/combatSimulation/
├── domain/
│   ├── combat-state-ui-map.ts      # COMBAT_STATE_UI_MAP, types, getFallbackPresentation
│   ├── presentable-effects.types.ts
│   └── presentable-effects.ts      # collectPresentableEffects, enrich, group, sort
├── components/
│   ├── CombatSimulationCards.tsx    # updated to use PresentableEffectsList
│   └── PresentableEffectsList.tsx   # new: sectioned, tone-aware rendering
```

---

## Summary

| Phase | Focus | Risk |
|-------|-------|------|
| 1 | Types + UI map | Low |
| 2 | Normalization | Medium (key derivation for hooks) |
| 3 | Enrichment + sort/group | Low |
| 4 | UI integration | Low |
| 5 | Polish | Low |

**Critical path:** Phase 2 key derivation for turn hooks and runtime effects. Resolve key strategy before implementation.
