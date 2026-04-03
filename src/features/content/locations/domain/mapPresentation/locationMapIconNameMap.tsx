/**
 * Canonical **icon component** maps for map glyphs. Object and scale icon **name ids** and their
 * TypeScript unions are derived from the keys of these records (see `locationMapIconNames.ts` re-exports).
 */
import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ApartmentIcon from '@mui/icons-material/Apartment';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import ForestIcon from '@mui/icons-material/Forest';
import HomeIcon from '@mui/icons-material/Home';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LayersIcon from '@mui/icons-material/Layers';
import MapIcon from '@mui/icons-material/Map';
import MapsHomeWorkIcon from '@mui/icons-material/MapsHomeWork';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PublicIcon from '@mui/icons-material/Public';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import StairsIcon from '@mui/icons-material/Stairs';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import TerrainIcon from '@mui/icons-material/Terrain';

import { recordKeys } from '@/shared/domain/locations/map/locationMapRecordUtils';

export type LocationMapDisplayIconComponent = ComponentType<SvgIconProps>;

const FALLBACK_ICON = RadioButtonUncheckedIcon;

/** MUI component per **scale** affordance icon id — keys are the scale icon-name vocabulary. */
export const LOCATION_MAP_SCALE_ICON_COMPONENT_BY_NAME = {
  map_world: PublicIcon,
  map_region: MapIcon,
  map_subregion: LayersIcon,
  map_city: MapsHomeWorkIcon,
  map_district: TerrainIcon,
  map_site: AccountBalanceIcon,
  map_building: HomeIcon,
  map_floor: ApartmentIcon,
  map_room: MeetingRoomIcon,
} as const satisfies Record<string, LocationMapDisplayIconComponent>;

export type LocationMapScaleIconName = keyof typeof LOCATION_MAP_SCALE_ICON_COMPONENT_BY_NAME;

/** Runtime list derived from {@link LOCATION_MAP_SCALE_ICON_COMPONENT_BY_NAME} keys. */
export const LOCATION_MAP_SCALE_ICON_NAME_IDS = recordKeys(
  LOCATION_MAP_SCALE_ICON_COMPONENT_BY_NAME,
) as readonly LocationMapScaleIconName[];

/** MUI component per **object** icon id — keys are the object icon-name vocabulary. */
export const LOCATION_MAP_OBJECT_ICON_COMPONENT_BY_NAME = {
  marker: RadioButtonUncheckedIcon,
  table: TableRestaurantIcon,
  treasure: Inventory2Icon,
  door: DoorFrontIcon,
  stairs: StairsIcon,
  tree: ForestIcon,
} as const satisfies Record<string, LocationMapDisplayIconComponent>;

export type LocationMapObjectIconName = keyof typeof LOCATION_MAP_OBJECT_ICON_COMPONENT_BY_NAME;

/** Runtime list derived from {@link LOCATION_MAP_OBJECT_ICON_COMPONENT_BY_NAME} keys. */
export const LOCATION_MAP_OBJECT_ICON_NAME_IDS = recordKeys(
  LOCATION_MAP_OBJECT_ICON_COMPONENT_BY_NAME,
) as readonly LocationMapObjectIconName[];

/** Any glyph token the map UI resolves to a MUI icon (object + scale). */
export type LocationMapGlyphIconName = LocationMapObjectIconName | LocationMapScaleIconName;

/** Combined lookup table (object + scale keys are disjoint). */
export const LOCATION_MAP_GLYPH_ICON_COMPONENT_BY_NAME: Record<
  LocationMapGlyphIconName,
  LocationMapDisplayIconComponent
> = {
  ...LOCATION_MAP_OBJECT_ICON_COMPONENT_BY_NAME,
  ...LOCATION_MAP_SCALE_ICON_COMPONENT_BY_NAME,
};

export function getLocationMapScaleIconByName(
  name: LocationMapScaleIconName,
): LocationMapDisplayIconComponent {
  return LOCATION_MAP_SCALE_ICON_COMPONENT_BY_NAME[name] ?? FALLBACK_ICON;
}

export function getLocationMapObjectIconByName(
  name: LocationMapObjectIconName,
): LocationMapDisplayIconComponent {
  return LOCATION_MAP_OBJECT_ICON_COMPONENT_BY_NAME[name] ?? FALLBACK_ICON;
}

export function getLocationMapGlyphIconByName(
  name: LocationMapGlyphIconName,
): LocationMapDisplayIconComponent {
  return LOCATION_MAP_GLYPH_ICON_COMPONENT_BY_NAME[name] ?? FALLBACK_ICON;
}
