import {
  useMemo,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import Box from '@mui/material/Box';
import { makeGridCellId } from '@/shared/domain/grid';
import type { LocationMapSelection } from '@/features/content/locations/components/workspace/rightRail/types';
import { shouldApplyCellSelectedChrome } from './mapGridCellVisualState';
import { SQUARE_GRID_GAP_PX } from '@/features/content/locations/components/authoring/geometry/squareGridMapOverlayGeometry';
import {
  buildSquareAuthoringCellVisualParts,
  GRID_CELL_AUTHORING_FILL_CLASS,
} from './mapGridAuthoringCellVisual.builder';
import type { AuthoringCellFillPresentation } from './mapGridAuthoringCellFill.types';
import GridCellHost from './GridCellHost';
import GridCellVisual from './GridCellVisual';

export type GridCell = {
  cellId: string;
  x: number;
  y: number;
};

export type GridEditorProps = {
  columns: number;
  rows: number;
  selectedCellId?: string | null;
  /** Cells masked out of walkable layout (authoring); distinct from selection styling. */
  excludedCellIds?: string[];
  onCellClick?: (cell: GridCell, event: ReactMouseEvent<HTMLElement>) => void;
  /** Optional cell fill (swatch + optional image); chrome applies fill opacity to the fill layer only. */
  getCellFillPresentation?: (cell: GridCell) => AuthoringCellFillPresentation | undefined;
  onCellPointerDown?: (e: ReactPointerEvent<HTMLElement>, cell: GridCell) => void;
  onCellPointerEnter?: (e: ReactPointerEvent<HTMLElement>, cell: GridCell) => void;
  onCellPointerUp?: (e: ReactPointerEvent<HTMLElement>, cell: GridCell) => void;
  getCellLabel?: (cell: GridCell) => string | undefined;
  /** When set, rendered inside the cell instead of {@link getCellLabel} text. */
  renderCellContent?: (cell: GridCell) => ReactNode;
  getCellClassName?: (cell: GridCell) => string | undefined;
  className?: string;
  disabled?: boolean;
  /**
   * Select-mode hover winner from map hit-testing. When set, cell `:hover` chrome is coordinated
   * with map hit-testing; omit in other modes so all cells keep normal hover.
   */
  selectHoverTarget?: LocationMapSelection;
  /** When true, grid root uses `cursor: default` so inter-cell gutters inherit it (not `pointer`). */
  selectModeCursor?: boolean;
  /**
   * When true, skip the terrain swatch `Box` — used when terrain renders in a detached layer below path SVG.
   */
  omitTerrainFill?: boolean;
  /** Fired when `omitTerrainFill` so the terrain layer can mirror hover fill chrome (pointer-events none there). */
  onAuthoringCellHoverChange?: (cellId: string | null) => void;
};

export default function GridEditor({
  columns,
  rows,
  selectedCellId,
  excludedCellIds,
  onCellClick,
  getCellFillPresentation,
  onCellPointerDown,
  onCellPointerEnter,
  onCellPointerUp,
  getCellLabel,
  renderCellContent,
  getCellClassName,
  className,
  disabled,
  selectHoverTarget: selectHoverTargetProp,
  selectModeCursor = false,
  omitTerrainFill = false,
  onAuthoringCellHoverChange,
}: GridEditorProps) {
  const safeCols = Math.max(0, Math.floor(columns));
  const safeRows = Math.max(0, Math.floor(rows));
  const excludedSet = useMemo(
    () => new Set(excludedCellIds ?? []),
    [excludedCellIds],
  );

  return (
    <Box
      className={className}
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${safeCols}, minmax(0, 1fr))`,
        // Must match `SQUARE_GRID_GAP_PX` / `useLocationAuthoringGridLayout` so SVG edge geometry aligns with gutters.
        gap: `${SQUARE_GRID_GAP_PX}px`,
        width: '100%',
        maxWidth: '100%',
        ...(selectModeCursor ? { cursor: 'default' } : {}),
      }}
      role="grid"
      aria-colcount={safeCols}
      aria-rowcount={safeRows}
      onPointerLeave={
        omitTerrainFill
          ? () => {
              onAuthoringCellHoverChange?.(null);
            }
          : undefined
      }
    >
      {Array.from({ length: safeRows * safeCols }, (_, i) => {
        const x = i % safeCols;
        const y = Math.floor(i / safeCols);
        const cellId = makeGridCellId(x, y);
        const cell: GridCell = { cellId, x, y };
        const label = getCellLabel?.(cell);
        const custom = renderCellContent?.(cell);
        const extraClass = getCellClassName?.(cell);
        const selected = shouldApplyCellSelectedChrome(selectedCellId, cellId);
        const excluded = excludedSet.has(cellId);
        const fillPresentation = getCellFillPresentation?.(cell);

        const { shell, fillLayer } = buildSquareAuthoringCellVisualParts({
          cellId,
          selected,
          excluded,
          fillPresentation,
          disabled: !!disabled,
          selectHoverTarget: selectHoverTargetProp,
        });

        return (
          <GridCellHost
            key={cellId}
            interactive
            role="gridcell"
            data-cell-id={cellId}
            aria-selected={selected}
            aria-label={
              excluded
                ? `Cell ${x}, ${y}, excluded from layout`
                : `Cell ${x}, ${y}`
            }
            disabled={disabled}
            onClick={(e) => !disabled && onCellClick?.(cell, e)}
            onPointerDown={(e) => {
              onCellPointerDown?.(e, cell);
            }}
            onPointerEnter={(e) => {
              onCellPointerEnter?.(e, cell);
              if (omitTerrainFill) onAuthoringCellHoverChange?.(cell.cellId);
            }}
            onPointerUp={(e) => {
              onCellPointerUp?.(e, cell);
            }}
            className={extraClass}
            sx={{
              position: 'relative',
              // overflow: 'hidden' — disabled: clips placed-object rasters that extend past one cell (multi-cell footprint layout).
              aspectRatio: '1',
              minWidth: 0,
              minHeight: 0,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'stretch',
              cursor: disabled ? 'default' : 'pointer',
            }}
          >
            <GridCellVisual sx={shell} centerChildren={false}>
              {!omitTerrainFill ? (
              <Box
                className={GRID_CELL_AUTHORING_FILL_CLASS}
                sx={fillLayer}
                aria-hidden
              />
              ) : null}
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 0,
                  p: 0.25,
                }}
              >
                {custom != null && custom !== false ? (
                  <Box
                    sx={{
                      px: 0.25,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      maxWidth: '100%',
                      minHeight: 0,
                    }}
                  >
                    {custom}
                  </Box>
                ) : label != null && label !== '' ? (
                  <Box component="span" sx={{ px: 0.25, textAlign: 'center', wordBreak: 'break-word' }}>
                    {label}
                  </Box>
                ) : null}
              </Box>
            </GridCellVisual>
          </GridCellHost>
        );
      })}
    </Box>
  );
}
