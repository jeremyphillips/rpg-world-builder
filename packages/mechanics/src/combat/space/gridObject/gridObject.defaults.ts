import { getPlacedObjectMeta } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.types';

import type { GridObject, GridObjectAuthoredKindId } from '../space.types';

/**
 * Authored palette kind for labels / grid VM.
 */
export function gridObjectPlacementKindKey(o: GridObject): GridObjectAuthoredKindId {
  return o.authoredPlaceKindId;
}

/**
 * Human-readable name for a placed object (registry metadata for `authoredPlaceKindId`).
 */
export function gridObjectPlacementKindDisplayLabel(kind: GridObjectAuthoredKindId): string {
  return getPlacedObjectMeta(kind).label;
}

export function gridObjectDisplayLabel(o: GridObject): string {
  return gridObjectPlacementKindDisplayLabel(gridObjectPlacementKindKey(o));
}
