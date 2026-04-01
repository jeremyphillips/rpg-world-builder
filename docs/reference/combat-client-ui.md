# Client combat UI (`src/features/combat`)

## Purpose

`src/features/combat` is the **client-only** reusable combat UI package: React components, client presentation helpers, and small UI-facing types. It is meant to be imported by **Encounter** (and potentially other surfaces) while staying **free of encounter routes, setup flow, and feature orchestration**.

For the broader refactor goals (engine vs feature vs locations), see **[combat-encounter-refactor-reference.md](./combat-encounter-refactor-reference.md)**. This document only describes the **`features/combat`** tree and its boundaries.

---

## Layering (short)

| Layer | Location | Owns |
|--------|-----------|--------|
| Shared combat engine | `src/features/mechanics/domain/combat` | Truth, selectors, **pure** presentation derivation (React-free) |
| **Client combat UI** | `src/features/combat` | Reusable components, avatar resolution, grid renderer, client-only chip/tooltip/stat helpers |
| Encounter feature | `src/features/encounter` | Routes, setup, active-screen composition, DM workflow, context-heavy wrappers |

Do **not** move pure derivation back into `features/combat/presentation`—that belongs under **`mechanics/domain/combat/presentation`** (see Phase 2 in the refactor reference).

---

## Import rule

Files under **`src/features/combat/**`** must **not** import from **`src/features/encounter/**`** (including hooks, `EncounterRuntimeContext`, routes, or setup types). If a piece of UI needs encounter-specific data, keep a **wrapper** in Encounter and pass props into `features/combat`.

---

## Layout (current)

### `components/`

| Area | Notes |
|------|--------|
| [`avatar/CombatantAvatar.tsx`](../../src/features/combat/components/avatar/CombatantAvatar.tsx) | Token/portrait avatar; uses `presentation/resolveCombatantAvatarSrc`. |
| [`cards/`](../../src/features/combat/components/cards/) | `CombatantPreviewCard`, `combatant-badges` (incl. `combatToneToAppBadgeTone`, chip rows), `CombatActionPreviewCard`. |
| [`action-row/CombatActionRowBase.tsx`](../../src/features/combat/components/action-row/CombatActionRowBase.tsx) | Compact action row presentation (badges + optional footer link props). Router/campaign link construction stays in Encounter (`ActionRow`). |
| [`grid/`](../../src/features/combat/components/grid/) | **`CombatGrid`** (tactical renderer), **`cellVisualState`**, **`cellVisualStyles`**, tests. Encounter exposes a thin **`EncounterGrid`** wrapper that forwards the same props. |

Barrel: [`components/index.ts`](../../src/features/combat/components/index.ts).

### `presentation/`

Client-only helpers (chips, tooltips, modal stat lines, turn-duration re-export, avatar URL resolution). Not a dump for engine logic.

| File | Role |
|------|--------|
| [`build-combatant-preview-chips.ts`](../../src/features/combat/presentation/build-combatant-preview-chips.ts) | Priority-driven preview chips; imports mechanics selectors/presentation only. |
| [`combatant-card-tooltips.ts`](../../src/features/combat/presentation/combatant-card-tooltips.ts) | Stat / condition tooltips for cards. |
| [`combatant-modal-stats.ts`](../../src/features/combat/presentation/combatant-modal-stats.ts) | Monster modal stat lines. |
| [`format-turn-duration.ts`](../../src/features/combat/presentation/format-turn-duration.ts) | Re-exports engine `formatTurnDuration` (single source of truth under mechanics). |
| [`resolveCombatantAvatarSrc.ts`](../../src/features/combat/presentation/resolveCombatantAvatarSrc.ts) | Portrait URL resolution for tokens. |
| [`format-signed.ts`](../../src/features/combat/presentation/format-signed.ts) | Small numeric display helper used by modal stats. |

Barrel: [`presentation/index.ts`](../../src/features/combat/presentation/index.ts). Tests live under [`presentation/__tests__/`](../../src/features/combat/presentation/__tests__/).

Encounter may keep a **thin re-export** of `presentation` under `encounter/helpers/presentation/index.ts` for compatibility; prefer **`@/features/combat/presentation`** in new code.

### `types/`

| File | Role |
|------|--------|
| [`preview-card.ts`](../../src/features/combat/types/preview-card.ts) | `CombatantPreviewCardProps` (includes React `avatar` slot). Encounter domain may re-export this type for compatibility. |

### `hooks/`

Reserved for reusable combat hooks that have **no** Encounter imports. May be empty until a pass justifies a hook.

---

## Public entry

[`src/features/combat/index.ts`](../../src/features/combat/index.ts) re-exports components, presentation, and preview-card types. Prefer **`@/features/combat`** or **`@/features/combat/components`** / **`@/features/combat/presentation`** depending on scope.

---

## Related reference

- [badges.md](./badges.md) — action vs condition badge pipelines (paths updated for mechanics + `features/combat`).
- [space.md](./space.md), [environments.md](./environments.md) — grid / perception / `CombatGrid` vs `EncounterGrid`.
