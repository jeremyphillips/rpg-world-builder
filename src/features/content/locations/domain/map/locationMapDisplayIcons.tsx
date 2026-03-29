/**
 * MUI icon components for rendering location scales and cell object kinds on maps.
 * Keep map/canvas usage here — modal UI stays text-only.
 */
import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ApartmentIcon from '@mui/icons-material/Apartment';
import HomeIcon from '@mui/icons-material/Home';
import LayersIcon from '@mui/icons-material/Layers';
import MapIcon from '@mui/icons-material/Map';
import MapsHomeWorkIcon from '@mui/icons-material/MapsHomeWork';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PublicIcon from '@mui/icons-material/Public';
import TerrainIcon from '@mui/icons-material/Terrain';
import BlockIcon from '@mui/icons-material/Block';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import StairsIcon from '@mui/icons-material/Stairs';

import type { LocationMapObjectKindId, LocationScaleId } from '@/shared/domain/locations';

export type LocationMapDisplayIconComponent = ComponentType<SvgIconProps>;

/** Default icon for unknown scale (should not happen for valid `LocationScaleId`). */
const FALLBACK_SCALE_ICON = PublicIcon;

/**
 * Icons by location scale for map markers / linked-location affordances.
 * Examples: city → MapsHomeWork, site → AccountBalance, building → Home.
 */
export const LOCATION_SCALE_MAP_ICON: Record<LocationScaleId, LocationMapDisplayIconComponent> = {
  world: PublicIcon,
  region: MapIcon,
  subregion: LayersIcon,
  city: MapsHomeWorkIcon,
  district: TerrainIcon,
  site: AccountBalanceIcon,
  building: HomeIcon,
  floor: ApartmentIcon,
  room: MeetingRoomIcon,
};

export const LOCATION_MAP_OBJECT_KIND_ICON: Record<
  LocationMapObjectKindId,
  LocationMapDisplayIconComponent
> = {
  marker: RadioButtonUncheckedIcon,
  obstacle: BlockIcon,
  treasure: Inventory2Icon,
  door: DoorFrontIcon,
  stairs: StairsIcon,
};

export function getLocationScaleMapIcon(scale: string): LocationMapDisplayIconComponent {
  const Icon = LOCATION_SCALE_MAP_ICON[scale as LocationScaleId];
  return Icon ?? FALLBACK_SCALE_ICON;
}

export function getLocationMapObjectKindIcon(
  kind: LocationMapObjectKindId,
): LocationMapDisplayIconComponent {
  return LOCATION_MAP_OBJECT_KIND_ICON[kind] ?? RadioButtonUncheckedIcon;
}
