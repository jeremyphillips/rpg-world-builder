/**
 * Placed object kinds: anchored / footprint objects on a map (settlements, structures, props).
 *
 * **Canonical definitions:** {@link ./locationPlacedObject.registry} — add kinds there.
 * **Derived metadata / ids / parse:** {@link ./locationPlacedObject.selectors}.
 * **Persisted cell-object kinds** remain `LOCATION_MAP_OBJECT_KIND_IDS` in shared `map/locationMap.constants.ts`.
 */

export type { LocationPlacedObjectKindId } from './locationPlacedObject.registry';

export {
  getMapObjectKindIconName,
  getPlacedObjectIconName,
  getPlacedObjectMeta,
  getPlacedObjectPaletteOptionsForScale,
  LOCATION_PLACED_OBJECT_KIND_IDS,
  LOCATION_PLACED_OBJECT_KIND_META,
  parseLocationPlacedObjectKindId,
  type LocationPlacedObjectKindMeta,
  type PlacedObjectPaletteOption,
} from './locationPlacedObject.selectors';
