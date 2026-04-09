/**
 * Placed object kinds: anchored / footprint objects on a map (settlements, structures, props).
 *
 * **Canonical definitions:** {@link ./locationPlacedObject.registry} — add kinds there.
 * **Derived metadata / ids / parse:** {@link ./locationPlacedObject.selectors}.
 * **Persisted cell-object kinds** remain `LOCATION_MAP_OBJECT_KIND_IDS` in shared `map/locationMap.constants.ts`.
 */

export type {
  AuthoredObjectMaterial,
  AuthoredObjectShape,
  AuthoredPlacedObjectPlacementMode,
  AuthoredPlacedObjectFamilyDefinition,
  AuthoredPlacedObjectInteraction,
  AuthoredPlacedObjectTransitionKind,
  AuthoredPlacedObjectVariantDefinition,
  AuthoredPlacedObjectVariantPresentation,
  LocationPlacedObjectKindId,
  PlacedObjectPaletteCategoryId,
} from './locationPlacedObject.registry';

export { DEFAULT_PLACED_OBJECT_VARIANT_ID } from './locationPlacedObject.registry';

export {
  comparePlacedObjectPaletteCategories,
  getDefaultVariantIdForFamily,
  getPlacementModeForFamily,
  getMapObjectKindIconName,
  getPlacedObjectDefinition,
  getPlacedObjectMeta,
  getPlacedObjectPaletteCategoryId,
  getPlacedObjectPaletteCategoryLabel,
  getPlacedObjectPaletteOptionsForScale,
  getPlacedObjectVariantPickerRowsForFamily,
  getDefaultVariantPresentationForKind,
  getPlacedObjectVariantLabel,
  resolvePersistedMapObjectKindMapImageUrl,
  getPlacedObjectVariantPresentation,
  getVariantCountForFamily,
  isVariantIdValidForFamily,
  LOCATION_PLACED_OBJECT_KIND_IDS,
  LOCATION_PLACED_OBJECT_KIND_META,
  normalizeVariantIdForFamily,
  parseLocationPlacedObjectKindId,
  resolvePlacedObjectKindForCellObject,
  resolvePlacedObjectVariant,
  type LocationPlacedObjectKindMeta,
  type PlacedObjectPaletteOption,
  type PlacedObjectVariantPickerRow,
} from './locationPlacedObject.selectors';
