/**
 * Placed object kinds: anchored / footprint objects on a map (settlements, structures, props).
 *
 * **Canonical definitions:** {@link ./locationPlacedObject.registry} — add kinds there.
 * **Derived metadata / ids / parse:** {@link ./locationPlacedObject.selectors}.
 * **Persisted cell-object kinds** remain `LOCATION_MAP_OBJECT_KIND_IDS` in shared `map/locationMap.constants.ts`.
 */

export type {
  AuthoredPlacedObjectFamilyDefinition,
  AuthoredPlacedObjectInteraction,
  AuthoredPlacedObjectTransitionKind,
  AuthoredPlacedObjectVariantDefinition,
  DEFAULT_PLACED_OBJECT_VARIANT_ID,
  LocationPlacedObjectKindId,
  PlacedObjectPaletteCategoryId,
} from './locationPlacedObject.registry';

export {
  comparePlacedObjectPaletteCategories,
  getMapObjectKindIconName,
  getPlacedObjectIconName,
  getPlacedObjectMeta,
  getPlacedObjectPaletteCategoryId,
  getPlacedObjectPaletteCategoryLabel,
  getPlacedObjectPaletteOptionsForScale,
  LOCATION_PLACED_OBJECT_KIND_IDS,
  LOCATION_PLACED_OBJECT_KIND_META,
  parseLocationPlacedObjectKindId,
  type LocationPlacedObjectKindMeta,
  type PlacedObjectPaletteOption,
} from './locationPlacedObject.selectors';
