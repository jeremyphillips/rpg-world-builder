/**
 * Allowed values for `LocationMapCellAuthoringEntry.cellFillKind` (sparse terrain / surface fill).
 * Kept in shared for API validation; mirrors authoring vocabulary in the locations feature.
 */
export const LOCATION_MAP_CELL_FILL_KIND_IDS = [
  'mountains',
  'plains',
  'forest_light',
  'forest_heavy',
  'swamp',
  'desert',
  'water',
  'stone_floor',
] as const;

export type LocationMapCellFillKindId = (typeof LOCATION_MAP_CELL_FILL_KIND_IDS)[number];
