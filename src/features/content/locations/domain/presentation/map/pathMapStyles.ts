/**
 * Path (road / river) stroke tokens for location map SVG overlays.
 * Fixed colors from `colorPrimitives` so paths do not follow MUI light/dark mode (same layering idea as
 * `components/mapGrid/gridCellStyles.ts`).
 */
import { colorPrimitives } from '@/app/theme/colorPrimitives';
import type { LocationPathFeatureKindId } from '@/features/content/locations/domain/model/map/locationPathFeature.types';
import type { LocationScaleId } from '@/shared/domain/locations';
import { isValidLocationScaleId } from '@/shared/domain/locations/scale/locationScale.rules';

/** When host scale is unknown or has no entry, use these widths (matches former global path stroke). */
export const PATH_WIDTH_FALLBACK_PX = { default: 2.5, selected: 4.5 } as const;

export const pathMapPalette = {
  stroke: {
    road: colorPrimitives.mapEarth[500],
    river: colorPrimitives.mapBlue[400],
  },
  /** Wider strokes on world overland maps; slightly finer on city street grids. */
  widthPxByHostScale: {
    world: { default: 8, selected: 10 },
    city: { default: 18, selected: 20 },
  },
} as const satisfies {
  stroke: Record<LocationPathFeatureKindId, string>;
  widthPxByHostScale: Partial<Record<LocationScaleId, { default: number; selected: number }>>;
};

export function pathStrokeForKind(kind: string): string {
  if (kind === 'road' || kind === 'river') {
    return pathMapPalette.stroke[kind];
  }
  return pathMapPalette.stroke.road;
}

export function pathWidthsForHostScale(scale: string): { default: number; selected: number } {
  if (!isValidLocationScaleId(scale)) return PATH_WIDTH_FALLBACK_PX;
  const byScale = pathMapPalette.widthPxByHostScale as Partial<
    Record<LocationScaleId, { default: number; selected: number }>
  >;
  return byScale[scale] ?? PATH_WIDTH_FALLBACK_PX;
}
