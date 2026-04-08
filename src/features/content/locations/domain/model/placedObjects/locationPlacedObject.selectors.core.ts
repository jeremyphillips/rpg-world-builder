/**
 * Placed-object selectors with **no** Vite-only raster imports — safe for Node (e.g. `locationPlacedObject.runtime`
 * used by `buildEncounterSpaceFromLocationMap` on the server). UI/palette URLs live in
 * {@link ./locationPlacedObject.selectors.ui}.
 */
import type {
  LocationMapCellObjectEntry,
  LocationMapObjectKindId,
  LocationScaleId,
} from '@/shared/domain/locations';
import { isValidLocationScaleId } from '@/shared/domain/locations/scale/locationScale.rules';
import {
  type FamilyWithVariants,
  resolveFamilyVariant,
} from '@/shared/domain/registry/familyVariantResolve';

import type {
  PlacedObjectCellAnchorKind,
  PlacedObjectFootprintFeet,
} from '@/shared/domain/locations/map/placedObjectFootprint.types';

import {
  AUTHORED_PLACED_OBJECT_DEFINITIONS,
  DEFAULT_PLACED_OBJECT_CELL_ANCHOR,
  PLACED_OBJECT_PALETTE_CATEGORY_LABELS,
  PLACED_OBJECT_PALETTE_CATEGORY_ORDER,
  type AuthoredPlacedObjectFamilyDefinition,
  type AuthoredPlacedObjectPlacementMode,
  type AuthoredPlacedObjectInteraction,
  type AuthoredPlacedObjectVariantDefinition,
  type AuthoredPlacedObjectVariantPresentation,
  type LocationPlacedObjectKindId,
  type LocationPlacedObjectKindRuntimeDefaults,
  type PlacedObjectPaletteCategoryId,
} from './locationPlacedObject.registry';
import type { LocationMapObjectIconName } from '../map/locationMapIconNames';
import { LOCATION_MAP_OBJECT_KIND_TO_ICON_NAME } from '../map/locationMapPresentation.constants';
import { recordKeys } from './locationPlacedObject.recordUtils';

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
  /** Bundled PNG URL for place palette / tray (default variant). */
  previewImageUrl: string;
  linkedScale?: LocationScaleId;
};

export function variantRecord(
  family: AuthoredPlacedObjectFamilyDefinition,
): Record<string, AuthoredPlacedObjectVariantDefinition> {
  return family.variants as Record<string, AuthoredPlacedObjectVariantDefinition>;
}

function variantDefinitionForFamily(
  family: AuthoredPlacedObjectFamilyDefinition,
  variantId: string,
): AuthoredPlacedObjectVariantDefinition | undefined {
  return variantRecord(family)[variantId];
}

/** Registry footprint in feet for a concrete family + variant, when defined. */
export function getPlacedObjectFootprintForFamilyVariant(
  kind: LocationPlacedObjectKindId,
  variantId: string,
): PlacedObjectFootprintFeet | undefined {
  return variantDefinitionForFamily(AUTHORED_PLACED_OBJECT_DEFINITIONS[kind], variantId)?.footprint;
}

/** Resolved cell placement anchor (Phase 5); defaults when omitted on the variant row. */
export function getPlacedObjectCellAnchorForFamilyVariant(
  kind: LocationPlacedObjectKindId,
  variantId: string,
): PlacedObjectCellAnchorKind {
  return (
    variantDefinitionForFamily(AUTHORED_PLACED_OBJECT_DEFINITIONS[kind], variantId)?.cellAnchor ??
    DEFAULT_PLACED_OBJECT_CELL_ANCHOR
  );
}

/** True when `variantId` is a key in the family’s `variants` map (not the same as {@link normalizeVariantIdForFamily}). */
export function isVariantIdValidForFamily(kind: LocationPlacedObjectKindId, variantId: string): boolean {
  return variantId in AUTHORED_PLACED_OBJECT_DEFINITIONS[kind].variants;
}

/**
 * Presentation metadata for a concrete family + variant (persisted wire uses `variantId`).
 * Pass a **registry-valid** variant id for `kind` — this does **not** apply default-variant fallback.
 * For persisted or possibly invalid ids, use {@link resolvePlacedObjectVariant} first.
 */
export function getPlacedObjectVariantPresentation(
  kind: LocationPlacedObjectKindId,
  variantId: string,
): AuthoredPlacedObjectVariantPresentation | undefined {
  return variantDefinitionForFamily(AUTHORED_PLACED_OBJECT_DEFINITIONS[kind], variantId)?.presentation;
}

/**
 * Human label for a concrete variant (inspector object title when identity is known).
 * Pass a **registry-valid** variant id — no default fallback. Prefer {@link resolvePlacedObjectVariant} when the id
 * may be missing or invalid.
 */
export function getPlacedObjectVariantLabel(kind: LocationPlacedObjectKindId, variantId: string): string | undefined {
  return variantDefinitionForFamily(AUTHORED_PLACED_OBJECT_DEFINITIONS[kind], variantId)?.label;
}

/**
 * Sole registry source for the primary palette variant id — always use this (not a literal `variants.default` key).
 * Resolution of label/icon/meta: `variants[getDefaultVariantIdForFamily(kind)]`.
 */
export function getDefaultVariantIdForFamily(kind: LocationPlacedObjectKindId): string {
  return AUTHORED_PLACED_OBJECT_DEFINITIONS[kind].defaultVariantId;
}

/** Count of variants in the family (for palette affordances). */
export function getVariantCountForFamily(kind: LocationPlacedObjectKindId): number {
  return recordKeys(variantRecord(AUTHORED_PLACED_OBJECT_DEFINITIONS[kind])).length;
}

/**
 * Resolves a family-scoped variant id, falling back to {@link getDefaultVariantIdForFamily} when missing or invalid.
 * Delegates to {@link resolveFamilyVariant}.
 */
export function normalizeVariantIdForFamily(
  kind: LocationPlacedObjectKindId,
  variantId: string | undefined | null,
): string {
  return resolveFamilyVariant(
    AUTHORED_PLACED_OBJECT_DEFINITIONS[kind] as FamilyWithVariants<AuthoredPlacedObjectVariantDefinition>,
    variantId,
  ).resolvedVariantId;
}

/**
 * Resolves a placed-object family + optional requested variant id to the canonical variant row and id.
 * Use when `variantId` may be missing, invalid, or from persisted wire data.
 */
export function resolvePlacedObjectVariant(
  kind: LocationPlacedObjectKindId,
  requestedVariantId: string | null | undefined,
): { resolvedVariantId: string; variant: AuthoredPlacedObjectVariantDefinition } {
  return resolveFamilyVariant(
    AUTHORED_PLACED_OBJECT_DEFINITIONS[kind] as FamilyWithVariants<AuthoredPlacedObjectVariantDefinition>,
    requestedVariantId,
  );
}

/**
 * Resolves registry placed kind for inspector metadata: prefers persisted `authoredPlaceKindId`, else
 * non-ambiguous legacy `kind` (table / stairs / treasure).
 */
export function resolvePlacedObjectKindForCellObject(
  obj: Pick<LocationMapCellObjectEntry, 'kind' | 'authoredPlaceKindId'>,
): LocationPlacedObjectKindId | null {
  const stored = parseLocationPlacedObjectKindId(obj.authoredPlaceKindId);
  if (stored) return stored;
  switch (obj.kind) {
    case 'table':
      return 'table';
    case 'stairs':
      return 'stairs';
    case 'treasure':
      return 'treasure';
    default:
      return null;
  }
}

export function getPlacedObjectDefinition(id: LocationPlacedObjectKindId): AuthoredPlacedObjectFamilyDefinition {
  return AUTHORED_PLACED_OBJECT_DEFINITIONS[id];
}

/** True for registry families with `linkedScale` (city/site/building markers); cell-level `linkedLocationByCellId` pairs with these. */
export function cellObjectAnchorsCellLinkedLocation(
  obj: Pick<LocationMapCellObjectEntry, 'kind' | 'authoredPlaceKindId'>,
): boolean {
  const kind = resolvePlacedObjectKindForCellObject(obj);
  if (!kind) return false;
  return getPlacedObjectDefinition(kind).linkedScale !== undefined;
}

/** Default variant’s `presentation` for first-pass inspector metadata (variant not on wire for many objects). */
export function getDefaultVariantPresentationForKind(
  kind: LocationPlacedObjectKindId,
): AuthoredPlacedObjectVariantPresentation | undefined {
  const family = AUTHORED_PLACED_OBJECT_DEFINITIONS[kind];
  const v = variantRecord(family)[family.defaultVariantId];
  return v?.presentation;
}

/** `variants[family.defaultVariantId]` — every variant entry is concrete; default is selected only via `defaultVariantId`. */
export function defaultVariantEntryOf(family: AuthoredPlacedObjectFamilyDefinition) {
  return variantRecord(family)[family.defaultVariantId]!;
}

/** Registry `placementMode` — cell objects vs edge boundary features (`edgeEntries`). */
export function getPlacementModeForFamily(kind: LocationPlacedObjectKindId): AuthoredPlacedObjectPlacementMode {
  return AUTHORED_PLACED_OBJECT_DEFINITIONS[kind].placementMode;
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

/** Persisted map cell object kind → object icon id (separate from authored place-tool glyphs). */
export function getMapObjectKindIconName(kind: LocationMapObjectKindId): LocationMapObjectIconName {
  return LOCATION_MAP_OBJECT_KIND_TO_ICON_NAME[kind];
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

export { DEFAULT_PLACED_OBJECT_VARIANT_ID } from './locationPlacedObject.registry';
