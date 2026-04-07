/**
 * Pure state → `sx` for location map authoring grid **cell chrome** (square + hex).
 * Tokens: {@link gridCellPalette}; policy: {@link mapGridCellVisualState}.
 * Host/visual DOM is composed in `GridEditor` / `HexGridEditor`; this module is presentation only.
 */
import type { SystemStyleObject } from '@mui/system';
import { alpha } from '@mui/material/styles';

import { colorPrimitives } from '@/app/theme/colorPrimitives';
import type { LocationMapSelection } from '@/features/content/locations/components/workspace/rightRail/types';

import {
  GRID_CELL_BORDER_COLOR,
  GRID_CELL_BORDER_COLOR_HOVER,
  gridCellPalette,
  gridCellSelectedShadow,
} from './gridCellStyles';
import {
  isSelectHoverChromeSuppressed,
  shouldApplyCellHoverChrome,
} from './mapGridCellVisualState';

export type SquareAuthoringCellVisualInput = {
  cellId: string;
  selected: boolean;
  excluded: boolean;
  /** Terrain / authored fill under policy (selection + excluded still win in base colors). */
  fillBg: string | undefined;
  disabled: boolean;
  selectHoverTarget: LocationMapSelection | undefined;
};

/**
 * Visible chrome for a **square** authoring cell (border, fill, hover, selected inset shadow).
 * Content centering is {@link GridCellVisual} `centerChildren` (default on); interactive shell stays on {@link GridCellHost}.
 */
export function buildSquareAuthoringCellVisualSx(
  input: SquareAuthoringCellVisualInput,
): SystemStyleObject {
  const {
    cellId,
    selected,
    excluded,
    fillBg,
    disabled,
    selectHoverTarget,
  } = input;

  const selectHoverChromeSuppressed = isSelectHoverChromeSuppressed(
    cellId,
    selectHoverTarget,
    disabled,
  );

  const fillBgColor = fillBg ?? gridCellPalette.background.default;
  
  const baseBorderColor = selected
    ? gridCellPalette.border.selected
    : excluded
      ? gridCellPalette.border.excluded
      : GRID_CELL_BORDER_COLOR;

  const baseBg = selected
    ? alpha(fillBgColor, gridCellPalette.background.selectedOpacity)
    : excluded
      ? gridCellPalette.background.excluded
      : fillBgColor ?? gridCellPalette.background.default;

  return {
    border: 1,
    borderRadius: 0.5,
    borderColor: baseBorderColor,
    borderStyle: excluded && !selected ? 'dashed' : 'solid',
    bgcolor: baseBg,
    backgroundImage: excluded
      ? 'repeating-linear-gradient(-45deg, rgba(0,0,0,0.04), rgba(0,0,0,0.04) 3px, transparent 3px, transparent 6px)'
      : undefined,
    p: 0.25,
    fontSize: '0.65rem',
    lineHeight: 1.2,
    color: excluded ? 'rgba(0,0,0,0.45)' : colorPrimitives.black,
    boxShadow: selected ? gridCellSelectedShadow() : undefined,
    '&:hover': disabled
      ? undefined
      : selectHoverTarget?.type === 'none'
        ? undefined
        : selectHoverChromeSuppressed
          ? {
              borderColor: baseBorderColor,
              bgcolor: baseBg,
              boxShadow: selected ? gridCellSelectedShadow() : undefined,
            }
          : {
              borderColor: selected
                ? gridCellPalette.border.selected
                : GRID_CELL_BORDER_COLOR_HOVER,
              bgcolor: selected
                ? gridCellPalette.background.selected
                : excluded
                  ? gridCellPalette.background.excluded
                  : fillBgColor ?? gridCellPalette.background.hover,
            },
  };
}

export type HexAuthoringCellVisualParts = {
  /** Outer hex ring (clipped); merged into {@link GridCellVisual} for the ring layer. */
  outer: SystemStyleObject;
  /** Inner fill + content area; merged into the inner visual layer. */
  inner: SystemStyleObject;
  /**
   * Hover uses the interactive host as the hover target (see `HexGridEditor` structure).
   * Merge onto {@link GridCellHost} so ring + fill update together.
   */
  hostHoverSx: SystemStyleObject;
};

export type HexAuthoringCellVisualInput = {
  cellId: string;
  selected: boolean;
  excluded: boolean;
  fillBg: string | undefined;
  disabled: boolean;
  selectHoverTarget: LocationMapSelection | undefined;
  strokePx: string;
};

const HEX_OUTER_CLASS = 'grid-cell-visual-hex-outer';
const HEX_INNER_CLASS = 'grid-cell-visual-hex-inner';

/** Class names for hex layers (host hover sx targets these). */
export const hexAuthoringCellVisualClassNames = {
  outer: HEX_OUTER_CLASS,
  inner: HEX_INNER_CLASS,
} as const;

/**
 * Hex authoring chrome split into outer ring + inner fill, plus host-level `:hover` rules.
 */
export function buildHexAuthoringCellVisualParts(
  input: HexAuthoringCellVisualInput,
): HexAuthoringCellVisualParts {
  const {
    cellId,
    selected,
    excluded,
    fillBg,
    disabled,
    selectHoverTarget,
    strokePx,
  } = input;

  const fillBgColor = fillBg ?? gridCellPalette.background.default;

  const outerRingColor = selected
    ? gridCellPalette.border.selected
    : excluded
      ? gridCellPalette.border.excluded
      : gridCellPalette.border.default;

  const innerFillColor = selected
    ? alpha(fillBgColor, gridCellPalette.background.selectedOpacity)
    : excluded
      ? gridCellPalette.background.excluded
      : fillBgColor

  const allowHover = shouldApplyCellHoverChrome(cellId, selectHoverTarget);
  const selectHoverChromeSuppressed = isSelectHoverChromeSuppressed(
    cellId,
    selectHoverTarget,
    disabled,
  );

  const outer: SystemStyleObject = {
    position: 'absolute',
    inset: 0,
    bgcolor: outerRingColor,
    pointerEvents: 'none',
  };

  const inner: SystemStyleObject = {
    position: 'absolute',
    inset: strokePx,
    clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    bgcolor: innerFillColor,
    fontSize: '0.6rem',
    lineHeight: 1.2,
    color: excluded ? 'rgba(0,0,0,0.45)' : colorPrimitives.black,
    backgroundImage: excluded
      ? 'repeating-linear-gradient(-45deg, rgba(0,0,0,0.04), rgba(0,0,0,0.04) 3px, transparent 3px, transparent 6px)'
      : undefined,
    pointerEvents: 'auto',
  };

  const hostHoverSx: SystemStyleObject =
    disabled
      ? {}
      : selectHoverTarget?.type === 'none'
        ? {}
        : selectHoverChromeSuppressed
          ? {
              [`&:hover:not(:disabled) .${HEX_OUTER_CLASS}`]: { bgcolor: outerRingColor },
              [`&:hover:not(:disabled) .${HEX_INNER_CLASS}`]: { bgcolor: innerFillColor },
            }
          : allowHover
            ? {
                [`&:hover:not(:disabled) .${HEX_OUTER_CLASS}`]: {
                  bgcolor: selected
                    ? gridCellPalette.border.selected
                    : gridCellPalette.border.hover,
                },
                [`&:hover:not(:disabled) .${HEX_INNER_CLASS}`]: {
                  bgcolor: selected
                    ? gridCellPalette.background.selected
                    : excluded
                      ? gridCellPalette.background.excluded
                      : fillBg ?? gridCellPalette.background.hover,
                },
              }
            : {};

  return { outer, inner, hostHoverSx };
}
