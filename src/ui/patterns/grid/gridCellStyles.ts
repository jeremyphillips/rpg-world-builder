/**
 * Shared grid cell styling tokens for GridEditor and HexGridEditor.
 * Keeps visual parity between square and hex renderers.
 */
import type { Theme } from '@mui/material/styles'

export const GRID_CELL_BORDER_COLOR = 'divider' as const
export const GRID_CELL_BORDER_COLOR_EXCLUDED = 'text.disabled' as const

export const gridCellBorderSx = (theme: Theme, excluded: boolean) =>
  excluded ? theme.palette.text.disabled : theme.palette.divider

export const gridCellSelectedShadow = (theme: Theme) =>
  `inset 0 0 0 2px ${theme.palette.primary.main}`
