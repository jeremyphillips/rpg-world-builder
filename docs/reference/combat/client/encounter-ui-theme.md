# Encounter UI state theme (semantic)

## Purpose

Encounter-specific **layout** and shared tokens should stay in a small feature-owned module. **Colors that must follow the active CSS color scheme** (`colorSchemes` + `cssVariables`) should use **MUI `sx` palette paths** (e.g. `'background.default'`, `'divider'`) or **`(theme) => …`** callbacks in components — **not** baked hex values from `theme.palette` at module or `useMemo` time, which can stick to the light palette while the document is in dark mode.

## Source of truth

Implementation: [`src/features/encounter/ui/theme/encounterUiStateTheme.ts`](../../../../src/features/encounter/ui/theme/encounterUiStateTheme.ts)

- **`getEncounterUiStateTheme(theme)`** — header **height** (CSS var name + layout fallback px), **bar** padding / `minHeight`, and **`header.chrome`** (see below).
- **`header.chrome`** — module-level map: **`default`** and **`activeTurn`** use `EncounterMuiSxColor` — palette path strings (`'background.default'`, `'divider'`) or **`(theme) => string`** for `alpha` / `lighten` (live `theme` when `sx` runs, no one-off hex snapshot). **`directive.resourcesExhaustedTextColor`** is `'warning.main'`.
- **`EncounterActiveHeader`** — picks `header.chrome[activeTurn ? 'activeTurn' : 'default']` for `bgcolor` / `borderColor`; directive line uses `chrome.directive.resourcesExhaustedTextColor` when resources are exhausted. The header root is a **`Box`**, not **`Paper`**, to avoid Paper’s default `paper` fill and `--Paper-overlay` elevation wash.

Raw color primitives (`colorPrimitives`) and global [`palette`](../../../../src/app/theme/palette.ts) definitions stay in app theme code.

**AppToast** does not use encounter header height tokens — its strip is sized independently.

## Supported surfaces (current)

| Surface | Notes |
|--------|--------|
| **Header layout** | `header.height`, `header.bar` on `EncounterUiStateTheme`. |
| **Header chrome colors** | `header.chrome` (`default` / `activeTurn` / `directive`) — safe palette paths + resolvers in `encounterUiStateTheme.ts`. |

## Scaling pattern

Add **layout** or **non-scheme** tokens under `EncounterUiStateTheme`. For **theme-mode-aware colors**, prefer **palette path strings** or **`sx` functions** in the component.

## Related

- [client/overview.md](./overview.md) — client combat UI vs Encounter feature boundaries
- [ownership-boundaries.md](../ownership-boundaries.md) — where encounter feature code lives
- **Combat grid cell visuals (in scope)** — Tactical fill and movement overlays come from [`cellVisualStyles.ts`](../../../../src/features/combat/components/grid/cellVisualStyles.ts) and [`cellVisualState.ts`](../../../../src/features/combat/components/grid/cellVisualState.ts), using the same **theme-mode-aware** `sx` pattern as above (palette paths / `(theme) => …`, not stale hex snapshots). A planned **structural** alignment with authoring map grids—shared `GridCellHost` / `GridCellVisual` markup, **separate** domain builders—does not move authoring chrome into combat; combat styling stays in these modules.
