/**
 * Pure state → `sx` for location map authoring grid **cell chrome** (square + hex).
 * Tokens: {@link gridCellPalette}; policy: {@link mapGridCellVisualState}.
 * Shared colors: {@link resolveAuthoringGridChrome}.
 * Host/visual DOM is composed in `GridEditor` / `HexGridEditor`; this module is presentation only.
 */
import type { SystemStyleObject } from '@mui/system';

import { colorPrimitives } from '@/app/theme/colorPrimitives';
import type { LocationMapSelection } from '@/features/content/locations/components/workspace/rightRail/types';

import { gridCellSelectedShadow } from './gridCellStyles';
import type { AuthoringCellFillPresentation } from './mapGridAuthoringCellFill.types';
import { resolveAuthoringGridChrome } from './mapGridAuthoringChrome.resolve';
import {
  isSelectHoverChromeSuppressed,
  shouldApplyCellHoverChrome,
} from './mapGridCellVisualState';

/** Absolute fill layer (swatch + image) — shell `:hover` targets this class so opacity applies to the whole layer. */
export const GRID_CELL_AUTHORING_FILL_CLASS = 'grid-cell-authoring-fill';

const EXCLUDED_STRIPE =
  'repeating-linear-gradient(-45deg, rgba(0,0,0,0.04), rgba(0,0,0,0.04) 3px, transparent 3px, transparent 6px)';

function buildFillLayerBaseSx(args: {
  chromeLayer: { fillOpacity: number; fillPaintColor: string };
  excluded: boolean;
  imageUrl: string | undefined;
}): SystemStyleObject {
  const { chromeLayer, excluded, imageUrl } = args;
  return {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    bgcolor: chromeLayer.fillPaintColor,
    opacity: chromeLayer.fillOpacity,
    ...(excluded
      ? { backgroundImage: EXCLUDED_STRIPE }
      : imageUrl
        ? {
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }
        : {}),
  };
}

export type SquareAuthoringCellVisualInput = {
  cellId: string;
  selected: boolean;
  excluded: boolean;
  /** Swatch + optional image; `swatchColor` drives chrome + fill layer. */
  fillPresentation: AuthoringCellFillPresentation | undefined;
  disabled: boolean;
  selectHoverTarget: LocationMapSelection | undefined;
};

export type SquareAuthoringCellVisualParts = {
  shell: SystemStyleObject;
  fillLayer: SystemStyleObject;
};

/**
 * Square cell: chrome shell (border, shadow) + absolute fill layer (opacity applies to swatch + image).
 */
export function buildSquareAuthoringCellVisualParts(
  input: SquareAuthoringCellVisualInput,
): SquareAuthoringCellVisualParts {
  const {
    cellId,
    selected,
    excluded,
    fillPresentation,
    disabled,
    selectHoverTarget,
  } = input;

  const selectHoverChromeSuppressed = isSelectHoverChromeSuppressed(
    cellId,
    selectHoverTarget,
    disabled,
  );

  const fillBg = fillPresentation?.swatchColor;
  const imageUrl = fillPresentation?.imageUrl;
  const chrome = resolveAuthoringGridChrome({ selected, excluded, fillBg });

  const fillLayer: SystemStyleObject = buildFillLayerBaseSx({
    chromeLayer: chrome.idle,
    excluded,
    imageUrl,
  });

  const fillHoverTarget = `& .${GRID_CELL_AUTHORING_FILL_CLASS}`;

  const shell: SystemStyleObject = {
    border: 1,
    borderRadius: 0.5,
    borderColor: chrome.idle.border,
    borderStyle: excluded && !selected ? 'dashed' : 'solid',
    bgcolor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
    flex: 1,
    alignSelf: 'stretch',
    minHeight: 0,
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
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
              borderColor: chrome.hoverSuppressed.border,
              boxShadow: selected ? gridCellSelectedShadow() : undefined,
              [fillHoverTarget]: {
                opacity: chrome.hoverSuppressed.fillOpacity,
                bgcolor: chrome.hoverSuppressed.fillPaintColor,
              },
            }
          : {
              borderColor: chrome.hoverEmphasis.border,
              boxShadow: selected ? gridCellSelectedShadow() : undefined,
              [fillHoverTarget]: {
                opacity: chrome.hoverEmphasis.fillOpacity,
                bgcolor: chrome.hoverEmphasis.fillPaintColor,
              },
            },
  };

  return { shell, fillLayer };
}

export type HexAuthoringCellVisualParts = {
  outer: SystemStyleObject;
  /** Inner host: clip + layout only; fill is a child layer. */
  innerShell: SystemStyleObject;
  fillLayer: SystemStyleObject;
  hostHoverSx: SystemStyleObject;
};

export type HexAuthoringCellVisualInput = {
  cellId: string;
  selected: boolean;
  excluded: boolean;
  fillPresentation: AuthoringCellFillPresentation | undefined;
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

const innerFillHoverSelector = `.${HEX_INNER_CLASS} .${GRID_CELL_AUTHORING_FILL_CLASS}`;

/**
 * Hex authoring: outer ring + inner shell + fill layer + host-level `:hover` rules.
 */
export function buildHexAuthoringCellVisualParts(
  input: HexAuthoringCellVisualInput,
): HexAuthoringCellVisualParts {
  const {
    cellId,
    selected,
    excluded,
    fillPresentation,
    disabled,
    selectHoverTarget,
    strokePx,
  } = input;

  const fillBg = fillPresentation?.swatchColor;
  const imageUrl = fillPresentation?.imageUrl;
  const chrome = resolveAuthoringGridChrome({ selected, excluded, fillBg });

  const fillLayer: SystemStyleObject = buildFillLayerBaseSx({
    chromeLayer: chrome.idle,
    excluded,
    imageUrl,
  });

  const allowHover = shouldApplyCellHoverChrome(cellId, selectHoverTarget);
  const selectHoverChromeSuppressed = isSelectHoverChromeSuppressed(
    cellId,
    selectHoverTarget,
    disabled,
  );

  const outer: SystemStyleObject = {
    position: 'absolute',
    inset: 0,
    bgcolor: chrome.idle.border,
    pointerEvents: 'none',
  };

  const innerShell: SystemStyleObject = {
    position: 'absolute',
    inset: strokePx,
    clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    bgcolor: 'transparent',
    fontSize: '0.6rem',
    lineHeight: 1.2,
    color: excluded ? 'rgba(0,0,0,0.45)' : colorPrimitives.black,
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'stretch',
    overflow: 'hidden',
    minHeight: 0,
    boxSizing: 'border-box',
  };

  const hostHoverSx: SystemStyleObject =
    disabled
      ? {}
      : selectHoverTarget?.type === 'none'
        ? {}
        : selectHoverChromeSuppressed
          ? {
              [`&:hover:not(:disabled) .${HEX_OUTER_CLASS}`]: {
                bgcolor: chrome.hoverSuppressed.border,
              },
              [`&:hover:not(:disabled) ${innerFillHoverSelector}`]: {
                opacity: chrome.hoverSuppressed.fillOpacity,
                bgcolor: chrome.hoverSuppressed.fillPaintColor,
              },
            }
          : allowHover
            ? {
                [`&:hover:not(:disabled) .${HEX_OUTER_CLASS}`]: {
                  bgcolor: chrome.hoverEmphasis.border,
                },
                [`&:hover:not(:disabled) ${innerFillHoverSelector}`]: {
                  opacity: chrome.hoverEmphasis.fillOpacity,
                  bgcolor: chrome.hoverEmphasis.fillPaintColor,
                },
              }
            : {};

  return { outer, innerShell, fillLayer, hostHoverSx };
}
