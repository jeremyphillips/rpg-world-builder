import type { LocationMapObjectKindId } from '../map/locationMap.types';
import type { LocationScaleId } from '../location.types';
import type { LocationMapIconName } from './locationMapIconNames';

/**
 * Icon name per location scale for map markers / linked-location affordances.
 * UI resolves via `getLocationMapIconByName` (see `locationMapIconNameMap.tsx`).
 */
export const LOCATION_SCALE_MAP_ICON_NAME: Record<LocationScaleId, LocationMapIconName> = {
  world: 'map_world',
  region: 'map_region',
  subregion: 'map_subregion',
  city: 'map_city',
  district: 'map_district',
  site: 'map_site',
  building: 'map_building',
  floor: 'map_floor',
  room: 'map_room',
};

/**
 * Icon name per persisted cell object kind (`LOCATION_MAP_OBJECT_KIND_IDS`).
 */
export const LOCATION_MAP_OBJECT_KIND_ICON_NAME: Record<
  LocationMapObjectKindId,
  LocationMapIconName
> = {
  marker: 'marker',
  obstacle: 'obstacle',
  treasure: 'treasure',
  door: 'door',
  stairs: 'stairs',
};
