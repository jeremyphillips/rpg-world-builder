/**
 * Canonical cell-fill vocabulary for authored map terrain / surface paint.
 * Ids and `LOCATION_MAP_CELL_FILL_KIND_IDS` are derived from {@link LOCATION_CELL_FILL_KIND_META} keys only.
 */

import { recordKeys } from './locationMapRecordUtils';

/**
 * Labels and swatch keys for each fill kind. This object is the single source of truth for fill-kind ids.
 */
export const LOCATION_CELL_FILL_KIND_META = {
  mountains: {
    label: 'Mountains',
    description: 'High, rugged terrain.',
    swatchColorKey: 'cellFillMountains',
  },
  plains: {
    label: 'Plains',
    description: 'Open grassland or steppe.',
    swatchColorKey: 'cellFillPlains',
  },
  forest_light: {
    label: 'Light forest',
    description: 'Sparse or young woodland.',
    swatchColorKey: 'cellFillForestLight',
  },
  forest_heavy: {
    label: 'Dense forest',
    description: 'Thick canopy or old growth.',
    swatchColorKey: 'cellFillForestHeavy',
  },
  swamp: {
    label: 'Swamp',
    description: 'Wetland, marsh, or bayou.',
    swatchColorKey: 'cellFillSwamp',
  },
  desert: {
    label: 'Desert',
    description: 'Arid sand or scrub.',
    swatchColorKey: 'cellFillDesert',
  },
  water: {
    label: 'Water',
    description: 'Sea, lake, or major water body.',
    swatchColorKey: 'cellFillWater',
  },
  stone_floor: {
    label: 'Stone floor',
    description: 'Interior stone or tile flooring.',
    swatchColorKey: 'cellFillStoneFloor',
  },
} as const;

export type LocationMapCellFillKindId = keyof typeof LOCATION_CELL_FILL_KIND_META;

/** Optional `swatchColor` allows hex overrides at resolve time (see `resolveCellFillSwatchColor`). */
export type LocationCellFillKindMeta = (typeof LOCATION_CELL_FILL_KIND_META)[LocationMapCellFillKindId] & {
  swatchColor?: string;
};

/** Runtime list of fill kind ids — derived from {@link LOCATION_CELL_FILL_KIND_META} keys. */
export const LOCATION_MAP_CELL_FILL_KIND_IDS = recordKeys(
  LOCATION_CELL_FILL_KIND_META,
) as readonly LocationMapCellFillKindId[];
