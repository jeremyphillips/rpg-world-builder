import type { LocationMapObjectKindId } from '@/shared/domain/locations';
import type { LocationPlacedObjectKindId } from '@/features/content/locations/domain/mapContent/locationPlacedObject.types';
import type { LocationScaleId } from '@/shared/domain/locations';

import { getPlacedObjectMeta } from '@/features/content/locations/domain/mapContent/locationPlacedObject.types';
import { buildPersistedPlacedObjectPayload } from '@/features/content/locations/domain/mapContent/locationPlacedObject.persistence';

import type { LocationMapActivePlaceSelection } from '../types/locationMapEditor.types';

export type ResolvedPlacedKindAction =
  | {
      type: 'link';
      linkedScale: LocationScaleId;
      objectKind: LocationPlacedObjectKindId;
    }
  | {
      type: 'object';
      objectKind: LocationMapObjectKindId;
      authoredPlaceKindId?: LocationPlacedObjectKindId;
    }
  | { type: 'unsupported'; reason?: string };

export function resolvePlacedKindToAction(
  selection: LocationMapActivePlaceSelection,
  hostScale: LocationScaleId,
): ResolvedPlacedKindAction {
  if (!selection) {
    return { type: 'unsupported', reason: 'no_selection' };
  }
  if (selection.category !== 'linked-content' && selection.category !== 'map-object') {
    return { type: 'unsupported', reason: 'invalid_place_selection' };
  }
  const placedKind = selection.kind;
  if (placedKind === 'city' && hostScale === 'world') {
    return { type: 'link', objectKind: 'city', linkedScale: 'city' };
  }
  if (placedKind === 'building' && hostScale === 'city') {
    return { type: 'link', objectKind: 'building', linkedScale: 'building' };
  }
  if (placedKind === 'site' && hostScale === 'city') {
    return { type: 'link', objectKind: 'site', linkedScale: 'site' };
  }
  const payload = buildPersistedPlacedObjectPayload(placedKind, hostScale);
  if (payload) {
    return {
      type: 'object',
      objectKind: payload.kind,
      ...(payload.authoredPlaceKindId !== undefined
        ? { authoredPlaceKindId: payload.authoredPlaceKindId }
        : {}),
    };
  }
  return { type: 'unsupported', reason: 'no_mapping' };
}

/** @deprecated Prefer resolvePlacedKindToAction with full selection. */
export type ResolveLocationPlacedKindResult =
  | {
      kind: 'link-modal';
      objectKind: LocationPlacedObjectKindId;
      linkedScale: LocationScaleId;
    }
  | {
      kind: 'place-object';
      mapObjectKind: LocationMapObjectKindId;
      authoredPlaceKindId?: LocationPlacedObjectKindId;
    }
  | { kind: 'unsupported' };

/** @deprecated Prefer resolvePlacedKindToAction. */
export function resolveLocationPlacedKindToAction(
  placedKind: LocationPlacedObjectKindId,
  hostScale: LocationScaleId,
): ResolveLocationPlacedKindResult {
  const meta = getPlacedObjectMeta(placedKind);
  const cat =
    'linkedScale' in meta && meta.linkedScale
      ? ('linked-content' as const)
      : ('map-object' as const);
  const r = resolvePlacedKindToAction({ category: cat, kind: placedKind }, hostScale);
  if (r.type === 'link') {
    return {
      kind: 'link-modal',
      objectKind: r.objectKind,
      linkedScale: r.linkedScale,
    };
  }
  if (r.type === 'object') {
    return {
      kind: 'place-object',
      mapObjectKind: r.objectKind,
      ...(r.authoredPlaceKindId !== undefined
        ? { authoredPlaceKindId: r.authoredPlaceKindId }
        : {}),
    };
  }
  return { kind: 'unsupported' };
}
