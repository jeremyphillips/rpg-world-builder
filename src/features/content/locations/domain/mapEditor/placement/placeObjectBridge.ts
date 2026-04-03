/**
 * Maps authored "placed object" palette kinds to persisted {@link LocationMapObjectKindId}.
 * When no mapping exists, linked placement or unsupported resolver paths apply instead.
 */
import type { LocationMapObjectKindId } from '@/shared/domain/locations';
import type { LocationPlacedObjectKindId } from '@/features/content/locations/domain/mapContent/locationPlacedObject.types';
import type { LocationScaleId } from '@/shared/domain/locations';

export function mapPlacedObjectKindToPersistedMapObjectKind(
  placedKind: LocationPlacedObjectKindId,
  hostScale: LocationScaleId,
): LocationMapObjectKindId | null {
  /** POI vegetation: persisted as `marker`; pair with `authoredPlaceKindId: 'tree'` at save (see resolver). */
  if (placedKind === 'tree' && hostScale === 'city') {
    return 'marker';
  }
  if (placedKind === 'stairs' && hostScale === 'floor') {
    return 'stairs';
  }
  if (placedKind === 'treasure' && hostScale === 'floor') {
    return 'treasure';
  }
  /** Furniture / surface: persisted as obstacle; `authoredPlaceKindId` preserves palette id (`table`). */
  if (placedKind === 'table' && hostScale === 'floor') {
    return 'obstacle';
  }
  return null;
}
