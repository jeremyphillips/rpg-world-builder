/**
 * Centralized dependent-field policy for location forms (client + mapper).
 * Source of truth: `locationScaleField.policy` in shared domain.
 * Server enforces the same invariants.
 */
import {
  getAllowedCellUnitOptionsForScale,
  getAllowedCategoryOptionsForScale,
  getAllowedMapKindsForScale,
  getDefaultCellUnitForScalePolicy,
  getLocationScaleFieldPolicy,
  isCategoryAllowedForScale,
  isCellUnitAllowedForScale,
  normalizeCategoryForScale,
  normalizeGridCellUnitForScale,
  normalizeGridGeometryForScale,
} from '@/shared/domain/locations';
import type { LocationMapKindId } from '@/shared/domain/locations';
import { getAllowedParentLocationOptions } from '@/shared/domain/locations';
import { isWorldScale } from '@/shared/domain/locations';
import type { LocationBuildingPrimarySubtypeId } from '@/shared/domain/locations';
import type { Location } from '@/features/content/locations/domain/model/location';
import { getAllowedLocationBuildingPrimarySubtypesForType } from '@/features/content/locations/domain/model/building/locationBuilding.policy';
import type { LocationFormValues } from '../types/locationForm.types';

export { getAllowedCellUnitOptionsForScale, getAllowedCategoryOptionsForScale };

export function shouldClearCategoryForScale(scale: string): boolean {
  return getLocationScaleFieldPolicy(scale).allowedCategories.length === 0;
}

export function shouldClearParentForScale(scale: string): boolean {
  return getLocationScaleFieldPolicy(scale).hideParent === true || isWorldScale(scale);
}

/** Empty category is allowed when optional; otherwise must satisfy scale policy. */
export function isCategoryValueAllowedForScale(categoryTrimmed: string, scale: string): boolean {
  if (categoryTrimmed === '') return true;
  return isCategoryAllowedForScale(categoryTrimmed, scale);
}

export function isParentIdAllowedForScale(
  parentIdTrimmed: string,
  childScale: string,
  locations: Location[] | undefined,
  excludeLocationId?: string,
): boolean {
  if (parentIdTrimmed === '') return true;
  if (getLocationScaleFieldPolicy(childScale).hideParent) return false;
  if (isWorldScale(childScale)) return false;
  if (!locations || locations.length === 0) return true;
  const eligible = getAllowedParentLocationOptions(locations, childScale, excludeLocationId);
  return eligible.some((l) => l.id === parentIdTrimmed);
}

export function getDefaultCellUnitForScale(scale: string): string {
  return getDefaultCellUnitForScalePolicy(scale);
}

/** Returns current unit if allowed, otherwise the default for the scale. */
export function getSanitizedCellUnitForScale(currentUnit: string, scale: string): string {
  const trimmed = currentUnit.trim();
  if (trimmed && isCellUnitAllowedForScale(trimmed, scale)) return trimmed;
  return normalizeGridCellUnitForScale('', scale);
}

export { getDefaultMapKindForScale } from '@/shared/domain/locations';

export function isMapKindAllowedForScale(kind: string, scale: string): boolean {
  return getAllowedMapKindsForScale(scale).includes(kind as LocationMapKindId);
}

export function getFilteredParentLocationsForChildScale(
  locations: Location[],
  childScale: string,
  excludeLocationId?: string,
): Location[] {
  return getAllowedParentLocationOptions(locations, childScale, excludeLocationId);
}

export type LocationFormSanitizeContext = {
  scale: string;
  locations?: Location[];
  excludeLocationId?: string;
};

const EMPTY_BUILDING_FORM: Pick<
  LocationFormValues,
  | 'buildingPrimaryType'
  | 'buildingPrimarySubtype'
  | 'buildingFunctions'
  | 'buildingIsPublicStorefront'
  | 'buildingOwnerRefs'
  | 'buildingStaffRefs'
> = {
  buildingPrimaryType: '',
  buildingPrimarySubtype: '',
  buildingFunctions: [],
  buildingIsPublicStorefront: false,
  buildingOwnerRefs: [],
  buildingStaffRefs: [],
};

/**
 * Clears or corrects building profile form fields when scale is not `building`,
 * when Building Type is cleared, or when Building Subtype is not allowed for the type.
 */
export function sanitizeBuildingProfileFormFields(
  values: LocationFormValues,
  ctxScale: string,
): Partial<LocationFormValues> {
  const patch: Partial<LocationFormValues> = {};
  const scale = String(ctxScale ?? '').trim();

  if (scale !== 'building') {
    if (
      values.buildingPrimaryType ||
      values.buildingPrimarySubtype ||
      (values.buildingFunctions?.length ?? 0) > 0 ||
      values.buildingIsPublicStorefront ||
      (values.buildingOwnerRefs?.length ?? 0) > 0 ||
      (values.buildingStaffRefs?.length ?? 0) > 0
    ) {
      return { ...EMPTY_BUILDING_FORM };
    }
    return patch;
  }

  const t = String(values.buildingPrimaryType ?? '').trim();
  const st = String(values.buildingPrimarySubtype ?? '').trim();

  if (!t) {
    if (st) patch.buildingPrimarySubtype = '';
    if ((values.buildingFunctions?.length ?? 0) > 0) {
      patch.buildingFunctions = [];
    }
    return patch;
  }

  const allowed = getAllowedLocationBuildingPrimarySubtypesForType(t);
  if (st && !allowed.includes(st as LocationBuildingPrimarySubtypeId)) {
    patch.buildingPrimarySubtype = '';
  }
  return patch;
}

/**
 * Returns a minimal patch to bring form values in line with scale + optional parent list.
 */
export function sanitizeLocationFormValues(
  values: LocationFormValues,
  ctx: LocationFormSanitizeContext,
): Partial<LocationFormValues> {
  const patch: Partial<LocationFormValues> = {};
  const scale = ctx.scale;

  const prevCat = String(values.category ?? '').trim();
  const nextCat = normalizeCategoryForScale(prevCat, scale);
  if (nextCat !== prevCat) {
    patch.category = nextCat;
  }

  const pid = String(values.parentId ?? '').trim();
  if (!isParentIdAllowedForScale(pid, scale, ctx.locations, ctx.excludeLocationId)) {
    patch.parentId = '';
  }

  const curUnit = String(values.gridCellUnit ?? '').trim();
  const nextUnit = normalizeGridCellUnitForScale(curUnit, scale);
  if (nextUnit !== curUnit) {
    patch.gridCellUnit = nextUnit;
  }

  const curGeometry = String(values.gridGeometry ?? '').trim();
  const nextGeometry = normalizeGridGeometryForScale(curGeometry, scale);
  if (nextGeometry !== curGeometry) {
    patch.gridGeometry = nextGeometry;
  }

  const buildingPatch = sanitizeBuildingProfileFormFields(values, scale);
  return { ...patch, ...buildingPatch };
}

/** When scale changes (user or programmatic), apply the same rules with optional campaign locations. */
export function sanitizeLocationDraftForScale(
  values: LocationFormValues,
  nextScale: string,
  ctx: Omit<LocationFormSanitizeContext, 'scale'> = {},
): Partial<LocationFormValues> {
  return sanitizeLocationFormValues(values, { scale: nextScale, ...ctx });
}
