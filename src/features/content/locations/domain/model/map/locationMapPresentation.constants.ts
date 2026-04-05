import type { LocationMapObjectKindId, LocationScaleId } from '@/shared/domain/locations';

import type { LocationMapObjectIconName, LocationMapScaleIconName } from './locationMapIconNames';

/**
 * Scale affordance icon id per location scale (markers / linked-location UI).
 * UI resolves via `getLocationMapScaleIconByName` / `getLocationMapGlyphIconByName`
 * (`domain/presentation/map/locationMapIconNameMap.tsx`).
 */
export const LOCATION_SCALE_MAP_ICON_NAME: Record<LocationScaleId, LocationMapScaleIconName> = {
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
 * Icon id per persisted cell object kind (`LOCATION_MAP_OBJECT_KIND_IDS`).
 * Prefer {@link getMapObjectKindIconName} from `locationPlacedObject.selectors` for lookups.
 */
export const LOCATION_MAP_OBJECT_KIND_TO_ICON_NAME: Record<
  LocationMapObjectKindId,
  LocationMapObjectIconName
> = {
  marker: 'marker',
  table: 'table',
  treasure: 'treasure',
  door: 'door',
  stairs: 'stairs',
};
