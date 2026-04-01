/**
 * Maps semantic `LocationMapIconName` tokens (locations `domain/mapContent`) to MUI `SvgIcon` components.
 * Metadata never imports React or MUI — only this UI module resolves tokens to components.
 */
import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BlockIcon from '@mui/icons-material/Block';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import ForestIcon from '@mui/icons-material/Forest';
import GrassIcon from '@mui/icons-material/Grass';
import GridOnIcon from '@mui/icons-material/GridOn';
import HomeIcon from '@mui/icons-material/Home';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LayersIcon from '@mui/icons-material/Layers';
import MapIcon from '@mui/icons-material/Map';
import MapsHomeWorkIcon from '@mui/icons-material/MapsHomeWork';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ParkIcon from '@mui/icons-material/Park';
import PublicIcon from '@mui/icons-material/Public';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import StairsIcon from '@mui/icons-material/Stairs';
import TerrainIcon from '@mui/icons-material/Terrain';
import WaterDamageIcon from '@mui/icons-material/WaterDamage';
import WaterIcon from '@mui/icons-material/Water';
import WbSunnyIcon from '@mui/icons-material/WbSunny';

import type { LocationMapIconName } from '@/features/content/locations/domain/mapContent';

export type LocationMapDisplayIconComponent = ComponentType<SvgIconProps>;

const FALLBACK_ICON = RadioButtonUncheckedIcon;

/**
 * Exhaustive map from semantic icon name → MUI icon component.
 */
export const LOCATION_MAP_ICON_COMPONENT_BY_NAME: Record<
  LocationMapIconName,
  LocationMapDisplayIconComponent
> = {
  mountain: TerrainIcon,
  plains: GrassIcon,
  forest_light: ParkIcon,
  forest_heavy: ForestIcon,
  swamp: WaterDamageIcon,
  desert: WbSunnyIcon,
  water: WaterIcon,
  stone_floor: GridOnIcon,
  map_world: PublicIcon,
  map_region: MapIcon,
  map_subregion: LayersIcon,
  map_city: MapsHomeWorkIcon,
  map_district: TerrainIcon,
  map_site: AccountBalanceIcon,
  map_building: HomeIcon,
  map_floor: ApartmentIcon,
  map_room: MeetingRoomIcon,
  marker: RadioButtonUncheckedIcon,
  obstacle: BlockIcon,
  treasure: Inventory2Icon,
  door: DoorFrontIcon,
  stairs: StairsIcon,
};

export function getLocationMapIconByName(
  name: LocationMapIconName,
): LocationMapDisplayIconComponent {
  return LOCATION_MAP_ICON_COMPONENT_BY_NAME[name] ?? FALLBACK_ICON;
}
