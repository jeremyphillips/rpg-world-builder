/**
 * Shared grid cell styling tokens for location map `GridEditor` and `HexGridEditor`.
 * Fixed colors from `colorPrimitives` so map chrome does not follow MUI light/dark mode.
 */
import { alpha } from '@mui/material/styles';

import { colorPrimitives } from '@/app/theme/colorPrimitives';

/** Default grid line between cells. */
export const GRID_CELL_BORDER_COLOR = alpha(colorPrimitives.black, 0.14);

/** Hover ring accent (matches map primary accent). */
export const GRID_CELL_BORDER_COLOR_HOVER = colorPrimitives.blue[300];

/**
 * Border and background fills for grid cells (hex rings + square buttons).
 */
export const gridCellPalette = {
  border: {
    default: GRID_CELL_BORDER_COLOR,
    excluded: alpha(colorPrimitives.gray[200], 0.45),
    hover: GRID_CELL_BORDER_COLOR_HOVER,
    selected: colorPrimitives.blue[300],
  },
  background: {
    default: colorPrimitives.gray[100],
    excluded: alpha(colorPrimitives.black, 0.06),
    /** Let terrain / selection styling show through. */
    selected: 'transparent',
    hover: colorPrimitives.gray[100],
  },
} as const;

/** Inset ring width when a square cell is selected (`boxShadow`). */
export const gridCellSelectedInsetPx = 2;

export function gridCellSelectedShadow(): string {
  return `inset 0 0 0 ${gridCellSelectedInsetPx}px ${colorPrimitives.blue[300]}`;
}
