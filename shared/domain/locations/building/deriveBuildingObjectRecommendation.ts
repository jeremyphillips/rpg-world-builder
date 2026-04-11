import type { LocationBuildingFormClassId, LocationBuildingMeta } from './locationBuilding.types';

/** Building family variant ids for city/site map markers (urban footprint). */
export const BUILDING_MAP_VARIANT_COMPACT = 'compact_1cell' as const;
export const BUILDING_MAP_VARIANT_WIDE = 'wide_2cell' as const;

export type DeriveBuildingObjectRecommendationInput = {
  meta: Pick<
    LocationBuildingMeta,
    'primaryType' | 'primarySubtype' | 'functions' | 'isPublicStorefront'
  >;
  /** When set (e.g. create/edit), wins over heuristic inference from `meta`. */
  buildingFormClass?: LocationBuildingFormClassId;
};

export type DeriveBuildingObjectRecommendationResult = {
  buildingFormId: LocationBuildingFormClassId;
  recommendedMapVariantIds: string[];
  /** Optional note for debugging or future UI. */
  notes?: string;
};

function isCompactForm(form: LocationBuildingFormClassId): boolean {
  return form === 'compact_small' || form === 'compact_medium';
}

/**
 * Map variants allowed for a structural form class (v1: compact footprint vs wide envelope).
 */
export function getCompatibleMapVariantsForBuildingForm(
  formClass: LocationBuildingFormClassId,
): string[] {
  return isCompactForm(formClass) ? [BUILDING_MAP_VARIANT_COMPACT] : [BUILDING_MAP_VARIANT_WIDE];
}

/**
 * Infer structural form from semantic identity when the author did not pick a form class.
 *
 * v1 heuristics (compact vs wide):
 * - Residence / house-like → compact_small
 * - Craft / trade / blacksmith / shop → wide_medium
 * - Tavern / inn / lodging / food-drink → wide_medium or wide_large
 * - Warehouse / storage → wide_large
 * - Civic / temple / institutional → wide_medium
 */
function inferBuildingFormClassFromMeta(
  meta: DeriveBuildingObjectRecommendationInput['meta'],
): LocationBuildingFormClassId {
  const t = meta.primaryType;
  const st = meta.primarySubtype;
  const fn = meta.functions ?? [];

  const has = (id: (typeof fn)[number]) => fn.includes(id);

  if (st === 'warehouse' || has('storage')) {
    return 'wide_large';
  }
  if (
    st === 'blacksmith' ||
    st === 'workshop' ||
    st === 'apothecary' ||
    st === 'general-store' ||
    st === 'bakery' ||
    has('trade') ||
    has('craft')
  ) {
    return 'wide_medium';
  }
  if (st === 'tavern' || st === 'brothel' || has('food-drink') || has('lodging')) {
    return 'wide_medium';
  }
  if (st === 'inn' || has('hospitality-service')) {
    return 'wide_large';
  }
  if (t === 'residence' || st === 'house' || st === 'apartment' || has('residential')) {
    return 'compact_small';
  }
  if (st === 'manor') {
    return 'compact_medium';
  }
  if (
    t === 'temple' ||
    t === 'civic' ||
    t === 'military' ||
    t === 'guild' ||
    st === 'shrine' ||
    st === 'temple' ||
    st === 'cathedral' ||
    st === 'town-hall' ||
    st === 'guard-post' ||
    st === 'guild-house'
  ) {
    return 'wide_medium';
  }
  if (t === 'industrial') {
    return 'wide_medium';
  }
  return 'compact_medium';
}

/**
 * Derives structural **form class** and suggested **map footprint variant** ids for a building marker.
 * Pure helper — does not persist; map authoring remains authoritative.
 */
export function deriveBuildingObjectRecommendation(
  input: DeriveBuildingObjectRecommendationInput,
): DeriveBuildingObjectRecommendationResult {
  const buildingFormId =
    input.buildingFormClass ?? inferBuildingFormClassFromMeta(input.meta);
  const recommendedMapVariantIds = getCompatibleMapVariantsForBuildingForm(buildingFormId);
  const notes =
    input.buildingFormClass == null
      ? 'buildingFormId inferred from buildingMeta'
      : 'buildingFormId from explicit buildingFormClass';

  return { buildingFormId, recommendedMapVariantIds, notes };
}
