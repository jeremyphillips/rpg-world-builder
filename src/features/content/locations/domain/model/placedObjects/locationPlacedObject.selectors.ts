import type { LocationMapObjectKindId, LocationScaleId } from '@/shared/domain/locations';
import { isValidLocationScaleId } from '@/shared/domain/locations/scale/locationScale.rules';

import {
  AUTHORED_PLACED_OBJECT_DEFINITIONS,
  DEFAULT_PLACED_OBJECT_VARIANT_ID,
  PLACED_OBJECT_PALETTE_CATEGORY_LABELS,
  PLACED_OBJECT_PALETTE_CATEGORY_ORDER,
  type AuthoredPlacedObjectFamilyDefinition,
  type AuthoredPlacedObjectInteraction,
  type LocationPlacedObjectKindId,
  type LocationPlacedObjectKindRuntimeDefaults,
  type PlacedObjectPaletteCategoryId,
} from './locationPlacedObject.registry';
import type { LocationMapGlyphIconName, LocationMapObjectIconName } from '../map/locationMapIconNames';
import { LOCATION_MAP_OBJECT_KIND_TO_ICON_NAME } from '../map/locationMapPresentation.constants';
import { mapValuesStrict, recordKeys } from './locationPlacedObject.recordUtils';

/** Stable list of authored placed-object family ids — derived from registry keys (no manual mirror). */
export const LOCATION_PLACED_OBJECT_KIND_IDS = recordKeys(
  AUTHORED_PLACED_OBJECT_DEFINITIONS,
) as readonly LocationPlacedObjectKindId[];

const PLACED_KIND_ID_SET = new Set<string>(LOCATION_PLACED_OBJECT_KIND_IDS as readonly string[]);

/** Validates and narrows persisted `authoredPlaceKindId` strings for map cell objects. */
export function parseLocationPlacedObjectKindId(raw: string | undefined | null): LocationPlacedObjectKindId | null {
  if (raw == null || typeof raw !== 'string') return null;
  const t = raw.trim();
  return PLACED_KIND_ID_SET.has(t) ? (t as LocationPlacedObjectKindId) : null;
}

export type LocationPlacedObjectKindMeta = {
  label: string;
  description?: string;
  iconName?: LocationMapGlyphIconName;
  linkedScale?: LocationScaleId;
};

function defaultVariantOf(family: AuthoredPlacedObjectFamilyDefinition) {
  return family.variants[DEFAULT_PLACED_OBJECT_VARIANT_ID];
}

function toMeta(family: AuthoredPlacedObjectFamilyDefinition): LocationPlacedObjectKindMeta {
  const v = defaultVariantOf(family);
  return {
    label: v.label,
    description: v.description,
    iconName: v.iconName,
    ...(family.linkedScale !== undefined ? { linkedScale: family.linkedScale } : {}),
  };
}

/** Display metadata derived from {@link AUTHORED_PLACED_OBJECT_DEFINITIONS} (default variant per family). */
export const LOCATION_PLACED_OBJECT_KIND_META = mapValuesStrict(
  AUTHORED_PLACED_OBJECT_DEFINITIONS,
  toMeta,
) satisfies Record<LocationPlacedObjectKindId, LocationPlacedObjectKindMeta>;

export function getPlacedObjectDefinition(id: LocationPlacedObjectKindId): AuthoredPlacedObjectFamilyDefinition {
  return AUTHORED_PLACED_OBJECT_DEFINITIONS[id];
}

/** Explicit palette category for toolbar grouping — not persisted map identity. */
export function getPlacedObjectPaletteCategoryId(kind: LocationPlacedObjectKindId): PlacedObjectPaletteCategoryId {
  return AUTHORED_PLACED_OBJECT_DEFINITIONS[kind].category;
}

export function getPlacedObjectPaletteCategoryLabel(id: PlacedObjectPaletteCategoryId): string {
  return PLACED_OBJECT_PALETTE_CATEGORY_LABELS[id];
}

/** Sort key for palette sections (structure → … → vegetation). */
export function comparePlacedObjectPaletteCategories(
  a: PlacedObjectPaletteCategoryId,
  b: PlacedObjectPaletteCategoryId,
): number {
  return (
    PLACED_OBJECT_PALETTE_CATEGORY_ORDER.indexOf(a) - PLACED_OBJECT_PALETTE_CATEGORY_ORDER.indexOf(b)
  );
}

export function getPlacedObjectMeta(id: LocationPlacedObjectKindId): LocationPlacedObjectKindMeta {
  return LOCATION_PLACED_OBJECT_KIND_META[id];
}

export function getPlacedObjectRuntimeDefaults(
  kind: LocationPlacedObjectKindId,
): LocationPlacedObjectKindRuntimeDefaults {
  return AUTHORED_PLACED_OBJECT_DEFINITIONS[kind].runtime;
}

/** Interaction / transition hint when defined on the family; `undefined` if none. */
export function getPlacedObjectInteraction(
  kind: LocationPlacedObjectKindId,
): AuthoredPlacedObjectInteraction | undefined {
  const def = AUTHORED_PLACED_OBJECT_DEFINITIONS[kind];
  return 'interaction' in def ? def.interaction : undefined;
}

export function getPlacedObjectIconName(kind: LocationPlacedObjectKindId): LocationMapGlyphIconName {
  return defaultVariantOf(AUTHORED_PLACED_OBJECT_DEFINITIONS[kind]).iconName;
}

/** Persisted map cell object kind → object icon id (separate from authored place-tool glyphs). */
export function getMapObjectKindIconName(kind: LocationMapObjectKindId): LocationMapObjectIconName {
  return LOCATION_MAP_OBJECT_KIND_TO_ICON_NAME[kind];
}

export type PlacedObjectPaletteOption = {
  kind: LocationPlacedObjectKindId;
  label: string;
  description?: string;
  iconName: LocationMapGlyphIconName;
  linkedScale?: LocationScaleId;
  paletteCategory: PlacedObjectPaletteCategoryId;
};

/** Narrow DTOs for the place palette — derived from registry + `allowedScales` (via {@link getPlacedObjectKindsForScale}). */
export function getPlacedObjectPaletteOptionsForScale(
  scale: LocationScaleId,
): readonly PlacedObjectPaletteOption[] {
  const kinds = getPlacedObjectKindsForScale(scale);
  return kinds.map((kind) => {
    const family = getPlacedObjectDefinition(kind);
    const v = defaultVariantOf(family);
    return {
      kind,
      label: v.label,
      description: v.description,
      iconName: v.iconName,
      paletteCategory: family.category,
      ...(family.linkedScale !== undefined ? { linkedScale: family.linkedScale } : {}),
    };
  });
}

/** Authored placed kinds allowed on the place palette for this host scale. */
export function getPlacedObjectKindsForScale(scale: LocationScaleId): readonly LocationPlacedObjectKindId[] {
  if (!isValidLocationScaleId(scale)) return [];
  const out: LocationPlacedObjectKindId[] = [];
  for (const id of LOCATION_PLACED_OBJECT_KIND_IDS) {
    const allowed = AUTHORED_PLACED_OBJECT_DEFINITIONS[id].allowedScales as readonly LocationScaleId[];
    if (allowed.includes(scale)) {
      out.push(id);
    }
  }
  return out;
}
