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
  if (placedKind === 'tree' && hostScale === 'city') {
    return 'marker';
  }
  if (placedKind === 'stairs' && hostScale === 'floor') {
    return 'stairs';
  }
  if (placedKind === 'treasure' && hostScale === 'floor') {
    return 'treasure';
  }
  if (placedKind === 'table' && hostScale === 'floor') {
    return 'marker';
  }
  return null;
}
