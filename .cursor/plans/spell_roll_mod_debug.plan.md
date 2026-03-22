# Spell roll modifiers (PFE) and combat debug visibility

## What you are seeing

Two separate issues explain “disadvantage not in the debug log”:

1. **The engine likely never applies the PFE marker to attack resolution** — so the roll stays `normal` and you only get one debug line (see below).
2. **Even when the roll is `normal`, attack debug is dropped** — [`action-resolver.ts`](src/features/mechanics/domain/encounter/resolution/action/action-resolver.ts) only sets `debugDetails` when `attackDebug.length > 1`, but [`formatAttackRollDebug`](src/features/mechanics/domain/encounter/resolution/action/resolution-debug.ts) always returns at least one line (`roll mode: …`). So a single line (`roll mode: normal`) yields **no** `debugDetails` in the log.

---

## Canonical vocabulary: **hyphenated** `appliesTo` strings

Standardize on **hyphens** for all roll-modifier `appliesTo` values and for the internal context strings used in [`matchesRollContext`](src/features/mechanics/domain/encounter/resolution/action/action-resolver.ts) / [`resolveRollModifier`](src/features/mechanics/domain/encounter/resolution/action/action-resolver.ts).

| Meaning | Canonical token |
|--------|-----------------|
| Attacker’s attack rolls | `attack-rolls` |
| Modifiers that apply to rolls **against** this creature (incoming attacks) | `incoming-attacks` |

**Implementation approach (preferred over fuzzy normalization):**

1. **Resolver** — Use contexts `'attack-rolls'` and `'incoming-attacks'`; `matchesRollContext` compares normalized hyphenated tokens (spaces collapse to hyphens for legacy safety).
2. **Content sweep** — Grep and update spell + monster `roll-modifier` / `appliesTo` usages:
   - `'attack rolls'` → `'attack-rolls'`
   - `'attacks against'` → `'incoming-attacks'`
   - Any other spaced variants in this family → hyphenated equivalents.
3. **Types / docs** — If `RollModifierMarker.appliesTo` is `string | string[]`, consider a short comment or union of known literals in [`combatant.types.ts`](src/features/mechanics/domain/encounter/state/types/combatant.types.ts) or [`effects.types.ts`](src/features/mechanics/domain/effects/effects.types.ts) listing the canonical tokens (documentation-only unless you want stricter typing).
4. **[`resolution.md`](docs/reference/resolution.md)** — Note hyphenated tokens for roll-modifier `appliesTo` so future authoring stays consistent.

Do **not** rely on normalizing spaces to hyphens at runtime as the primary fix; one migration keeps behavior obvious and grep-friendly.

---

## 1) Is spell disadvantage modeled correctly?

**Partially.** `roll-modifier` effects create [`RollModifierMarker`](src/features/mechanics/domain/encounter/state/types/combatant.types.ts) entries and [`resolveRollModifier`](src/features/mechanics/domain/encounter/resolution/action/action-resolver.ts) merges them with condition-based attack mods. However, **Protection from Evil** needs both vocabulary alignment and roll-time conditions:

### A. Wrong `appliesTo` for “attacks against the warded creature”

PFE in [`level1-m-z.ts`](src/features/mechanics/domain/rulesets/system/spells/data/level1-m-z.ts) used `appliesTo: 'attack-rolls'` (attacker-outgoing). The ward is on the **defender**; it should use **`incoming-attacks`** so it is collected with defender markers in `resolveRollModifier`.

### B. `effect.condition` not enforced at roll time for `roll-modifier`

[`applyActionEffects`](src/features/mechanics/domain/encounter/resolution/action/action-effects.ts) applies `roll-modifier` without copying optional `condition` onto the marker. For PFE, [`EXTRAPLANAR_CREATURE_TYPES`](src/features/mechanics/domain/rulesets/system/monsters/extraplanar-creature-types.ts) must be evaluated when resolving the **attack** (`self` = defender, `source` = attacker) per [`evaluateCondition`](src/features/mechanics/domain/conditions/evaluateCondition.ts).

**Plan (engine):**

- Add optional `condition?: Condition` to `RollModifierMarker` and populate from `effect.condition` in [`action-effects.ts`](src/features/mechanics/domain/encounter/resolution/action/action-effects.ts).
- In [`resolveRollModifier`](src/features/mechanics/domain/encounter/resolution/action/action-resolver.ts), filter markers with `condition` using `evaluateCondition(condition, { self: defenderSnapshot, source: attackerSnapshot })`.
- **Content:** set PFE to `appliesTo: 'attacks-against'` plus `condition: EXTRAPLANAR_CREATURE_TYPES`.

### C. Saving throws (scope note)

[`saving-throw`](src/features/mechanics/domain/encounter/resolution/action/action-resolver.ts) resolution does not merge `RollModifierMarker` yet — only condition-based save mods. If spells use `appliesTo: 'saving-throws'`, standardize that token as **`saving-throws`** and treat full wiring as a **follow-up** task.

---

## 2) Enrich debug log output

- **Attack:** Change `debugDetails` guard from `attackDebug.length > 1` to **`> 0`** so `roll mode: normal` appears in debug mode.
- **Saves:** Update [`formatSaveDebug`](src/features/mechanics/domain/encounter/resolution/action/resolution-debug.ts) to always emit at least `save roll mode: …` (not only when non-`normal`).
- **Docs:** Adjust [`resolution.md`](docs/reference/resolution.md) §4.6 if helper behavior changes.

---

## 3) Tests

- Vitest: PFE + extraplanar attacker → disadvantage; non-extraplanar → no extra disadvantage from that marker.
- Assert hyphenated `appliesTo` + resolver contexts match (no regression on `attack-rolls` / `attacks-against`).
- Debug: single-line attack/save modes appear when expected.

---

## Todos

1. Resolver: use `attack-rolls` and `attacks-against` as internal contexts; update `matchesRollContext` if needed for exact canonical matching.
2. Content: migrate all `roll-modifier` `appliesTo` (and related) to hyphenated tokens; fix PFE to `attacks-against`.
3. `RollModifierMarker` + roll-time `condition` evaluation in `resolveRollModifier`.
4. Debug gates + `formatSaveDebug` always show roll mode in debug.
5. Tests + `resolution.md` touch-up.
