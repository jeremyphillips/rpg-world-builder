import type { LocationMapObjectKindId } from '@/shared/domain/locations';
import type { LocationPlacedObjectKindId } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.types';
import type { LocationScaleId } from '@/shared/domain/locations';
import type { LocationEdgeFeatureKindId } from '@/features/content/locations/domain/model/map/locationEdgeFeature.types';

import {
  getPlacedObjectDefinition,
  normalizeVariantIdForFamily,
} from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.types';
import { buildPersistedPlacedObjectPayload } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.persistence';

import type { LocationMapActivePlaceSelection } from '../types/locationMapEditor.types';

/** Maps edge `placementMode` registry families to persisted `edgeEntries[].kind`. */
export function mapPlacedFamilyToEdgeFeatureKind(
  placedKind: LocationPlacedObjectKindId,
): LocationEdgeFeatureKindId | null {
  if (placedKind === 'door') return 'door';
  if (placedKind === 'window') return 'window';
  return null;
}

export type ResolvedPlacedKindAction =
  | {
      type: 'object';
      objectKind: LocationMapObjectKindId;
      authoredPlaceKindId?: LocationPlacedObjectKindId;
    }
  | {
      type: 'edge';
      edgeKind: LocationEdgeFeatureKindId;
      /** Registry family — same as persisted `edgeEntries[].authoredPlaceKindId`. */
      placedKind: LocationPlacedObjectKindId;
      /** Family-scoped variant id — same as persisted `edgeEntries[].variantId`. */
      variantId: string;
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
  const resolvedVariantId = normalizeVariantIdForFamily(placedKind, selection.variantId);

  const familyDef = getPlacedObjectDefinition(placedKind);
  if (familyDef.placementMode === 'edge') {
    const edgeKind = mapPlacedFamilyToEdgeFeatureKind(placedKind);
    if (!edgeKind) {
      return { type: 'unsupported', reason: 'no_edge_kind' };
    }
    const allowed = familyDef.allowedScales as readonly LocationScaleId[];
    if (!allowed.includes(hostScale)) {
      return { type: 'unsupported', reason: 'host_scale' };
    }
    return {
      type: 'edge',
      edgeKind,
      placedKind,
      variantId: resolvedVariantId,
    };
  }

  const payload = buildPersistedPlacedObjectPayload(placedKind, hostScale, resolvedVariantId);
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
