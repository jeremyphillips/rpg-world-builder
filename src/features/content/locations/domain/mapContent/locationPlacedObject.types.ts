/**
 * Placed object kinds: anchored / footprint objects on a map (settlements, structures, props).
 *
 * This vocabulary is for **authored map content** (what the author places on the grid).
 * It is separate from:
 * - `LOCATION_MAP_OBJECT_KIND_IDS` in shared `map/locationMap.constants.ts` (persisted cell-object
 *   kinds like marker / obstacle), and
 * - `LOCATION_SCALE_FIELD_POLICY` (form field / setup policy).
 *
 * Future tool intent: **place** tool; not paint or edge tools.
 */

import type { LocationMapIconName } from './locationMapIconNames';
import type { LocationScaleId } from '@/shared/domain/locations';

export const LOCATION_PLACED_OBJECT_KIND_IDS = [
  'city',
  'building',
  'site',
  'tree',
  'table',
  'stairs',
  'treasure',
] as const;

export type LocationPlacedObjectKindId = (typeof LOCATION_PLACED_OBJECT_KIND_IDS)[number];

export type LocationPlacedObjectKindMeta = {
  label: string;
  description?: string;
  iconName?: LocationMapIconName;
  /** If set, link modal targets this child location scale (data-driven; resolver is authoritative). */
  linkedScale?: LocationScaleId;
};

export const LOCATION_PLACED_OBJECT_KIND_META = {
  city: {
    label: 'City',
    description: 'Settlement or major urban marker.',
    iconName: 'map_city',
    linkedScale: 'city',
  },
  building: {
    label: 'Building',
    description: 'Structure footprint or icon.',
    iconName: 'map_building',
    linkedScale: 'building',
  },
  site: {
    label: 'Site',
    description: 'Point of interest or minor location.',
    iconName: 'map_site',
    linkedScale: 'site',
  },
  tree: {
    label: 'Tree',
    description: 'Vegetation or landmark tree.',
    iconName: 'forest_heavy',
  },
  table: {
    label: 'Table',
    description: 'Furniture or surface.',
    iconName: 'map_room',
  },
  stairs: {
    label: 'Stairs',
    description: 'Vertical circulation between levels.',
    iconName: 'stairs',
  },
  treasure: {
    label: 'Treasure',
    description: 'Loot, hoard, or objective.',
    iconName: 'treasure',
  },
} as const satisfies Record<LocationPlacedObjectKindId, LocationPlacedObjectKindMeta>;
