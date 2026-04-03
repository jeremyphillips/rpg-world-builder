import { alpha, type Theme } from '@mui/material/styles';

import type { LocationEdgeFeatureKindId } from '@/features/content/locations/domain/mapContent/locationEdgeFeature.types';

// ---------------------------------------------------------------------------
// Static tokens (widths, opacities, font knobs)
// Layering: `colorPrimitives` → `mapColors` → this file (how features are drawn).
// No theme resolution here.
// ---------------------------------------------------------------------------

/**
 * Static map presentation tokens. Theme colors are resolved via
 * `resolveLocationMapUiStyles`.
 */
export const locationMapUiStyleTokens = {
  region: {
    /** Semi-transparent region overlay fill (future region painting). */
    overlayOpacity: 0,
    /** Slightly stronger fill when this region is the active map selection. */
    selectedOverlayOpacity: 0.4,
    /** Region border: full-strength for readability over the overlay. */
    borderOpacity: 0.18,
    borderWidthPx: 2,
    selectedBorderWidthPx: 2,
    /** Hex: SVG hull stroke for selected region (not used for per-cell inset on hex). */
    selectedBoundaryStrokeWidthPx: 2,
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

  // --- Placed-object mini-subsystem (tactical cell + authoring overlay glyphs) ---
  /** MUI icon or letter fallback; sizing differs by tactical vs overlay surface. */
  placedObject: {
    /** Multiplier on `palette.action.active` for icon fill. */
    iconAlpha: 1,
    /** Multiplier on `palette.text.secondary` for fallback letter. */
    fallbackTextAlpha: 1,
    iconSizePx: { tactical: 28, overlay: 22 } as const,
    fallbackFontSizeRem: { tactical: 1.35, overlay: 1.1 } as const,
    fallbackFontWeight: 800,
    fallbackLineHeight: 1,
    fallbackTypographyVariant: { tactical: 'h6', overlay: 'body1' } as const,
  },
} as const;

export type LocationMapUiStyleTokens = typeof locationMapUiStyleTokens;

// ---------------------------------------------------------------------------
// Resolved types — output shape of `resolveLocationMapUiStyles`
// ---------------------------------------------------------------------------

/** One surface (tactical grid vs map overlay) for icon + typography fallback. */
export type LocationMapPlacedObjectVariantResolvedStyles = {
  icon: {
    color: string;
    fontSizePx: number;
    widthPx: number;
    heightPx: number;
    display: 'block';
  };
  fallback: {
    color: string;
    fontWeight: number;
    lineHeight: number;
    fontSizeRem: string;
    typographyVariant: 'h6' | 'body1';
    userSelect: 'none';
  };
};

export type LocationMapUiResolvedStyles = {
  tokens: LocationMapUiStyleTokens;
  region: LocationMapUiStyleTokens['region'];
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
  /** Selected region outer boundary (hex maps); theme primary for contrast on dark canvases. */
  regionSelectedOutline: {
    stroke: string;
    strokeWidthPx: number;
  };
  placedObject: {
    tactical: LocationMapPlacedObjectVariantResolvedStyles;
    overlay: LocationMapPlacedObjectVariantResolvedStyles;
  };
};

// ---------------------------------------------------------------------------
// Concern-specific resolvers (internal)
// ---------------------------------------------------------------------------

function resolveRegionStyles(
  _theme: Theme,
  tokens: LocationMapUiStyleTokens,
): LocationMapUiResolvedStyles['region'] {
  return tokens.region;
}

function resolvePathStyles(
  theme: Theme,
  tokens: LocationMapUiStyleTokens,
): LocationMapUiResolvedStyles['path'] {
  return {
    stroke: theme.palette.info.main,
    defaultStrokeWidthPx: tokens.path.defaultStrokeWidthPx,
    selectedStrokeWidthPx: tokens.path.selectedStrokeWidthPx,
  };
}

/**
 * Committed-edge SVG strokes keyed by **base** `LocationEdgeFeatureKindId` only.
 *
 * @remarks Edge facet vocabularies (material, window variant, …) are **not** consulted here yet.
 */
function resolveEdgeCommittedStyles(
  theme: Theme,
  tokens: LocationMapUiStyleTokens,
): LocationMapUiResolvedStyles['edgeCommittedStrokeByKind'] {
  const edgeAlpha = tokens.edge.committedStrokeAlpha;
  const strokeWidth = tokens.edge.committedStrokeWidthPx;
  return {
    wall: {
      stroke: alpha(theme.palette.text.primary, edgeAlpha),
      strokeWidth,
    },
    window: {
      stroke: alpha(theme.palette.info.main, edgeAlpha),
      strokeWidth,
      strokeDasharray: tokens.edge.windowDasharray,
    },
    door: {
      stroke: alpha(theme.palette.text.primary, edgeAlpha),
      strokeWidth,
    },
  };
}

function resolveEdgeBoundaryPaintStyles(
  theme: Theme,
  tokens: LocationMapUiStyleTokens,
): LocationMapUiResolvedStyles['edgeBoundaryPaint'] {
  return {
    stroke: theme.palette.primary.main,
    strokeWidthPx: tokens.edge.boundaryPaintStrokeWidthPx,
    opacity: tokens.edge.boundaryPaintOpacity,
  };
}

function resolveEdgeHoverStyles(
  theme: Theme,
  tokens: LocationMapUiStyleTokens,
): LocationMapUiResolvedStyles['edgeHover'] {
  return {
    strokeErase: theme.palette.error.main,
    strokePlace: theme.palette.primary.light,
    strokeWidthPx: tokens.edge.hoverStrokeWidthPx,
    opacity: tokens.edge.hoverOpacity,
    dasharray: tokens.edge.hoverDasharray,
  };
}

function resolveCellStyles(
  _theme: Theme,
  tokens: LocationMapUiStyleTokens,
): LocationMapUiResolvedStyles['cell'] {
  return {
    placeAnchorOutlinePx: tokens.cell.placeAnchorOutlinePx,
    pathEndpointOutlinePx: tokens.cell.pathEndpointOutlinePx,
    placeHoverPreviewOutlinePx: tokens.cell.placeHoverPreviewOutlinePx,
  };
}

function resolveRegionSelectedOutlineStyles(
  theme: Theme,
  tokens: LocationMapUiStyleTokens,
): LocationMapUiResolvedStyles['regionSelectedOutline'] {
  return {
    stroke: theme.palette.primary.main,
    strokeWidthPx: tokens.region.selectedBoundaryStrokeWidthPx,
  };
}

// --- Placed-object: icon + fallback letter (tactical vs overlay) ---

function resolvePlacedObjectVariantStyles(
  theme: Theme,
  tokens: LocationMapUiStyleTokens,
  variant: 'tactical' | 'overlay',
): LocationMapPlacedObjectVariantResolvedStyles {
  const po = tokens.placedObject;
  const sizePx = po.iconSizePx[variant];
  const iconColor = alpha(theme.palette.action.active, po.iconAlpha);
  const fallbackColor = alpha(theme.palette.text.secondary, po.fallbackTextAlpha);
  const fontRem = po.fallbackFontSizeRem[variant];
  return {
    icon: {
      color: iconColor,
      fontSizePx: sizePx,
      widthPx: sizePx,
      heightPx: sizePx,
      display: 'block',
    },
    fallback: {
      color: fallbackColor,
      fontWeight: po.fallbackFontWeight,
      lineHeight: po.fallbackLineHeight,
      fontSizeRem: `${fontRem}rem`,
      typographyVariant: po.fallbackTypographyVariant[variant],
      userSelect: 'none',
    },
  };
}

function resolvePlacedObjectStyles(
  theme: Theme,
  tokens: LocationMapUiStyleTokens,
): LocationMapUiResolvedStyles['placedObject'] {
  return {
    tactical: resolvePlacedObjectVariantStyles(theme, tokens, 'tactical'),
    overlay: resolvePlacedObjectVariantStyles(theme, tokens, 'overlay'),
  };
}

// ---------------------------------------------------------------------------
// Public resolver
// ---------------------------------------------------------------------------

/**
 * Resolves theme-dependent map chrome (strokes, highlights) using `locationMapUiStyleTokens`.
 */
export function resolveLocationMapUiStyles(theme: Theme): LocationMapUiResolvedStyles {
  const tokens = locationMapUiStyleTokens;

  return {
    tokens,
    region: resolveRegionStyles(theme, tokens),
    path: resolvePathStyles(theme, tokens),
    edgeCommittedStrokeByKind: resolveEdgeCommittedStyles(theme, tokens),
    edgeBoundaryPaint: resolveEdgeBoundaryPaintStyles(theme, tokens),
    edgeHover: resolveEdgeHoverStyles(theme, tokens),
    cell: resolveCellStyles(theme, tokens),
    regionSelectedOutline: resolveRegionSelectedOutlineStyles(theme, tokens),
    placedObject: resolvePlacedObjectStyles(theme, tokens),
  };
}
