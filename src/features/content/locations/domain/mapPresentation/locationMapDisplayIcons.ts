/**
 * Map/canvas icon resolution for location scales and cell object kinds.
 * Icon components come from `locationMapIconNameMap.tsx` (semantic `LocationMapIconName` → MUI);
 * shared domain stores `iconName` tokens only (`LOCATION_SCALE_MAP_ICON_NAME`, etc.).
 */
import type { LocationMapObjectKindId, LocationScaleId } from '@/shared/domain/locations';
import type { LocationMapIconName } from '@/features/content/locations/domain/mapContent';
import {
  LOCATION_MAP_OBJECT_KIND_ICON_NAME,
  LOCATION_SCALE_MAP_ICON_NAME,
} from '@/features/content/locations/domain/mapContent';

import {
  getLocationMapIconByName,
  type LocationMapDisplayIconComponent,
} from './locationMapIconNameMap';

export type { LocationMapDisplayIconComponent };

function mapIconNamesToComponents<T extends string>(
  names: Record<T, LocationMapIconName>,
): Record<T, LocationMapDisplayIconComponent> {
  const out = {} as Record<T, LocationMapDisplayIconComponent>;
  for (const key of Object.keys(names) as T[]) {
    out[key] = getLocationMapIconByName(names[key]);
  }
  return out;
}

/** Default icon for unknown scale (should not happen for valid `LocationScaleId`). */
const FALLBACK_SCALE_ICON = getLocationMapIconByName('map_world');

/**
 * Icons by location scale for map markers / linked-location affordances.
 * Derived from `LOCATION_SCALE_MAP_ICON_NAME` + `LOCATION_MAP_ICON_COMPONENT_BY_NAME`.
 */
export const LOCATION_SCALE_MAP_ICON = mapIconNamesToComponents(LOCATION_SCALE_MAP_ICON_NAME);

export const LOCATION_MAP_OBJECT_KIND_ICON = mapIconNamesToComponents(
  LOCATION_MAP_OBJECT_KIND_ICON_NAME,
);

export function getLocationScaleMapIcon(scale: string): LocationMapDisplayIconComponent {
  const name = LOCATION_SCALE_MAP_ICON_NAME[scale as LocationScaleId];
  return name ? getLocationMapIconByName(name) : FALLBACK_SCALE_ICON;
}

export function getLocationMapObjectKindIcon(
  kind: LocationMapObjectKindId,
): LocationMapDisplayIconComponent {
  return getLocationMapIconByName(LOCATION_MAP_OBJECT_KIND_ICON_NAME[kind]);
}
