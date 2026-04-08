import Stack from '@mui/material/Stack';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

/**
 * Multi-object-in-cell spacing for authored map object icon rows (workspace overlay + combat inline).
 * Not shell chrome (padding, overflow, selection) — only the shared row layout contract.
 */
export const PLACED_OBJECT_AUTHORED_ICON_ROW_GAP = 0.25;

export type PlacedObjectAuthoredIconRowStackProps = {
  /**
   * Cell width in px — caps the row to one cell for parity with encounter tactical inline icons.
   * When omitted (e.g. hex without square px), uses full width of the parent.
   */
  cellPx?: number;
  children: ReactNode;
  /** Shell-only layout (pointer-events, z-index, position). Do not use for footprint math. */
  sx?: SxProps<Theme>;
};

/**
 * Shared horizontal wrap row for registry placed-object rasters in a grid cell.
 * Aligns max-width and gap with combat inline so perceived scale stays consistent when `cellPx` matches.
 */
export function PlacedObjectAuthoredIconRowStack({
  cellPx,
  children,
  sx,
}: PlacedObjectAuthoredIconRowStackProps) {
  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      justifyContent="center"
      alignItems="center"
      gap={PLACED_OBJECT_AUTHORED_ICON_ROW_GAP}
      sx={{
        lineHeight: 0,
        maxWidth: cellPx != null ? cellPx : '100%',
        ...sx,
      }}
    >
      {children}
    </Stack>
  );
}
