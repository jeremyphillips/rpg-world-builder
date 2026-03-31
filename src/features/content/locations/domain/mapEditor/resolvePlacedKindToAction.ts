import type { LocationMapObjectKindId } from '@/shared/domain/locations';
import type { LocationEdgeFeatureKindId } from '@/features/content/locations/domain/mapContent/locationEdgeFeature.types';
import type { LocationPathFeatureKindId } from '@/features/content/locations/domain/mapContent/locationPathFeature.types';
import type { LocationPlacedObjectKindId } from '@/features/content/locations/domain/mapContent/locationPlacedObject.types';
import type { LocationScaleId } from '@/shared/domain/locations';

import type { LocationMapActivePlaceSelection } from './locationMapEditor.types';
import { mapPlacedObjectKindToPersistedMapObjectKind } from './placeObjectBridge';

export type ResolvedPlacedKindAction =
  | {
      type: 'link';
      linkedScale: LocationScaleId;
      objectKind: LocationPlacedObjectKindId;
    }
  | { type: 'object'; objectKind: LocationMapObjectKindId }
  | { type: 'path'; pathKind: LocationPathFeatureKindId }
  | { type: 'edge'; edgeKind: LocationEdgeFeatureKindId }
  | { type: 'unsupported'; reason?: string };

export function resolvePlacedKindToAction(
  selection: LocationMapActivePlaceSelection,
  hostScale: LocationScaleId,
): ResolvedPlacedKindAction {
  if (!selection) {
    return { type: 'unsupported', reason: 'no_selection' };
  }
  if (selection.category === 'path') {
    return { type: 'path', pathKind: selection.kind };
  }
  if (selection.category === 'edge') {
    return { type: 'edge', edgeKind: selection.kind };
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
  const mapped = mapPlacedObjectKindToPersistedMapObjectKind(placedKind, hostScale);
  if (mapped) {
    return { type: 'object', objectKind: mapped };
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
    }
  | { kind: 'unsupported' };

/** @deprecated Prefer resolvePlacedKindToAction. */
export function resolveLocationPlacedKindToAction(
  placedKind: LocationPlacedObjectKindId,
  hostScale: LocationScaleId,
): ResolveLocationPlacedKindResult {
  const r = resolvePlacedKindToAction({ category: 'object', kind: placedKind }, hostScale);
  if (r.type === 'link') {
    return {
      kind: 'link-modal',
      objectKind: r.objectKind,
      linkedScale: r.linkedScale,
    };
  }
  if (r.type === 'object') {
    return { kind: 'place-object', mapObjectKind: r.objectKind };
  }
  return { kind: 'unsupported' };
}
