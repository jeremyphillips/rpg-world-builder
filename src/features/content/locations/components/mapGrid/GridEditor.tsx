import {
  useMemo,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import Box from '@mui/material/Box';
import { makeGridCellId } from '@/shared/domain/grid';
import { colorPrimitives } from '@/app/theme/colorPrimitives';
import {
  GRID_CELL_BORDER_COLOR,
  GRID_CELL_BORDER_COLOR_HOVER,
  gridCellPalette,
  gridCellSelectedShadow,
} from './gridCellStyles';
import type { LocationMapSelection } from '@/features/content/locations/components/workspace/locationEditorRail.types';
import {
  shouldApplyCellHoverChrome,
  shouldApplyCellSelectedChrome,
} from './mapGridCellVisualState';
import { SQUARE_GRID_GAP_PX } from '@/features/content/locations/components/squareGridMapOverlayGeometry';

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
  /** Optional whole-cell background (e.g. terrain fill); selection / excluded still win. */
  getCellBackgroundColor?: (cell: GridCell) => string | undefined;
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
   * Select-mode hover winner from map hit-testing. When set, cell `:hover` chrome follows
   * {@link shouldApplyCellHoverChrome}; omit in other modes so all cells keep normal hover.
   */
  selectHoverTarget?: LocationMapSelection;
  /** When true, grid root uses `cursor: default` so inter-cell gutters inherit it (not `pointer`). */
  selectModeCursor?: boolean;
};

export default function GridEditor({
  columns,
  rows,
  selectedCellId,
  excludedCellIds,
  onCellClick,
  getCellBackgroundColor,
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
        const fillBg = getCellBackgroundColor?.(cell);
        const allowHover = shouldApplyCellHoverChrome(cellId, selectHoverTargetProp);

        return (
          <Box
            key={cellId}
            component="button"
            type="button"
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
            }}
            onPointerUp={(e) => {
              onCellPointerUp?.(e, cell);
            }}
            className={extraClass}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              aspectRatio: '1',
              minWidth: 0,
              minHeight: 0,
              border: 1,
              borderRadius: 0.5,
              borderColor: selected
                ? gridCellPalette.border.selected
                : excluded
                  ? gridCellPalette.border.excluded
                  : GRID_CELL_BORDER_COLOR,
              borderStyle: excluded && !selected ? 'dashed' : 'solid',
              bgcolor: selected
                ? gridCellPalette.background.selected
                : excluded
                  ? gridCellPalette.background.excluded
                  : fillBg ?? gridCellPalette.background.default,
              backgroundImage: excluded
                ? 'repeating-linear-gradient(-45deg, rgba(0,0,0,0.04), rgba(0,0,0,0.04) 3px, transparent 3px, transparent 6px)'
                : undefined,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 0.25,
              cursor: disabled ? 'default' : 'pointer',
              fontSize: '0.65rem',
              lineHeight: 1.2,
              color: excluded ? 'rgba(0,0,0,0.45)' : colorPrimitives.black,
              boxShadow: selected ? gridCellSelectedShadow() : undefined,
              '&:hover': disabled || !allowHover
                ? undefined
                : {
                    borderColor: selected
                      ? gridCellPalette.border.selected
                      : GRID_CELL_BORDER_COLOR_HOVER,
                    bgcolor: selected
                      ? gridCellPalette.background.selected
                      : excluded
                        ? gridCellPalette.background.excluded
                        : fillBg ?? gridCellPalette.background.hover,
                  },
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
        );
      })}
    </Box>
  );
}
