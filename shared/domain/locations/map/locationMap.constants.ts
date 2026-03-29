export const LOCATION_MAP_GRID_MAX_WIDTH = 200;
export const LOCATION_MAP_GRID_MAX_HEIGHT = 200;

export const LOCATION_MAP_KIND_IDS = ['world-grid', 'area-grid', 'encounter-grid'] as const;

/**
 * Simple authored contents for a map cell (markers, props, openings).
 * Placement *which* kinds are allowed on a host map is `locationMapPlacement.policy.ts`.
 */
export const LOCATION_MAP_OBJECT_KIND_IDS = [
  'marker',
  'obstacle',
  'treasure',
  'door',
  'stairs',
] as const;

/** Alias for older imports; same tuple as `LOCATION_MAP_KIND_IDS`. */
export const LOCATION_MAP_KINDS = LOCATION_MAP_KIND_IDS;

export const LOCATION_CELL_UNIT_IDS = [
  'mile',
  'half-mile',
  'quarter-mile',
  'block',
  '100ft',
  '25ft',
  '5ft',
] as const;

type _MapKind = (typeof LOCATION_MAP_KIND_IDS)[number];
type _CellUnit = (typeof LOCATION_CELL_UNIT_IDS)[number];

/** Cell units allowed per map kind (authoring). Must be a superset of what each scale in that kind allows. */
export const CELL_UNITS_BY_KIND: Record<_MapKind, readonly _CellUnit[]> = {
  'world-grid': ['mile'],
  'area-grid': ['mile', 'half-mile', 'quarter-mile', 'block', '100ft', '25ft', '5ft'],
  'encounter-grid': ['25ft', '5ft'],
};
