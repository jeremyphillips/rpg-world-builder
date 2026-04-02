# Encounter UI state theme (semantic)

## Purpose

Encounter-specific **state styling** (e.g. “your turn” vs default chrome) should not scatter raw palette imports or ad hoc `alpha()` maps across components. Use a small **feature-owned semantic layer** that maps the active MUI `Theme` into encounter meanings.

## Source of truth

Implementation: [`src/features/encounter/ui/theme/encounterUiStateTheme.ts`](../../../../src/features/encounter/ui/theme/encounterUiStateTheme.ts)

- **`getEncounterUiStateTheme(theme)`** — resolves light/dark values in one place from `theme.palette` and MUI color helpers (`alpha`, `lighten`, etc.).
- **`EncounterUiStateTheme`** — structured by **surface** then **semantic state** (not parallel flat color maps).
- **Header layout** — `header.height` (`layoutFallbackPx`, `cssVarName` for the sticky bar measurement) and `header.bar` (padding + `minHeightPx` + `boxSizing`) live on the theme object. No separate top-level layout exports.

Raw color primitives (`colorPrimitives`) and global [`palette`](../../../../src/app/theme/palette.ts) definitions stay in app theme code. Encounter features **consume** semantic tokens from `getEncounterUiStateTheme`, not primitives, for encounter-specific UI states.

**AppToast** does not use encounter header height tokens — its strip is sized independently.

## Supported surfaces (current)

| Surface | Semantic states | Notes |
|--------|-----------------|--------|
| **Header** (`EncounterActiveHeader`) | `default`, `activeTurn` | `activeTurn` when the viewer is the active combatant for their turn (same condition as the “Your turn — …” headline). |
| **Header height** | `layoutFallbackPx`, `cssVarName` | Fallback before `documentElement` CSS var is set; used by sidebar / grid hover positioning. |
| **Header bar** | padding + `minHeightPx` | Top chrome strip sizing. |
| **Header directive** | `resourcesExhaustedTextColor` | When turn resources are exhausted, directive text uses this token. |

## Scaling pattern

Add new **surfaces** (e.g. `combatantCard`, `targeting`, `overlay`) as sibling keys under `EncounterUiStateTheme`, each with named states and `bgColor` / `borderColor` (or other fields) as needed. Keep resolution inside `getEncounterUiStateTheme` or small helpers next to it so components stay declarative.

## Related

- [client/overview.md](./overview.md) — client combat UI vs Encounter feature boundaries
- [ownership-boundaries.md](../ownership-boundaries.md) — where encounter feature code lives
