/**
 * Shared grid cell styling tokens for location map `GridEditor` and `HexGridEditor`.
 * Keeps visual parity between square and hex renderers.
 */
import type { Theme } from '@mui/material/styles';

/** MUI `sx` palette path for default square/hex grid cell borders. */
export const GRID_CELL_BORDER_COLOR = 'divider';

/** MUI `sx` palette path for grid cell border on hover (non-selected). */
export const GRID_CELL_BORDER_COLOR_HOVER = 'primary.main';

/**
 * MUI palette paths for `borderColor` / `bgcolor` in `sx` (nested for readability).
 */
export const gridCellPalette = {
  border: {
    default: GRID_CELL_BORDER_COLOR,
    excluded: 'text.disabled',
    hover: GRID_CELL_BORDER_COLOR_HOVER,
    selected: 'primary.main',
  },
  background: {
    default: 'background.paper',
    excluded: 'action.disabledBackground',
    selected: 'none',
    hover: 'background.paper',
  },
} as const;

/** Inset ring width when a square cell is selected (`boxShadow`). */
export const gridCellSelectedInsetPx = 2;

export function gridCellSelectedShadow(theme: Theme) {
  return `inset 0 0 0 ${gridCellSelectedInsetPx}px ${theme.palette.primary.main}`;
}
