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
 * Synthetic render item for place-mode hover preview (map-object, cell placement).
 */
export function buildPlacePreviewRenderItem(
  activePlace: LocationMapActivePlaceSelection | null | undefined,
  hoverCellId: string | null,
  hostScale: LocationScaleId,
): LocationMapAuthoredObjectRenderItem | null {
  if (!activePlace || activePlace.category !== 'map-object' || !hoverCellId) return null;
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
