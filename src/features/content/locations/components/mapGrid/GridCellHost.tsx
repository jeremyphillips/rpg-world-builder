import Box, { type BoxProps } from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

import { gridCellHostAuthoringFocusRingSx, gridCellHostButtonResetSx } from './gridCellHost.sx';

const HOST_CLASS = 'grid-cell-host';

export type GridCellHostProps = Omit<BoxProps, 'component' | 'sx' | 'type' | 'disabled'> & {
  interactive: boolean;
  /** Native button disabled (ignored when `interactive` is false). */
  disabled?: boolean;
  /** When `interactive`, merged after button reset + default focus ring (authoring blue). Combat can override via `sx`. */
  sx?: SxProps<Theme>;
  /** Set false to skip authoring focus ring (e.g. combat applies its own `sx`). */
  showAuthoringFocusRing?: boolean;
};

/**
 * Interactive map cell **shell**: semantics, native `<button>` when `interactive`, disabled, and
 * pointer handlers. Visible chrome lives in {@link GridCellVisual}.
 */
export default function GridCellHost({
  interactive,
  children,
  className,
  sx,
  showAuthoringFocusRing = true,
  ...rest
}: GridCellHostProps) {
  return (
    <Box
      {...rest}
      className={[HOST_CLASS, className].filter(Boolean).join(' ')}
      component={interactive ? 'button' : 'div'}
      type={interactive ? 'button' : undefined}
      sx={[
        interactive ? gridCellHostButtonResetSx : {},
        interactive && showAuthoringFocusRing ? gridCellHostAuthoringFocusRingSx : {},
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  );
}

export { HOST_CLASS as GRID_CELL_HOST_CLASS };
