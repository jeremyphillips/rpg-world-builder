---
name: Canonical presentation labels
overview: Unify user-facing badge/effect copy on CombatStatePresentation and defense derivation; resolve display labels in one place; prefer marker.id and effect.key for lookup; add coverage tests with explicit fallback allowlist; document non-authoritative runtime labels.
todos:
  - id: resolver
    content: Add getUserFacingEffectLabel (or enrich-normalize label) + wire defense / concentration exceptions
    status: completed
  - id: semantic-lookup
    content: Prefer marker.id / effect.key for presentation lookup; normalize raw label only when no semantic key
    status: completed
  - id: preview-chips
    content: build-combatant-preview-chips — bloodied/concentrating from map/helpers; conditions/states use presentation.label via semantic key
    status: completed
  - id: renderers
    content: PresentableEffectsList + CombatantActionDrawer (+ grep) use resolver / presentation.label
    status: completed
  - id: tests-coverage
    content: Coverage test — expected keys resolve without fallback; allowlist for intentional fallback-only; fail on unexpected fallback
    status: completed
  - id: tests-regression
    content: Raw label regression, cross-surface agreement, defense paths
    status: completed
  - id: docs
    content: Update docs/reference/badges.md — pipeline, marker.label non-authoritative, semantic keys
    status: completed
isProject: false
---

# Canonical presentation labels pipeline

## Current state (verified)

- [`RuntimeMarker`](src/features/mechanics/domain/encounter/state/types/combatant.types.ts): `id` and `label` are set to the same value in [`buildRuntimeMarker`](src/features/mechanics/domain/encounter/state/shared.ts). **Semantic key for lookup: `marker.id`** (condition id / state id). `label` may drift in casing or wording; do not trust it for UI.
- [`collectPresentableEffects`](src/features/encounter/domain/effects/presentable-effects.ts): `key = normalizeKey(marker.label)` today — **should evolve to prefer `marker.id`** when present (they are equal for markers built via `buildRuntimeMarker`, but id is the explicit semantic field).
- [`enrichWithPresentation`](src/features/encounter/domain/effects/presentable-effects.ts): attaches `presentation` from [`COMBAT_STATE_UI_MAP`](src/features/encounter/domain/effects/combat-state-ui-map.ts); does not merge `presentation.label` into display.
- **Preview chips** ([`build-combatant-preview-chips.ts`](src/features/encounter/helpers/build-combatant-preview-chips.ts)): Bloodied / Concentrating hardcoded; conditions/states use **`c.label` / `s.label`** for text — split-brain.
- **Lists / drawer**: [`PresentableEffectsList`](src/features/encounter/components/active/combat-log/PresentableEffectsList.tsx), [`CombatantActionDrawer`](src/features/encounter/components/active/drawers/CombatantActionDrawer.tsx) use **`effect.label`** — ignore `presentation.label`.
- **Defense**: Canonical via [`formatDamageDefenseLabel`](src/features/encounter/domain/badges/defense/encounter-defense-badges.ts); unchanged.

## Target rule

- **Identify** with semantic keys: **`effect.key`** after collection, **`marker.id`** on runtime markers, defense: **`damageType` + `level`**.
- **Normalized raw `label`** (`normalizeKey` / `normalizeMarkerKey`) — **temporary fallback only** when no stable semantic key exists (legacy paths, odd markers). Document this in code comments.
- **Name** via presentation maps / resolver.
- **Render** canonical `presentation.label` (or derived defense label), not raw `RuntimeMarker.label`.

## Semantic key lookup (authoritative input)

| Source | Preferred lookup key |
|--------|----------------------|
| `PresentableCombatEffect` | **`effect.key`** (must be derived from semantic id when available) |
| `RuntimeMarker` in preview / collection | **`marker.id`** — prefer over `marker.label` for `getCombatStatePresentation` / key construction |
| Collection | When building presentable rows from markers, set **`key` from `marker.id`** (fallback: `normalizeKey(marker.label)` only if id absent) |
| Unknown / legacy | **`normalizeKey(rawLabel)`** as last resort — isolate in one helper with a short comment |

Refactor [`markerToPresentable`](src/features/encounter/domain/effects/presentable-effects.ts) to use **`marker.id`** for `key` (today id and label are the same string for standard markers; using id makes intent explicit and preserves behavior when they diverge in the future).

## Implementation (targeted)

### 1. Central display-label resolver

Add **`getUserFacingEffectLabel(effect: EnrichedPresentableEffect): string`** (or equivalent name).

- Defense rows: canonical `effect.label` / `presentation.label` (defense branch).
- Derived concentration (`key === 'concentrating'` from `combatant.concentration`): keep composite `Concentrating: ${spell}…` from structured data.
- Other rows: **`presentation.label`**; unknown keys use **`getFallbackPresentation`** — see coverage tests below.

Optional: **`enrichWithPresentation`** overwrites flat `effect.label` with canonical text where appropriate; update [`presentable-effects.test.ts`](src/features/encounter/domain/effects/presentable-effects.ts) accordingly.

### 2. Preview chips

[`build-combatant-preview-chips.ts`](src/features/encounter/helpers/build-combatant-preview-chips.ts): bloodied/concentrating from map + structured fields; conditions/states use **`getCombatStatePresentation(semanticKey)`** with **`marker.id`**; chip text from **`presentation.label`**, not raw marker label.

### 3. Presentable list + drawer

Use resolver everywhere badge text is shown; grep for stray `effect.label` on enriched rows.

### 4. Docs

[`docs/reference/badges.md`](docs/reference/badges.md): runtime `marker.label` not canonical; semantic keys; defense derivation; fallback policy.

---

## Testing

### Regression + agreement

- Raw/stale `label` on marker does not control UI when map exists (e.g. `incapacitated`).
- Defense stale `DamageResistanceMarker.label` still shows canonical derived text.
- Preview chips and presentable list agree for the same underlying condition/state.

### Coverage / unknown keys (required behavior)

**Goal:** Missing presentation mappings are **visible in CI**, not silent. Runtime may still render via fallback for resilience; tests catch **expected** keys that accidentally hit fallback.

1. **Expected semantic keys set** — Union of keys that **must** resolve via a **direct hit** on `COMBAT_STATE_UI_MAP` (not via `getFallbackPresentation`):
   - All **`EffectConditionId`** values from [`effect-condition-definitions`](src/features/mechanics/domain/conditions/effect-condition-definitions.ts) (PHB conditions — already backed by `EFFECT_CONDITION_PRESENTATION_MAP`).
   - All keys in [`COMBAT_STATE_MARKER_UI_MAP`](src/features/encounter/domain/effects/combat-state-markers.ts) (`banished`, `bloodied`, `concentrating`, …).

2. **Helper to detect fallback** — Either:
   - export a predicate **`isFallbackPresentation(key, presentation)`** that is true when `map[key]` was undefined and `getFallbackPresentation` was used, or
   - compare `presentation` to `getFallbackPresentation({ key, ... })` for synthetic effects, or
   - add an optional flag on enrichment: `usedFallbackPresentation: boolean` (clearest for tests).

   Prefer the smallest change that makes the test unambiguous.

3. **Test: “expected keys resolve without fallback”** — For each key in the **expected set** above, assert **`!usedFallback`** (or equivalent): `getCombatStatePresentation(key)` is defined and enrichment for a minimal `PresentableCombatEffect` with that `key` does **not** use fallback-only presentation.

4. **Explicit allowlist `FALLBACK_ONLY_KEYS`** — Small, reviewed list of semantic keys that **intentionally** have no dedicated map row and always use `getFallbackPresentation` (e.g. empty at first, or reserved for engine-only placeholders). Document that adding a key here requires review.

5. **Test: “unexpected fallback fails”** — For keys **not** in `FALLBACK_ONLY_KEYS`, if enrichment/preview path resolves presentation **via fallback** (e.g. a new state id slipped into content without a map entry), the test **fails**. Implementation options:
   - enumerate keys from a **curated list** of “keys we expect to see in production fixtures” and assert none use fallback unless allowlisted, or
   - stricter: any key in `collectPresentableEffects` sample fixtures must not hit fallback unless allowlisted.

Start with (3) + (4) + a minimal (5) (e.g. assert no fallback for all `EffectConditionId` + all `COMBAT_STATE_MARKER_UI_MAP` keys); expand (5) as needed.

---

## Out of scope

- Combat mechanics / resolution; optional future `RuntimeMarker` shape changes beyond using **`id`** explicitly in collection.

## Deliverables

1. Resolver + semantic-key-first lookup + UI surfaces on canonical labels.
2. Tests: regression, agreement, **coverage + allowlist + unexpected fallback failure**.
3. `badges.md` update.
