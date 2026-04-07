/** Default display name for newly created authored regions. */
export const LOCATION_MAP_DEFAULT_REGION_NAME = 'Untitled Region';

/**
 * Curated region overlay preset keys (authoring). Values resolve in app theme from primitives.
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

/** Human-readable labels for region preset keys (UI only; persisted values stay as `LocationMapRegionColorKey`). */
export const LOCATION_MAP_REGION_COLOR_DISPLAY_NAMES: Record<LocationMapRegionColorKey, string> = {
  regionRed: 'Red',
  regionBlue: 'Blue',
  regionGreen: 'Green',
  regionPurple: 'Purple',
  regionGold: 'Gold',
  regionTeal: 'Teal',
  regionOrange: 'Orange',
  regionGray: 'Gray',
};

export function getLocationMapRegionColorDisplayName(key: LocationMapRegionColorKey): string {
  return LOCATION_MAP_REGION_COLOR_DISPLAY_NAMES[key];
}
