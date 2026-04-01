/**
 * Shared grid cell styling tokens for location map `GridEditor` and `HexGridEditor`.
 * Keeps visual parity between square and hex renderers.
 */
import type { Theme } from '@mui/material/styles';

/** MUI palette paths for `borderColor` / `bgcolor` in `sx`. */
export const GRID_CELL_BORDER_COLOR = 'divider' as const;
export const GRID_CELL_BORDER_COLOR_EXCLUDED = 'text.disabled' as const;
export const GRID_CELL_BORDER_COLOR_HOVER = 'primary.main' as const;
export const GRID_CELL_BORDER_COLOR_SELECTED = 'primary.main' as const;

export const GRID_CELL_BG_COLOR = 'background.paper' as const;
export const GRID_CELL_BG_COLOR_EXCLUDED = 'action.disabledBackground' as const;
export const GRID_CELL_BG_COLOR_SELECTED = 'background.paper' as const;
export const GRID_CELL_BG_COLOR_HOVER = 'background.paper' as const;

export const gridCellSelectedShadow = (theme: Theme) =>
  `inset 0 0 0 2px ${theme.palette.primary.main}`;
