import Stack from '@mui/material/Stack';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

/**
 * Multi-object-in-cell spacing for authored map object icon rows (workspace overlay + combat inline).
 * Not shell chrome (padding, overflow, selection) — only the shared row layout contract.
 */
export const PLACED_OBJECT_AUTHORED_ICON_ROW_GAP = 0.25;

/**
 * Row `maxWidth` for {@link PlacedObjectAuthoredIconRowStack}: default one-cell cap unless a **single**
 * footprint raster is wider than `cellPx`, in which case allow that width so multi-cell art can paint.
 */
export function resolvePlacedObjectAuthoredIconRowStackMaxWidthPx(args: {
  cellPx: number | undefined;
  /** True when more than one icon/raster shares the row (wrap should stay cell-wide). */
  multiItemRow: boolean;
  /** When `multiItemRow` is false and the sole item has footprint layout, its `layoutWidthPx`. */
  singleObjectLayoutWidthPx?: number | null;
}): number | '100%' {
  const { cellPx, multiItemRow, singleObjectLayoutWidthPx } = args;
  if (cellPx == null) return '100%';
  if (multiItemRow) return cellPx;
  const w = singleObjectLayoutWidthPx;
  if (w != null && w > cellPx) return w;
  return cellPx;
}

export type PlacedObjectAuthoredIconRowStackProps = {
  /**
   * Cell width in px — default max-width when {@link maxWidthPx} is omitted.
   * When omitted (e.g. hex without square px), uses full width of the parent.
   */
  cellPx?: number;
  /**
   * Overrides default `maxWidth` from `cellPx`. Prefer {@link resolvePlacedObjectAuthoredIconRowStackMaxWidthPx}
   * so single wide footprints relax while multi-icon rows stay cell-capped.
   */
  maxWidthPx?: number | '100%';
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
  maxWidthPx,
  children,
  sx,
}: PlacedObjectAuthoredIconRowStackProps) {
  const resolvedMaxWidth =
    maxWidthPx != null ? maxWidthPx : cellPx != null ? cellPx : '100%';
  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      justifyContent="center"
      alignItems="center"
      gap={PLACED_OBJECT_AUTHORED_ICON_ROW_GAP}
      sx={{
        lineHeight: 0,
        maxWidth: resolvedMaxWidth,
        overflow: 'visible',
        ...sx,
      }}
    >
      {children}
    </Stack>
  );
}
