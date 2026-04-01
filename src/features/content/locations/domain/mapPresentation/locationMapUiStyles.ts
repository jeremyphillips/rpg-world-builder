import { alpha, type Theme } from '@mui/material/styles';

import type { LocationEdgeFeatureKindId } from '@/features/content/locations/domain/mapContent/locationEdgeFeature.types';

/**
 * Static map presentation tokens (widths, opacities). Theme colors are resolved via
 * `resolveLocationMapUiStyles`.
 *
 * Layering: `colorPrimitives` → `mapColors` → this file (how features are drawn).
 */
export const locationMapUiStyleTokens = {
  region: {
    /** Semi-transparent region overlay fill (future region painting). */
    overlayOpacity: 0.3,
    /** Region border: full-strength for readability over the overlay. */
    borderOpacity: 1,
    borderWidthPx: 2,
    selectedBorderWidthPx: 3,
    hoverBorderWidthPx: 2,
  },
  path: {
    defaultStrokeWidthPx: 2.5,
    selectedStrokeWidthPx: 4.5,
  },
  edge: {
    committedStrokeWidthPx: 15,
    committedStrokeAlpha: 0.95,
    /** Added to committed edge stroke width when the edge is selected. */
    selectedStrokeWidthBoostPx: 4,
    boundaryPaintStrokeWidthPx: 4,
    boundaryPaintOpacity: 0.7,
    hoverStrokeWidthPx: 3,
    hoverOpacity: 0.6,
    hoverDasharray: '5 3',
    windowDasharray: '4 3',
  },
  cell: {
    placeAnchorOutlinePx: 3,
    pathEndpointOutlinePx: 2,
    placeHoverPreviewOutlinePx: 2,
  },
} as const;

export type LocationMapUiResolvedStyles = {
  tokens: typeof locationMapUiStyleTokens;
  region: (typeof locationMapUiStyleTokens)['region'];
  path: {
    stroke: string;
    defaultStrokeWidthPx: number;
    selectedStrokeWidthPx: number;
  };
  edgeCommittedStrokeByKind: Record<
    LocationEdgeFeatureKindId,
    { stroke: string; strokeWidth: number; strokeDasharray?: string }
  >;
  edgeBoundaryPaint: {
    stroke: string;
    strokeWidthPx: number;
    opacity: number;
  };
  edgeHover: {
    strokeErase: string;
    strokePlace: string;
    strokeWidthPx: number;
    opacity: number;
    dasharray: string;
  };
  cell: {
    placeAnchorOutlinePx: number;
    pathEndpointOutlinePx: number;
    placeHoverPreviewOutlinePx: number;
  };
};

/**
 * Resolves theme-dependent map chrome (strokes, highlights) using `locationMapUiStyleTokens`.
 */
export function resolveLocationMapUiStyles(theme: Theme): LocationMapUiResolvedStyles {
  const t = locationMapUiStyleTokens;
  const edgeAlpha = t.edge.committedStrokeAlpha;

  const edgeCommittedStrokeByKind: LocationMapUiResolvedStyles['edgeCommittedStrokeByKind'] = {
    wall: {
      stroke: alpha(theme.palette.text.primary, edgeAlpha),
      strokeWidth: t.edge.committedStrokeWidthPx,
    },
    window: {
      stroke: alpha(theme.palette.info.main, edgeAlpha),
      strokeWidth: t.edge.committedStrokeWidthPx,
      strokeDasharray: t.edge.windowDasharray,
    },
    door: {
      stroke: alpha(theme.palette.warning.main, edgeAlpha),
      strokeWidth: t.edge.committedStrokeWidthPx,
    },
  };

  return {
    tokens: t,
    region: t.region,
    path: {
      stroke: theme.palette.info.main,
      defaultStrokeWidthPx: t.path.defaultStrokeWidthPx,
      selectedStrokeWidthPx: t.path.selectedStrokeWidthPx,
    },
    edgeCommittedStrokeByKind,
    edgeBoundaryPaint: {
      stroke: theme.palette.primary.main,
      strokeWidthPx: t.edge.boundaryPaintStrokeWidthPx,
      opacity: t.edge.boundaryPaintOpacity,
    },
    edgeHover: {
      strokeErase: theme.palette.error.main,
      strokePlace: theme.palette.primary.light,
      strokeWidthPx: t.edge.hoverStrokeWidthPx,
      opacity: t.edge.hoverOpacity,
      dasharray: t.edge.hoverDasharray,
    },
    cell: {
      placeAnchorOutlinePx: t.cell.placeAnchorOutlinePx,
      pathEndpointOutlinePx: t.cell.pathEndpointOutlinePx,
      placeHoverPreviewOutlinePx: t.cell.placeHoverPreviewOutlinePx,
    },
  };
}
