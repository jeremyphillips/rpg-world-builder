# Encounter UI state theme (semantic)

## Purpose

Encounter-specific **layout** and shared tokens should stay in a small feature-owned module. **Colors that must follow the active CSS color scheme** (`colorSchemes` + `cssVariables`) should use **MUI `sx` palette paths** (e.g. `'background.default'`, `'divider'`) or **`(theme) => …`** callbacks in components — **not** baked hex values from `theme.palette` at module or `useMemo` time, which can stick to the light palette while the document is in dark mode.

## Source of truth

Implementation: [`src/features/encounter/ui/theme/encounterUiStateTheme.ts`](../../../../src/features/encounter/ui/theme/encounterUiStateTheme.ts)

- **`getEncounterUiStateTheme(theme)`** — header **height** (CSS var name + layout fallback px) and **bar** padding / `minHeight` (layout only).
- **`EncounterActiveHeader`** — header **fill and border** use `sx` with `'background.default'`, `'divider'`, and `alpha` / `lighten` on **`theme`** from callbacks so values track `--mui-palette-*` at runtime. The header root is a **`Box`**, not **`Paper`**, to avoid Paper’s default `paper` fill and `--Paper-overlay` elevation wash.

Raw color primitives (`colorPrimitives`) and global [`palette`](../../../../src/app/theme/palette.ts) definitions stay in app theme code.

**AppToast** does not use encounter header height tokens — its strip is sized independently.

## Supported surfaces (current)

| Surface | Notes |
|--------|--------|
| **Header layout** | `header.height`, `header.bar` on `EncounterUiStateTheme`. |
| **Header chrome colors** | Resolved in `EncounterActiveHeader` `sx` (see above). |

## Scaling pattern

Add **layout** or **non-scheme** tokens under `EncounterUiStateTheme`. For **theme-mode-aware colors**, prefer **palette path strings** or **`sx` functions** in the component.

## Related

- [client/overview.md](./overview.md) — client combat UI vs Encounter feature boundaries
- [ownership-boundaries.md](../ownership-boundaries.md) — where encounter feature code lives
