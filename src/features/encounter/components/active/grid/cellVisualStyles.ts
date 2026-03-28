import type { Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'
import type { SystemStyleObject } from '@mui/system'
import type { CellBaseFillKind, CellMovementVisual, CellVisualState } from './cellVisualState'

const CELL_TRANSITION = 'background-color 0.15s, box-shadow 0.15s, outline 0.15s' as const

function baseFillSx(theme: Theme, kind: CellBaseFillKind): SystemStyleObject<Theme> {
  const { palette } = theme
  switch (kind) {
    case 'blocked':
      return { bgcolor: palette.action.disabledBackground }
    case 'placement-invalid-hover':
      return { bgcolor: alpha(palette.error.main, 0.38) }
    case 'placement-selected':
      return { bgcolor: alpha(palette.primary.main, 0.32) }
    case 'placement-cast-range':
      return { bgcolor: alpha(palette.info.main, 0.12) }
    case 'aoe-invalid-origin-hover':
      return { bgcolor: alpha(palette.error.main, 0.42) }
    case 'aoe-origin-locked':
      return { bgcolor: alpha(palette.error.main, 0.32) }
    case 'aoe-template':
      return { bgcolor: alpha(palette.error.light, 0.26) }
    case 'aoe-cast-range':
      // First-class overlay: same as open ground (no extra tint); precedence still suppresses movement fill.
      return { bgcolor: palette.background.paper }
    case 'persistent-attached-aura':
      return { bgcolor: alpha(palette.secondary.main, 0.3) }
    case 'paper':
      return { bgcolor: palette.background.paper }
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

function movementSx(theme: Theme, visual: CellMovementVisual): SystemStyleObject<Theme> {
  const { palette } = theme
  switch (visual) {
    case 'none':
      return {}
    case 'rejected-hover':
      return {
        // Inset ring + dashed edge: readable on aura/placement fills without a movement fill.
        boxShadow: `inset 0 0 0 2px ${alpha(palette.error.main, 0.4)}`,
        outline: `1px dashed ${alpha(palette.error.main, 0.5)}`,
        outlineOffset: 0,
      }
    case 'reachable-fill-strong':
      return {
        boxShadow: `inset 0 0 0 3px ${alpha(palette.success.main, 0.4)}`,
        // bgcolor: alpha(palette.success.main, 0.5),
      }
    case 'reachable-fill-weak':
      return {
        boxShadow: `inset 0 0 0 2px ${alpha(palette.success.main, 0.3)}`,
        // bgcolor: alpha(palette.success.main, 0.3),
      }
    case 'reachable-border-only':
      return {
        boxShadow: `inset 0 0 0 2px ${alpha(palette.success.main, 0.92)}`,
      }
    case 'reachable-border-only-hover':
      return {
        boxShadow: `inset 0 0 0 3px ${alpha(palette.success.main, 1)}`,
      }
    default: {
      const _exhaustive: never = visual
      return _exhaustive
    }
  }
}

/**
 * Maps {@link CellVisualState} to cell `Box` sx. Base fill is applied first; movement overlays override bgcolor/outline when active.
 */
export function getCellVisualSx(theme: Theme, state: CellVisualState): SystemStyleObject<Theme> {
  return {
    ...baseFillSx(theme, state.baseFillKind),
    ...movementSx(theme, state.movementVisual),
    transition: CELL_TRANSITION,
    outlineOffset: 0,
    boxSizing: 'border-box',
  }
}
