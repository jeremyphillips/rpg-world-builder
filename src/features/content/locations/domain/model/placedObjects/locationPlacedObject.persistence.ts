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
  if (
    placedKind === 'tree' &&
    (hostScale === 'city' || hostScale === 'world' || hostScale === 'site')
  ) {
    return 'marker';
  }
  if (
    placedKind === 'building' &&
    (hostScale === 'city' || hostScale === 'world' || hostScale === 'site')
  ) {
    return 'marker';
  }
  if (placedKind === 'city' && (hostScale === 'world' || hostScale === 'city')) {
    return 'marker';
  }
  if (placedKind === 'site' && hostScale === 'city') {
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
  if (placedKind === 'building' && persistedKind === 'marker') return 'building';
  if (placedKind === 'city' && persistedKind === 'marker') return 'city';
  if (placedKind === 'site' && persistedKind === 'marker') return 'site';
  if (placedKind === 'table' && persistedKind === 'table') return 'table';
  if (placedKind === 'stairs' && persistedKind === 'stairs') return 'stairs';
  if (placedKind === 'treasure' && persistedKind === 'treasure') return 'treasure';
  return undefined;
}

/**
 * @param _variantId — Family-scoped variant (Phase 2). Resolver-only; wire shape is unchanged until a future phase.
 */
export function buildPersistedPlacedObjectPayload(
  placedKind: LocationPlacedObjectKindId,
  hostScale: LocationScaleId,
  _variantId?: string,
): PersistedPlacedObjectPayload | null {
  void _variantId;
  const kind = mapPlacedObjectKindToPersistedMapObjectKind(placedKind, hostScale);
  if (kind === null) return null;
  const authoredPlaceKindId = getAuthoredPlaceKindIdForPersistedPayload(placedKind, kind);
  return {
    kind,
    ...(authoredPlaceKindId !== undefined ? { authoredPlaceKindId } : {}),
  };
}
