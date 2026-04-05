import type {
  LocationCellFillKindMeta,
  LocationMapRegionColorKey,
  LocationMapSwatchColorKey,
} from '@/features/content/locations/domain/model/map';

import { colorPrimitives } from './colorPrimitives';

/**
 * Location map swatch colors — keyed for cell fills; hex values resolve from
 * `colorPrimitives` (single source of truth). Split light/dark when needed.
 */
export const baseMapSwatchColors: Record<LocationMapSwatchColorKey, string> = {
  cellFillMountains: colorPrimitives.mapSlate[300],
  cellFillPlains: colorPrimitives.mapGreen[100],
  cellFillForestLight: colorPrimitives.mapGreen[200],
  cellFillForestHeavy: colorPrimitives.mapGreen[500],
  cellFillSwamp: colorPrimitives.mapGreen[300],
  cellFillDesert: colorPrimitives.mapSand[300],
  cellFillWater: colorPrimitives.mapBlue[300],
  cellFillStoneFloor: colorPrimitives.mapSlate[100],
};

export const lightMapSwatchColors = baseMapSwatchColors;
export const darkMapSwatchColors = baseMapSwatchColors;

/** Default export for callers that do not branch on color scheme yet. */
export const mapSwatchColors = baseMapSwatchColors;

export function getMapSwatchColor(key: LocationMapSwatchColorKey): string {
  return mapSwatchColors[key];
}

/**
 * Resolved swatch hex for cell-fill metadata (optional `swatchColor` overrides theme key).
 *
 * @remarks Fill **facets** (`category`, `family`, `biome`, …) are ignored here on purpose — color
 * remains driven by `swatchColorKey` until a deliberate design maps facets → palette.
 */
export function resolveCellFillSwatchColor(meta: LocationCellFillKindMeta): string {
  return meta.swatchColor ?? getMapSwatchColor(meta.swatchColorKey);
}

// --- Region overlay preset colors (distinct from terrain swatches) ---

/**
 * Curated region overlay preset colors — keyed for named regions; not terrain fills.
 * Tune opacity/borders in a future map UI style layer; here we store solid presets only.
 */
export const baseMapRegionColors: Record<LocationMapRegionColorKey, string> = {
  regionRed: colorPrimitives.red[300],
  regionBlue: colorPrimitives.blue[300],
  regionGreen: colorPrimitives.green[300],
  regionPurple: colorPrimitives.purple[300],
  regionGold: colorPrimitives.gold[300],
  regionTeal: colorPrimitives.teal[300],
  regionOrange: colorPrimitives.orange[300],
  regionGray: colorPrimitives.gray[200],
};

export const lightMapRegionColors = baseMapRegionColors;
export const darkMapRegionColors = baseMapRegionColors;

export const mapRegionColors = baseMapRegionColors;

export function getMapRegionColor(key: LocationMapRegionColorKey): string {
  return mapRegionColors[key];
}

/** Preset region color, with optional stored hex override (e.g. future per-region customization). */
export function resolveMapRegionColor(
  presetKey: LocationMapRegionColorKey,
  colorOverride?: string | null,
): string {
  return colorOverride ?? getMapRegionColor(presetKey);
}
