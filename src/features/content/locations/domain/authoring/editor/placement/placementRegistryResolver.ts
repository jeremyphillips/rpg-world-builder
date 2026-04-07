/**
 * Consolidated placement seam: registry / active-place identity → link intent or persisted map-object payload.
 * {@link resolvePlacedKindToAction} and {@link buildPersistedPlacedObjectPayload} remain the implementation;
 * this module is the single entry for cell-click placement (see {@link resolvePlacementCellClick}).
 */
import type { LocationMapCellObjectEntry } from '@/shared/domain/locations/map/locationMap.types';
import type { LocationScaleId } from '@/shared/domain/locations';
import type { LocationEdgeFeatureKindId } from '@/features/content/locations/domain/model/map/locationEdgeFeature.types';
import { canPlaceObjectKindOnHostScale } from '@/shared/domain/locations/map/locationMapPlacement.policy';
import { LOCATION_MAP_STAIR_ENDPOINT_DEFAULT_DIRECTION } from '@/shared/domain/locations/map/locationMapStairEndpoint.types';

import type { LocationMapActivePlaceSelection } from '../types/locationMapEditor.types';

import { resolvePlacedKindToAction } from './resolvePlacedKindToAction';

export {
  resolvePlacedKindToAction,
  mapPlacedFamilyToEdgeFeatureKind,
  type ResolvedPlacedKindAction,
} from './resolvePlacedKindToAction';
export {
  buildPersistedPlacedObjectPayload,
  type PersistedPlacedObjectPayload,
} from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.persistence';

/** One placement resolution step for a cell click (no draft mutation — caller applies). */
export type PlacementCellClickResult =
  | { kind: 'unsupported' }
  | {
      kind: 'append-object';
      cellId: string;
      /** Fields for a new {@link LocationMapCellObjectEntry}; caller adds `id`. */
      objectDraft: Omit<LocationMapCellObjectEntry, 'id'>;
    };

/**
 * Maps `activePlace` + cell + host scale to a new object draft.
 * Stairs default `stairEndpoint` is applied here (draft-creation layer), not in generic palette UI.
 */
export function resolvePlacementCellClick(
  activePlace: LocationMapActivePlaceSelection,
  cellId: string,
  hostScale: LocationScaleId,
): PlacementCellClickResult {
  const res = resolvePlacedKindToAction(activePlace, hostScale);
  if (res.type === 'unsupported') {
    return { kind: 'unsupported' };
  }
  if (res.type === 'object') {
    if (!canPlaceObjectKindOnHostScale(hostScale, res.objectKind)) {
      return { kind: 'unsupported' };
    }
    const objectDraft: Omit<LocationMapCellObjectEntry, 'id'> = {
      kind: res.objectKind,
      ...(res.authoredPlaceKindId !== undefined ? { authoredPlaceKindId: res.authoredPlaceKindId } : {}),
      ...(res.objectKind === 'stairs'
        ? {
            stairEndpoint: {
              direction: LOCATION_MAP_STAIR_ENDPOINT_DEFAULT_DIRECTION,
            },
          }
        : {}),
    };
    return {
      kind: 'append-object',
      cellId,
      objectDraft,
    };
  }
  return { kind: 'unsupported' };
}

/**
 * Edge placement (Place tool, `placementMode: 'edge'`) — maps armed `activePlace` to `edgeEntries[].kind`.
 * Returns `null` when the selection is not an edge family or host scale disallows it.
 */
export function resolvePlacementEdgeFeatureKind(
  activePlace: LocationMapActivePlaceSelection,
  hostScale: LocationScaleId,
): LocationEdgeFeatureKindId | null {
  const res = resolvePlacedKindToAction(activePlace, hostScale);
  return res.type === 'edge' ? res.edgeKind : null;
}
