/**
 * Map/canvas icon resolution for location scales and cell object kinds.
 * Icon components come from `locationMapIconNameMap.tsx`; shared domain stores **ids** only
 * (`LOCATION_SCALE_MAP_ICON_NAME`, `LOCATION_MAP_OBJECT_KIND_TO_ICON_NAME`).
 */
import type { LocationMapObjectKindId, LocationScaleId } from '@/shared/domain/locations';
import type { LocationMapGlyphIconName } from './locationMapIconNameMap';
import {
  LOCATION_MAP_OBJECT_KIND_TO_ICON_NAME,
  LOCATION_SCALE_MAP_ICON_NAME,
} from '@/features/content/locations/domain/model/map/locationMapPresentation.constants';
import { getMapObjectKindIconName } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.selectors';

import {
  getLocationMapGlyphIconByName,
  getLocationMapObjectIconByName,
  getLocationMapScaleIconByName,
  type LocationMapDisplayIconComponent,
} from './locationMapIconNameMap';

export type { LocationMapDisplayIconComponent };

function mapGlyphIconNamesToComponents<T extends string>(
  names: Record<T, LocationMapGlyphIconName>,
): Record<T, LocationMapDisplayIconComponent> {
  const out = {} as Record<T, LocationMapDisplayIconComponent>;
  for (const key of Object.keys(names) as T[]) {
    out[key] = getLocationMapGlyphIconByName(names[key]);
  }
  return out;
}

/** Default icon for unknown scale (should not happen for valid `LocationScaleId`). */
const FALLBACK_SCALE_ICON = getLocationMapScaleIconByName('map_world');

/**
 * Icons by location scale for map markers / linked-location affordances.
 * Derived from `LOCATION_SCALE_MAP_ICON_NAME` + `LOCATION_MAP_SCALE_ICON_COMPONENT_BY_NAME`.
 */
export const LOCATION_SCALE_MAP_ICON = mapGlyphIconNamesToComponents(LOCATION_SCALE_MAP_ICON_NAME);

export const LOCATION_MAP_OBJECT_KIND_ICON = mapGlyphIconNamesToComponents(
  LOCATION_MAP_OBJECT_KIND_TO_ICON_NAME,
);

export function getLocationScaleMapIcon(scale: string): LocationMapDisplayIconComponent {
  const name = LOCATION_SCALE_MAP_ICON_NAME[scale as LocationScaleId];
  return name ? getLocationMapScaleIconByName(name) : FALLBACK_SCALE_ICON;
}

export function getLocationMapObjectKindIcon(
  kind: LocationMapObjectKindId,
): LocationMapDisplayIconComponent {
  return getLocationMapObjectIconByName(getMapObjectKindIconName(kind));
}
