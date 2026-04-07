/**
 * Hex grid editor for location/world-scale map authoring.
 *
 * Uses an odd-q offset layout within bounded columns/rows. Each hex cell is
 * absolutely positioned with a CSS `clip-path` hexagon. Props mirror
 * {@link GridEditorProps} from `GridEditor` so the two can be swapped by
 * `LocationGridAuthoringSection` without changing callback shapes.
 *
 * Stroke is a ring between two clipped layers: outer ring color; inner = fill, inset by stroke width, same path.
 *
 * Advanced hex tooling (drag-paint, overlays, zoom calibration) is deferred.
 */
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
import {
  buildHexAuthoringCellVisualParts,
  hexAuthoringCellVisualClassNames,
} from './mapGridAuthoringCellVisual.builder';
import GridCellHost from './GridCellHost';
import GridCellVisual from './GridCellVisual';

export type HexGridCell = {
  cellId: string;
  x: number;
  y: number;
};

export type HexGridEditorProps = {
  columns: number;
  rows: number;
  selectedCellId?: string | null;
  excludedCellIds?: string[];
  onCellClick?: (cell: HexGridCell, event: ReactMouseEvent<HTMLElement>) => void;
  getCellBackgroundColor?: (cell: HexGridCell) => string | undefined;
  onCellPointerDown?: (e: ReactPointerEvent<HTMLElement>, cell: HexGridCell) => void;
  onCellPointerEnter?: (e: ReactPointerEvent<HTMLElement>, cell: HexGridCell) => void;
  onCellPointerUp?: (e: ReactPointerEvent<HTMLElement>, cell: HexGridCell) => void;
  getCellLabel?: (cell: HexGridCell) => string | undefined;
  renderCellContent?: (cell: HexGridCell) => ReactNode;
  getCellClassName?: (cell: HexGridCell) => string | undefined;
  className?: string;
  disabled?: boolean;
  /** Pixel width of a single hex cell. Defaults to 48. */
  hexSize?: number;
  /** See {@link GridEditorProps.selectHoverTarget}. */
  selectHoverTarget?: LocationMapSelection;
};

const CLIP_HEX = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';

export default function HexGridEditor({
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
  hexSize = 48,
  selectHoverTarget: selectHoverTargetProp,
}: HexGridEditorProps) {
  const safeCols = Math.max(0, Math.floor(columns));
  const safeRows = Math.max(0, Math.floor(rows));
  const excludedSet = useMemo(
    () => new Set(excludedCellIds ?? []),
    [excludedCellIds],
  );

  const hexW = hexSize;
  const hexH = hexSize * (Math.sqrt(3) / 2);

  const colStep = hexW * 0.75;
  const rowStep = hexH;

  const containerW = safeCols > 0 ? colStep * (safeCols - 1) + hexW : 0;
  const containerH =
    safeRows > 0
      ? rowStep * (safeRows - 1) + hexH + rowStep * 0.5
      : 0;

  return (
    <Box
      className={className}
      role="grid"
      aria-colcount={safeCols}
      aria-rowcount={safeRows}
      sx={{
        position: 'relative',
        width: containerW,
        height: containerH,
      }}
    >
      {Array.from({ length: safeRows * safeCols }, (_, i) => {
        const x = i % safeCols;
        const y = Math.floor(i / safeCols);
        const cellId = makeGridCellId(x, y);
        const cell: HexGridCell = { cellId, x, y };
        const label = getCellLabel?.(cell);
        const custom = renderCellContent?.(cell);
        const extraClass = getCellClassName?.(cell);
        const selected = shouldApplyCellSelectedChrome(selectedCellId, cellId);
        const excluded = excludedSet.has(cellId);

        const isOddCol = x % 2 === 1;
        const px = x * colStep;
        const py = y * rowStep + (isOddCol ? hexH * 0.5 : 0);

        const strokePx = selected ? '2px' : '1px';

        const fillBg = getCellBackgroundColor?.(cell);

        const { outer, inner, hostHoverSx } = buildHexAuthoringCellVisualParts({
          cellId,
          selected,
          excluded,
          fillBg,
          disabled: !!disabled,
          selectHoverTarget: selectHoverTargetProp,
          strokePx,
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
                ? `Hex ${x}, ${y}, excluded from layout`
                : `Hex ${x}, ${y}`
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
              position: 'absolute',
              left: px,
              top: py,
              width: hexW,
              height: hexH,
              boxSizing: 'border-box',
              clipPath: CLIP_HEX,
              cursor: disabled ? 'default' : 'pointer',
              ...hostHoverSx,
            }}
          >
            {/* Outer ring is not `.grid-cell-visual` so host `:focus-visible` outlines the inner layer only. */}
            <Box className={hexAuthoringCellVisualClassNames.outer} sx={outer} />
            <GridCellVisual omitLayoutFill className={hexAuthoringCellVisualClassNames.inner} sx={inner}>
              {custom != null && custom !== false ? (
                <Box
                  sx={{
                    boxSizing: 'border-box',
                    width: '100%',
                    maxWidth: '70%',
                    minWidth: 0,
                    height: '100%',
                    minHeight: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {custom}
                </Box>
              ) : label != null && label !== '' ? (
                <Box
                  component="span"
                  sx={{
                    alignSelf: 'center',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    maxWidth: '70%',
                  }}
                >
                  {label}
                </Box>
              ) : null}
            </GridCellVisual>
          </GridCellHost>
        );
      })}
    </Box>
  );
}
