/**
 * Maps authored palette kinds + host scale to persisted cell-object shape for **new** saves.
 */
import type { LocationMapObjectKindId } from '@/shared/domain/locations';
import type { LocationScaleId } from '@/shared/domain/locations';

import type { LocationPlacedObjectKindId } from './locationPlacedObject.registry';

export type PersistedPlacedObjectPayload = {
  kind: LocationMapObjectKindId;
  authoredPlaceKindId?: LocationPlacedObjectKindId;
};

/**
 * Persisted map object kind for this authored placement (before optional `authoredPlaceKindId` disambiguation).
 */
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
    return 'table';
  }
  return null;
}

/**
 * For new saves: always persist canonical `authoredPlaceKindId` when the placement maps to a persisted object.
 */
export function getAuthoredPlaceKindIdForPersistedPayload(
  placedKind: LocationPlacedObjectKindId,
  persistedKind: LocationMapObjectKindId,
): LocationPlacedObjectKindId | undefined {
  if (placedKind === 'tree' && persistedKind === 'marker') return 'tree';
  if (placedKind === 'table' && persistedKind === 'table') return 'table';
  if (placedKind === 'stairs' && persistedKind === 'stairs') return 'stairs';
  if (placedKind === 'treasure' && persistedKind === 'treasure') return 'treasure';
  return undefined;
}

export function buildPersistedPlacedObjectPayload(
  placedKind: LocationPlacedObjectKindId,
  hostScale: LocationScaleId,
): PersistedPlacedObjectPayload | null {
  const kind = mapPlacedObjectKindToPersistedMapObjectKind(placedKind, hostScale);
  if (kind === null) return null;
  const authoredPlaceKindId = getAuthoredPlaceKindIdForPersistedPayload(placedKind, kind);
  return {
    kind,
    ...(authoredPlaceKindId !== undefined ? { authoredPlaceKindId } : {}),
  };
}
