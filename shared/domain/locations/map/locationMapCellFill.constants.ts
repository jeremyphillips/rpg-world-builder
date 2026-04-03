/**
 * Canonical cell-fill vocabulary for authored map terrain / surface paint.
 * Ids and `LOCATION_MAP_CELL_FILL_KIND_IDS` are derived from {@link LOCATION_CELL_FILL_KIND_META} keys only.
 *
 * @remarks **TODO (facets vs behavior):** `category`, `family`, `biome`, `density`, and `material` are
 * for structure and future UX; **color** still comes from `swatchColorKey` only. Do not derive
 * swatches from facets in this layer until explicitly designed.
 */

import type {
  LocationCellFillBiome,
  LocationCellFillCategory,
  LocationCellFillDensity,
  LocationCellFillFamily,
  LocationCellFillMaterial,
} from './locationMapCellFill.facets';
import { recordKeys } from './locationMapRecordUtils';

/**
 * Labels, swatch keys, and optional **facets** for each concrete fill id.
 *
 * Concrete ids (e.g. `forest_light`, `stone_floor`) remain the storable/selectable units.
 * Facets describe structure for growth (e.g. future `wood_floor` as `surface` / `floor` / `wood`)
 * without a compositional persistence model.
 */
export const LOCATION_CELL_FILL_KIND_META = {
  mountains: {
    label: 'Mountains',
    description: 'High, rugged terrain.',
    swatchColorKey: 'cellFillMountains',
    category: 'terrain',
    family: 'mountains',
  },
  plains: {
    label: 'Plains',
    description: 'Open grassland or steppe.',
    swatchColorKey: 'cellFillPlains',
    category: 'terrain',
    family: 'plains',
    biome: 'temperate',
  },
  forest_light: {
    label: 'Light forest',
    description: 'Sparse or young woodland.',
    swatchColorKey: 'cellFillForestLight',
    category: 'terrain',
    family: 'forest',
    biome: 'temperate',
    density: 'open',
  },
  forest_heavy: {
    label: 'Dense forest',
    description: 'Thick canopy or old growth.',
    swatchColorKey: 'cellFillForestHeavy',
    category: 'terrain',
    family: 'forest',
    biome: 'temperate',
    density: 'dense',
  },
  swamp: {
    label: 'Swamp',
    description: 'Wetland, marsh, or bayou.',
    swatchColorKey: 'cellFillSwamp',
    category: 'terrain',
    family: 'swamp',
  },
  desert: {
    label: 'Desert',
    description: 'Arid sand or scrub.',
    swatchColorKey: 'cellFillDesert',
    category: 'terrain',
    family: 'desert',
    biome: 'arid',
  },
  water: {
    label: 'Water',
    description: 'Sea, lake, or major water body.',
    swatchColorKey: 'cellFillWater',
    category: 'terrain',
    family: 'water',
  },
  stone_floor: {
    label: 'Stone floor',
    description: 'Interior stone or tile flooring.',
    swatchColorKey: 'cellFillStoneFloor',
    category: 'surface',
    family: 'floor',
    material: 'stone',
  },
} as const satisfies Record<
  string,
  {
    label: string;
    description?: string;
    swatchColorKey: string;
    category: LocationCellFillCategory;
    family: LocationCellFillFamily;
    biome?: LocationCellFillBiome;
    density?: LocationCellFillDensity;
    material?: LocationCellFillMaterial;
  }
>;

export type LocationMapCellFillKindId = keyof typeof LOCATION_CELL_FILL_KIND_META;

/**
 * Runtime shape for a fill kind, including optional hex override.
 * Facet fields match {@link LOCATION_CELL_FILL_KIND_META}; `swatchColor` remains an escape hatch.
 */
export type LocationCellFillKindMeta = (typeof LOCATION_CELL_FILL_KIND_META)[LocationMapCellFillKindId] & {
  /**
   * Optional direct hex override at resolve time.
   * @remarks **TODO:** same as today — not facet-driven.
   */
  swatchColor?: string;
};

/** Runtime list of fill kind ids — derived from {@link LOCATION_CELL_FILL_KIND_META} keys. */
export const LOCATION_MAP_CELL_FILL_KIND_IDS = recordKeys(
  LOCATION_CELL_FILL_KIND_META,
) as readonly LocationMapCellFillKindId[];
