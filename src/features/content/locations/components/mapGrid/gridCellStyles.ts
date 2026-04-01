/**
 * Shared grid cell styling tokens for location map `GridEditor` and `HexGridEditor`.
 * Keeps visual parity between square and hex renderers.
 */
import type { Theme } from '@mui/material/styles';

/**
 * MUI palette paths for `borderColor` / `bgcolor` in `sx` (nested for readability).
 */
export const gridCellPalette = {
  border: {
    default: 'divider',
    excluded: 'text.disabled',
    hover: 'primary.main',
    selected: 'primary.main',
  },
  background: {
    default: 'background.paper',
    excluded: 'action.disabledBackground',
    selected: 'background.paper',
    hover: 'background.paper',
  },
} as const;

/** Inset ring width when a square cell is selected (`boxShadow`). */
export const gridCellSelectedInsetPx = 2;

export function gridCellSelectedShadow(theme: Theme) {
  return `inset 0 0 0 ${gridCellSelectedInsetPx}px ${theme.palette.primary.main}`;
}
