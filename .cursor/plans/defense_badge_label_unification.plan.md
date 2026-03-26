---
name: Defense Badge Label Unification
overview: Eliminate drift between condition-immunity badges and damage-defense badges by deriving all damage defense display text from level + damageType via a single formatter, aligning copy (Immune / Vulnerability), and locking behavior with tests plus badges.md notes.
todos:
  - id: single-formatter
    content: Use shared formatDamageDefenseLabel (or extract rename) for damage rows in damageDefenseBadges and/or defenseBadgesToPresentableCombatEffects so presentable lists match preview chips
    status: pending
  - id: copy-tweak
    content: "Change vulnerability line to \"Vulnerability: {type}\" per product copy; optionally align resistance to \"Resistance:\" if desired"
    status: pending
  - id: tests
    content: Add/adjust encounter-defense-badges and presentable-effects tests so raw marker.label does not dictate UI strings
    status: pending
  - id: docs
    content: Document single source of truth and marker.label role in docs/reference/badges.md
    status: pending
isProject: false
---

# Defense Badge Label Unification

## Problem

Two surfaces format damage resistances / immunities / vulnerabilities differently:

- **Condition immunities** (`conditionImmunities`) always render as `Immune: {display name}` from `encounter-defense-badges.ts`.
- **Damage-type markers** (`damageResistanceMarkers`) store a free-form `label` at creation time (`immunity to fire`, `vulnerability to cold`, etc. in `combatant-builders.ts`, spell paths in `action-effects.ts`).
- `**deriveEncounterDefenseBadges` → `damageDefenseBadges`** passes through `m.label`.
- `**defenseBadgesToPresentableCombatEffects`** (used by `collectPresentableEffects`) therefore shows the legacy lowercase phrasing.
- `**buildEncounterDefensePreviewChips`** already ignores `d.label` and uses `formatDamageDefenseLabel(level, damageType)` — so preview chips and full effect lists disagree.

Mechanics are keyed by `damageType` + `level`; drift is **presentation only**.

## Target UX


| Kind                 | Badge text                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| Condition immunity   | `Immune: {condition name}` (unchanged)                                                                 |
| Damage immunity      | `Immune: {damage type display name}`                                                                   |
| Damage vulnerability | `Vulnerability: {damage type display name}`                                                            |
| Damage resistance    | `Resistance: {damage type display name}` (recommended for consistency; today formatter uses `Resist:`) |


Use existing `damageTypeDisplayName()` / `DAMAGE_TYPE_DISPLAY_NAME` map for human-readable type names.

## Implementation Plan

### 1. Single source for damage badge labels

**Primary change (pick one approach; both valid):**

- **Option A — Derive in `damageDefenseBadges`:** Set `label` to `formatDamageDefenseLabel(...)` from `m.level` + `m.damageType` instead of `m.label`. Then `defenseBadgesToPresentableCombatEffects` and any other consumer of `deriveEncounterDefenseBadges` stay unchanged.
- **Option B — Derive only in `defenseBadgesToPresentableCombatEffects`:** Leave `EncounterDamageDefenseBadge.label` as pass-through for one release, but build `PresentableCombatEffect.label` from `formatDamageDefenseLabel` using `d.kind` + `d.damageType`.

Prefer **Option A** so `deriveEncounterDefenseBadges` returns canonical UI labels everywhere and `buildEncounterDefensePreviewChips` can optionally use `d.label` directly (reducing duplication) or keep calling the formatter idempotently.

### 2. Align `formatDamageDefenseLabel` copy

- Vulnerability: `Vulnerable:` → `**Vulnerability:`** (per product decision).
- Resistance: `**Resistance:`** if we want full-word parity with `Vulnerability:` (optional but keeps one grammatical pattern).

### 3. Marker `label` field

- **Do not** remove `label` from `DamageResistanceMarker` (used at construction, logs, potential future tooling).
- After UI uses derived strings, optionally align marker construction (`combatant-builders`, `action-effects` resistance branch) to call the same formatter for consistency in non-UI surfaces — **secondary**; not required for UI fix.

### 4. Tests

- `**encounter-defense-badges.test.ts`:** Combatant with `damageResistanceMarkers` whose `label` is intentionally wrong (e.g. `immunity to fire` stale string) must still produce `**Immune: Fire`** (or correct display name) on derived damage badges and in `collectPresentableEffects` / `enrichPresentableEffects` pipeline.
- Cover vulnerability and resistance rows once copy is updated.
- Run existing suite: `npm run test:run -- src/features/encounter/domain/badges/defense/`

### 5. Documentation

- `**docs/reference/badges.md`** (Condition Badge Pipeline / defense section): Add a short subsection stating that **damage defense badge text is derived from `DamageResistanceMarker.level` + `damageType`**, not from `marker.label`; `label` remains authoring/runtime metadata and may differ from on-screen text until marker construction is aligned.

## Acceptance Criteria

- Full presentable-effects list and preview defense chips show the same immunity / vulnerability / resistance wording for the same combatant.
- Vulnerability badges read `**Vulnerability: {type}**`.
- Tests prevent regressions (raw `label` string does not control UI).
- `badges.md` documents the rule of derivation.

## Out of Scope

- Changing `DAMAGE_IMPLIES_CONDITION` or monster authoring rules (already documented in effects/badges refs).
- Phase 3 scoped immunity enforcement.

## Files Likely Touched


| File                                                                            | Change                                                                                                       |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/features/encounter/domain/badges/defense/encounter-defense-badges.ts`      | Derive `label` in `damageDefenseBadges`; update `formatDamageDefenseLabel`; optionally simplify preview loop |
| `src/features/encounter/domain/badges/defense/encounter-defense-badges.test.ts` | Assertions on derived labels + presentable pipeline                                                          |
| `docs/reference/badges.md`                                                      | Short "defense badge labels" note                                                                            |


Optional follow-up: align `label` at marker creation in `combatant-builders.ts` / `action-effects.ts` for non-UI consistency.