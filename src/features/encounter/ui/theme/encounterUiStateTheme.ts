import type { Theme } from '@mui/material/styles'
import { alpha, lighten } from '@mui/material/styles'

/**
 * Semantic encounter UI colors derived from the active MUI theme (light/dark resolved here).
 * Feature-owned: do not extend the global palette; map palette roles into encounter meanings.
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
    default: {
      bgColor: string
      borderColor: string
    }
    activeTurn: {
      bgColor: string
      borderColor: string
    }
    directive: {
      resourcesExhaustedTextColor: string
    }
  }
}

/**
 * Resolves encounter semantic UI tokens from `theme.palette` / MUI color helpers.
 * Keeps raw primitives and app palette wiring out of leaf components.
 */
export function getEncounterUiStateTheme(theme: Theme): EncounterUiStateTheme {
  const paper = theme.palette.background.paper
  const divider = theme.palette.divider
  const isDark = theme.palette.mode === 'dark'

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
      default: {
        bgColor: paper,
        borderColor: divider,
      },
      activeTurn: {
        bgColor: isDark
          ? lighten(paper, 0.06)
          : alpha(theme.palette.primary.main, 0.07),
        borderColor: alpha(theme.palette.primary.main, isDark ? 0.5 : 0.32),
      },
      directive: {
        resourcesExhaustedTextColor: theme.palette.warning.main,
      },
    },
  }
}
