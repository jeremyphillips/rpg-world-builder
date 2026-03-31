import type { LocationMapObjectKindId } from '@/shared/domain/locations';
import type { LocationPlacedObjectKindId } from '@/features/content/locations/domain/mapContent/locationPlacedObject.types';
import type { LocationScaleId } from '@/shared/domain/locations';

/**
 * Single entry point for tool “placed object kind” → link modal vs persisted map object kind.
 * UI branches on this result, not on raw metadata.
 */
export type ResolveLocationPlacedKindResult =
  | {
      kind: 'link-modal';
      objectKind: LocationPlacedObjectKindId;
      linkedScale: LocationScaleId;
    }
  | {
      kind: 'place-object';
      mapObjectKind: LocationMapObjectKindId;
    }
  | { kind: 'unsupported' };

export function resolveLocationPlacedKindToAction(
  placedKind: LocationPlacedObjectKindId,
  hostScale: LocationScaleId,
): ResolveLocationPlacedKindResult {
  if (placedKind === 'city' && hostScale === 'world') {
    return { kind: 'link-modal', objectKind: 'city', linkedScale: 'city' };
  }
  if (placedKind === 'tree' && hostScale === 'city') {
    return { kind: 'place-object', mapObjectKind: 'marker' };
  }
  if (placedKind === 'stairs' && hostScale === 'floor') {
    return { kind: 'place-object', mapObjectKind: 'stairs' };
  }
  if (placedKind === 'treasure' && hostScale === 'floor') {
    return { kind: 'place-object', mapObjectKind: 'treasure' };
  }
  if (placedKind === 'table' && hostScale === 'floor') {
    return { kind: 'place-object', mapObjectKind: 'marker' };
  }
  if ((placedKind === 'building' || placedKind === 'site') && hostScale === 'city') {
    return { kind: 'unsupported' };
  }
  return { kind: 'unsupported' };
}
