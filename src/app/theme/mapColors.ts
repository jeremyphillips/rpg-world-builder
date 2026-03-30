import type { LocationCellFillKindMeta, LocationMapSwatchColorKey } from '@/shared/domain/locations';

/**
 * Centralized hex values for location map swatches (cell fills, future palettes).
 * Light and dark use the same tokens for now; split `lightMapSwatchColors` /
 * `darkMapSwatchColors` when theme-specific tuning is needed.
 */
export const baseMapSwatchColors: Record<LocationMapSwatchColorKey, string> = {
  cellFillMountains: '#6B7280',
  cellFillPlains: '#86A35C',
  cellFillForestLight: '#5A9A5E',
  cellFillForestHeavy: '#2D4A32',
  cellFillSwamp: '#5C6B55',
  cellFillDesert: '#D4A574',
  cellFillWater: '#3B82C4',
  cellFillStoneFloor: '#9CA3AF',
};

export const lightMapSwatchColors = baseMapSwatchColors;
export const darkMapSwatchColors = baseMapSwatchColors;

/** Default export for callers that do not branch on color scheme yet. */
export const mapSwatchColors = baseMapSwatchColors;

export function getMapSwatchColor(key: LocationMapSwatchColorKey): string {
  return mapSwatchColors[key];
}

/** Resolved swatch hex for cell-fill metadata (optional `swatchColor` overrides theme key). */
export function resolveCellFillSwatchColor(meta: LocationCellFillKindMeta): string {
  return meta.swatchColor ?? getMapSwatchColor(meta.swatchColorKey);
}
