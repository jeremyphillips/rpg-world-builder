import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

export type GridCellVisualProps = {
  children?: ReactNode;
  className?: string;
  sx?: SxProps<Theme>;
  /**
   * When set, skip the default square-fill flex layout (hex ring/fill layers use absolute `sx` only).
   */
  omitLayoutFill?: boolean;
  /**
   * Flex-center cell content (tokens, labels, icons). Applied before `sx` so domain styles can override.
   * @default true
   */
  centerChildren?: boolean;
};

const VISUAL_CLASS = 'grid-cell-visual';

const layoutFillSx: SxProps<Theme> = {
  flex: 1,
  alignSelf: 'stretch',
  minHeight: 0,
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  position: 'relative',
};

const centerChildrenSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

/**
 * Authoring/combat cell **chrome** layer (fills the host’s content box). Keyboard focus ring is
 * applied from {@link GridCellHost} via `&:focus-visible .grid-cell-visual` so outline is not
 * fighting global `button {}` styles on the host.
 */
export default function GridCellVisual({
  children,
  className,
  sx,
  omitLayoutFill,
  centerChildren = true,
}: GridCellVisualProps) {
  return (
    <Box
      className={[VISUAL_CLASS, className].filter(Boolean).join(' ')}
      sx={[
        omitLayoutFill ? { boxSizing: 'border-box' } : layoutFillSx,
        centerChildren ? centerChildrenSx : {},
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  );
}

export { VISUAL_CLASS as GRID_CELL_VISUAL_CLASS };
