/**
 * Keys for map swatch colors. Values live in `src/app/theme/mapColors.ts` so hex stays
 * centralized; metadata references these keys only.
 */

export const LOCATION_MAP_SWATCH_COLOR_KEYS = [
  'cellFillMountains',
  'cellFillPlains',
  'cellFillForestLight',
  'cellFillForestHeavy',
  'cellFillSwamp',
  'cellFillDesert',
  'cellFillWater',
  'cellFillStoneFloor',
] as const;

export type LocationMapSwatchColorKey = (typeof LOCATION_MAP_SWATCH_COLOR_KEYS)[number];
