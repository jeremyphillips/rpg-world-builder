import type { LocationScaleId } from '@/shared/domain/locations';
import { authorCellIdToCombatCellId } from '@/shared/domain/locations/map/locationMapCombatCellIds';
import type { LocationMapAuthoredObjectRenderItem } from '@/shared/domain/locations/map/locationMapAuthoredObjectRender.types';

import type { LocationMapActivePlaceSelection } from '../types/locationMapEditor.types';
import { buildPersistedPlacedObjectPayload } from '../../../model/placedObjects/locationPlacedObject.persistence';
import {
  getPlacementModeForFamily,
  normalizeVariantIdForFamily,
} from '../../../model/placedObjects/locationPlacedObject.selectors.core';

/**
 * Synthetic render item for place-mode hover preview (cell placement).
 * Includes **`map-object`** and **`linked-content`** families that resolve to a persisted cell object (marker, table, …).
 */
export function buildPlacePreviewRenderItem(
  activePlace: LocationMapActivePlaceSelection | null | undefined,
  hoverCellId: string | null,
  hostScale: LocationScaleId,
): LocationMapAuthoredObjectRenderItem | null {
  if (!activePlace || !hoverCellId) return null;
  if (activePlace.category !== 'map-object' && activePlace.category !== 'linked-content') return null;
  if (getPlacementModeForFamily(activePlace.kind) !== 'cell') return null;
  const payload = buildPersistedPlacedObjectPayload(activePlace.kind, hostScale, activePlace.variantId);
  if (!payload) return null;
  const variantId = normalizeVariantIdForFamily(activePlace.kind, activePlace.variantId);
  return {
    id: '__place_preview__',
    authorCellId: hoverCellId,
    combatCellId: authorCellIdToCombatCellId(hoverCellId),
    kind: payload.kind,
    ...(payload.authoredPlaceKindId !== undefined ? { authoredPlaceKindId: payload.authoredPlaceKindId } : {}),
    variantId,
  };
}
