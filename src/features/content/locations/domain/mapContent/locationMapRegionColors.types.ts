/**
 * Keys for curated region overlay preset colors. Values resolve in `src/app/theme/mapColors.ts`
 * from `colorPrimitives` — separate from terrain `LocationMapSwatchColorKey`.
 */

export const LOCATION_MAP_REGION_COLOR_KEYS = [
  'regionRed',
  'regionBlue',
  'regionGreen',
  'regionPurple',
  'regionGold',
  'regionTeal',
  'regionOrange',
  'regionGray',
] as const;

export type LocationMapRegionColorKey = (typeof LOCATION_MAP_REGION_COLOR_KEYS)[number];
