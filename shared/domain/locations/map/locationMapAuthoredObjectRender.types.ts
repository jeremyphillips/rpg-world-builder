import type { LocationMapObjectKindId } from './locationMap.types';

/**
 * One authored map object as a **presentation** render item (cell-anchored).
 * Derived only from location map `cellEntries`; not runtime GridObject state.
 *
 * @see deriveLocationMapAuthoredObjectRenderItems
 */
export type LocationMapAuthoredObjectRenderItem = {
  id: string;
  authorCellId: string;
  combatCellId: string;
  kind: LocationMapObjectKindId;
  authoredPlaceKindId?: string;
  /** Mirrors {@link LocationMapCellObjectEntry.variantId} when present. */
  variantId?: string;
  label?: string;
};
