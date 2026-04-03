/**
 * Semantic icon tokens for location map presentation. UI maps these to MUI `SvgIcon`
 * components — this module does not reference React or MUI.
 */

export const LOCATION_MAP_ICON_NAME_IDS = [
  // Cell fill kinds (terrain / surface)
  'mountain',
  'plains',
  'forest_light',
  'forest_heavy',
  'swamp',
  'desert',
  'water',
  'stone_floor',
  // Map scale affordances (linked location / marker by scale)
  'map_world',
  'map_region',
  'map_subregion',
  'map_city',
  'map_district',
  'map_site',
  'map_building',
  'map_floor',
  'map_room',
  // Persisted cell object kinds
  'marker',
  'table',
  'treasure',
  'door',
  'stairs',
] as const;

export type LocationMapIconName = (typeof LOCATION_MAP_ICON_NAME_IDS)[number];
