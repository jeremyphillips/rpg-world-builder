import type { SxProps, Theme } from '@mui/material/styles';

import { colorPrimitives } from '@/app/theme/colorPrimitives';

import { GRID_CELL_VISUAL_CLASS } from './GridCellVisual';

/** Minimal reset so map cell `sx` controls appearance instead of global `button {}` in `index.css`. */
export const gridCellHostButtonResetSx: SxProps<Theme> = {
  bgcolor: 'transparent',
  color: 'inherit',
  border: 'none',
  borderRadius: 0,
  p: 0,
  m: 0,
  fontSize: 'inherit',
  fontWeight: 'inherit',
  fontFamily: 'inherit',
  transition: 'none',
  '&:hover': { opacity: 1 },
};

export const gridCellHostAuthoringFocusRingSx: SxProps<Theme> = {
  '&:focus-visible': {
    outline: 'none',
  },
  [`&:focus-visible .${GRID_CELL_VISUAL_CLASS}`]: {
    outline: `2px solid ${colorPrimitives.blue[300]}`,
    outlineOffset: 2,
  },
};
