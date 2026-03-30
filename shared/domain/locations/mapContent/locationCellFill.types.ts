/**
 * Cell fill kinds: whole-cell surfaces / terrain / flooring for authored map content.
 *
 * These represent paint-style coverage of an entire grid cell, not strokes along paths,
 * not boundary decorations, and not anchored props.
 *
 * Future tool intent: **paint** tools will combine cell fills with path features (see
 * `locationPathFeature.types.ts`).
 *
 * Presentation: `iconName` resolves in the UI via `getLocationMapIconByName`;
 * `swatchColorKey` resolves via `getMapSwatchColor` / `mapSwatchColors` in `src/app/theme/mapColors.ts`.
 */

import type { LocationMapIconName } from './locationMapIconNames';
import type { LocationMapSwatchColorKey } from './locationMapSwatchColors.types';

export const LOCATION_CELL_FILL_KIND_IDS = [
  'mountains',
  'plains',
  'forest_light',
  'forest_heavy',
  'swamp',
  'desert',
  'water',
  'stone_floor',
] as const;

export type LocationCellFillKindId = (typeof LOCATION_CELL_FILL_KIND_IDS)[number];

export type LocationCellFillKindMeta = {
  label: string;
  description?: string;
  /**
   * Theme key for swatch color; resolve with `getMapSwatchColor` (app theme).
   * Prefer this over inline hex so colors stay centralized.
   */
  swatchColorKey: LocationMapSwatchColorKey;
  /** Semantic token; UI maps to MUI icons via `getLocationMapIconByName`. */
  iconName: LocationMapIconName;
  /**
   * Optional direct hex override (e.g. one-off previews). Prefer `swatchColorKey` for normal use.
   */
  swatchColor?: string;
};

export const LOCATION_CELL_FILL_KIND_META = {
  mountains: {
    label: 'Mountains',
    description: 'High, rugged terrain.',
    swatchColorKey: 'cellFillMountains',
    iconName: 'mountain',
  },
  plains: {
    label: 'Plains',
    description: 'Open grassland or steppe.',
    swatchColorKey: 'cellFillPlains',
    iconName: 'plains',
  },
  forest_light: {
    label: 'Light forest',
    description: 'Sparse or young woodland.',
    swatchColorKey: 'cellFillForestLight',
    iconName: 'forest_light',
  },
  forest_heavy: {
    label: 'Dense forest',
    description: 'Thick canopy or old growth.',
    swatchColorKey: 'cellFillForestHeavy',
    iconName: 'forest_heavy',
  },
  swamp: {
    label: 'Swamp',
    description: 'Wetland, marsh, or bayou.',
    swatchColorKey: 'cellFillSwamp',
    iconName: 'swamp',
  },
  desert: {
    label: 'Desert',
    description: 'Arid sand or scrub.',
    swatchColorKey: 'cellFillDesert',
    iconName: 'desert',
  },
  water: {
    label: 'Water',
    description: 'Sea, lake, or major water body.',
    swatchColorKey: 'cellFillWater',
    iconName: 'water',
  },
  stone_floor: {
    label: 'Stone floor',
    description: 'Interior stone or tile flooring.',
    swatchColorKey: 'cellFillStoneFloor',
    iconName: 'stone_floor',
  },
} as const satisfies Record<LocationCellFillKindId, LocationCellFillKindMeta>;
