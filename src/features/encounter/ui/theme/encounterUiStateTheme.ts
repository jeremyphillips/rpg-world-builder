import type { Theme } from '@mui/material/styles'

/**
 * Semantic encounter UI tokens derived from the active MUI theme.
 * Prefer **palette path strings** (e.g. `'background.default'`) in component `sx` when colors must
 * track **CSS color-scheme** (`colorSchemes` + `cssVariables`); do not bake `theme.palette.*` hex
 * here — those resolve once and can stay on the light palette while the document is in dark mode.
 */
export type EncounterUiStateTheme = {
  header: {
    /** Sticky header strip height: CSS custom property name + px fallback before it is set. */
    height: {
      layoutFallbackPx: number
      cssVarName: string
    }
    /** Padding and min height for the top chrome (header strip). */
    bar: {
      horizontalSpacing: number
      verticalSpacing: number
      minHeightPx: number
      boxSizing: 'border-box'
    }
  }
}

/**
 * Layout and non–color-scheme-dependent tokens. Header **fill and border** use `sx` palette paths
 * / callbacks in `EncounterActiveHeader` so dark/light follow `--mui-palette-*` at runtime.
 */
export function getEncounterUiStateTheme(_theme: Theme): EncounterUiStateTheme {
  return {
    header: {
      height: {
        layoutFallbackPx: 104,
        cssVarName: '--encounter-active-header-height',
      },
      bar: {
        horizontalSpacing: 4,
        verticalSpacing: 2,
        minHeightPx: 104,
        boxSizing: 'border-box',
      },
    },
  }
}
