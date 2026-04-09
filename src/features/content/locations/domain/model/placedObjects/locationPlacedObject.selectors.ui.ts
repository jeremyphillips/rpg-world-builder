/**
 * Palette / map raster URL resolution (Vite-bundled PNGs). Do not import from server-only modules —
 * use {@link ./locationPlacedObject.selectors.core} there instead.
 */
import type { LocationMapObjectKindId, LocationScaleId } from '@/shared/domain/locations';
import {
  AUTHORED_PLACED_OBJECT_DEFINITIONS,
  type AuthoredPlacedObjectFamilyDefinition,
  type AuthoredPlacedObjectVariantPresentation,
  type LocationPlacedObjectKindId,
  type PlacedObjectPaletteCategoryId,
} from './locationPlacedObject.registry';
import { mapValuesStrict, recordKeys } from './locationPlacedObject.recordUtils';
import {
  getPlacedObjectMapImageUrlForAssetId,
  getPlacedObjectPreviewUrlForAssetId,
  PLACEHOLDER_NO_ART_ASSET_ID,
} from './locationPlacedObjectRasterAssets';
import {
  defaultVariantEntryOf,
  getPlacedObjectDefinition,
  getPlacedObjectKindsForScale,
  getVariantCountForFamily,
  resolvePlacedObjectVariant,
  variantRecord,
  type LocationPlacedObjectKindMeta,
} from './locationPlacedObject.selectors.core';

export type PlacedObjectVariantPickerRow = {
  variantId: string;
  label: string;
  description?: string;
  previewImageUrl: string;
  presentation?: AuthoredPlacedObjectVariantPresentation;
};

/** Rows for a family-only variant picker (registry order = object key order). */
export function getPlacedObjectVariantPickerRowsForFamily(
  kind: LocationPlacedObjectKindId,
): readonly PlacedObjectVariantPickerRow[] {
  const family = getPlacedObjectDefinition(kind);
  const variants = variantRecord(family);
  const ids = recordKeys(variants);
  return ids.map((variantId) => {
    const v = variants[variantId]!;
    return {
      variantId,
      label: v.label,
      description: v.description,
      previewImageUrl: getPlacedObjectPreviewUrlForAssetId(v.assetId),
      ...(v.presentation !== undefined ? { presentation: v.presentation } : {}),
    };
  });
}

function toMeta(family: AuthoredPlacedObjectFamilyDefinition): LocationPlacedObjectKindMeta {
  const v = defaultVariantEntryOf(family);
  return {
    label: v.label,
    description: v.description,
    previewImageUrl: getPlacedObjectPreviewUrlForAssetId(v.assetId),
    ...(family.linkedScale !== undefined ? { linkedScale: family.linkedScale } : {}),
  };
}

/** Display metadata derived from {@link AUTHORED_PLACED_OBJECT_DEFINITIONS} (default variant per family). */
export const LOCATION_PLACED_OBJECT_KIND_META = mapValuesStrict(
  AUTHORED_PLACED_OBJECT_DEFINITIONS,
  toMeta,
) satisfies Record<LocationPlacedObjectKindId, LocationPlacedObjectKindMeta>;

export function getPlacedObjectMeta(id: LocationPlacedObjectKindId): LocationPlacedObjectKindMeta {
  return LOCATION_PLACED_OBJECT_KIND_META[id];
}

export type PlacedObjectPaletteOption = {
  kind: LocationPlacedObjectKindId;
  label: string;
  description?: string;
  previewImageUrl: string;
  linkedScale?: LocationScaleId;
  paletteCategory: PlacedObjectPaletteCategoryId;
  defaultVariantId: string;
  variantCount: number;
};

/** Narrow DTOs for the place palette — derived from registry + `allowedScales` (via {@link getPlacedObjectKindsForScale}). */
export function getPlacedObjectPaletteOptionsForScale(
  scale: LocationScaleId,
): readonly PlacedObjectPaletteOption[] {
  const kinds = getPlacedObjectKindsForScale(scale);
  return kinds.map((kind) => {
    const family = getPlacedObjectDefinition(kind);
    const v = defaultVariantEntryOf(family);
    return {
      kind,
      label: v.label,
      description: v.description,
      previewImageUrl: getPlacedObjectPreviewUrlForAssetId(v.assetId),
      paletteCategory: family.category,
      defaultVariantId: family.defaultVariantId,
      variantCount: getVariantCountForFamily(kind),
      ...(family.linkedScale !== undefined ? { linkedScale: family.linkedScale } : {}),
    };
  });
}

/**
 * In-map raster URL for legacy persisted cell object kind when `authoredPlaceKindId` is absent.
 */
export function resolvePersistedMapObjectKindMapImageUrl(kind: LocationMapObjectKindId): string | null {
  switch (kind) {
    case 'marker':
      return getPlacedObjectMapImageUrlForAssetId(PLACEHOLDER_NO_ART_ASSET_ID);
    case 'table':
      return getPlacedObjectMapImageUrlForAssetId(resolvePlacedObjectVariant('table', undefined).variant.assetId);
    case 'treasure':
      return getPlacedObjectMapImageUrlForAssetId(resolvePlacedObjectVariant('treasure', undefined).variant.assetId);
    case 'stairs':
      return getPlacedObjectMapImageUrlForAssetId(resolvePlacedObjectVariant('stairs', undefined).variant.assetId);
    case 'door':
      return getPlacedObjectMapImageUrlForAssetId(resolvePlacedObjectVariant('door', undefined).variant.assetId);
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
