import type { Theme } from '@mui/material/styles'
import { alpha, lighten } from '@mui/material/styles'

import type { TurnOrderStatus } from '@/features/mechanics/domain/combat/presentation/view/tactical-preview.types'

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
  /** Participation / visibility opacity factors (aligned with mechanics participation visuals). */
  participation: {
    defeatedOpacity: number
    battlefieldAbsentOpacity: number
    unseenViewerDimFactor: number
  }
  turnOrderRow: {
    current: {
      borderColor: string
      borderWidth: string
    }
    default: {
      borderColor: string
      borderWidth: string
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
  const rowBorderWidth = '1px'

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
    participation: {
      defeatedOpacity: 0.5,
      battlefieldAbsentOpacity: 0.5,
      unseenViewerDimFactor: 0.68,
    },
    turnOrderRow: {
      current: {
        borderColor: 'transparent',
        borderWidth: rowBorderWidth,
      },
      default: {
        borderColor: divider,
        borderWidth: rowBorderWidth,
      },
    },
  }
}

export type EncounterTurnOrderRowOpacityInput = {
  status: TurnOrderStatus
  /** True when the combatant is not defeated but has no battlefield presence (banished, off-grid, …). */
  isBattlefieldAbsent: boolean
  nonVisibleViewerPresentation?: boolean
}

/**
 * Row opacity for turn-order list Paper, using participation factors from {@link getEncounterUiStateTheme}.
 */
export function getEncounterTurnOrderRowOpacity(
  theme: Theme,
  input: EncounterTurnOrderRowOpacityInput,
): number {
  const p = getEncounterUiStateTheme(theme).participation
  let o = 1
  if (input.status === 'defeated') o = p.defeatedOpacity
  else if (input.isBattlefieldAbsent) o = p.battlefieldAbsentOpacity
  if (input.nonVisibleViewerPresentation) o *= p.unseenViewerDimFactor
  return o
}
