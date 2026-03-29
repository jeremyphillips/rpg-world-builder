/**
 * Centralized dependent-field policy for location forms (client + mapper).
 * Server enforces the same invariants; keep helpers pure and small.
 */
import {
  CELL_UNITS_BY_KIND,
  getAllowedMapKindsForScale,
  LOCATION_CATEGORY_IDS,
  mapKindForLocationScale,
} from '@/shared/domain/locations';
import type { LocationMapKindId } from '@/shared/domain/locations';
import {
  filterLocationsEligibleAsParent,
  isWorldScale,
} from '@/shared/domain/locations/locationScale.rules';
import type { Location } from '@/features/content/locations/domain/types';
import type { LocationFormValues } from '../types/locationForm.types';

export function shouldClearCategoryForScale(scale: string): boolean {
  return isWorldScale(scale);
}

export function shouldClearParentForScale(scale: string): boolean {
  return isWorldScale(scale);
}

/** Empty category is always allowed (optional field). */
export function isCategoryValueAllowedForScale(categoryTrimmed: string, scale: string): boolean {
  if (categoryTrimmed === '') return true;
  if (isWorldScale(scale)) return false;
  return (LOCATION_CATEGORY_IDS as readonly string[]).includes(categoryTrimmed);
}

/**
 * When `locations` is omitted/empty, parent cannot be validated — treat as permitted
 * (server remains authoritative). When locations are loaded, parent must be in the eligible set.
 */
export function isParentIdAllowedForScale(
  parentIdTrimmed: string,
  childScale: string,
  locations: Location[] | undefined,
  excludeLocationId?: string,
): boolean {
  if (parentIdTrimmed === '') return true;
  if (isWorldScale(childScale)) return false;
  if (!locations || locations.length === 0) return true;
  const eligible = filterLocationsEligibleAsParent(locations, childScale).filter(
    (l) => l.id !== excludeLocationId,
  );
  return eligible.some((l) => l.id === parentIdTrimmed);
}

export function getAllowedCellUnitOptionsForScale(scale: string): { value: string; label: string }[] {
  const kind = mapKindForLocationScale(scale);
  return CELL_UNITS_BY_KIND[kind].map((u) => ({ value: u, label: u }));
}

export function getDefaultCellUnitForScale(scale: string): string {
  const opts = getAllowedCellUnitOptionsForScale(scale);
  return opts[0]?.value ?? '5ft';
}

/** Returns current unit if allowed, otherwise the default for the scale. */
export function getSanitizedCellUnitForScale(currentUnit: string, scale: string): string {
  const trimmed = currentUnit.trim();
  const allowed = getAllowedCellUnitOptionsForScale(scale);
  if (trimmed && allowed.some((o) => o.value === trimmed)) return trimmed;
  return getDefaultCellUnitForScale(scale);
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
  const eligible = filterLocationsEligibleAsParent(locations, childScale);
  if (!excludeLocationId) return eligible;
  return eligible.filter((l) => l.id !== excludeLocationId);
}

export type LocationFormSanitizeContext = {
  scale: string;
  locations?: Location[];
  excludeLocationId?: string;
};

/**
 * Returns a minimal patch to bring form values in line with scale + optional parent list.
 */
export function sanitizeLocationFormValues(
  values: LocationFormValues,
  ctx: LocationFormSanitizeContext,
): Partial<LocationFormValues> {
  const patch: Partial<LocationFormValues> = {};
  const scale = ctx.scale;

  const cat = String(values.category ?? '').trim();
  if (!isCategoryValueAllowedForScale(cat, scale)) {
    patch.category = '';
  }

  const pid = String(values.parentId ?? '').trim();
  if (!isParentIdAllowedForScale(pid, scale, ctx.locations, ctx.excludeLocationId)) {
    patch.parentId = '';
  }

  const curUnit = String(values.gridCellUnit ?? '').trim();
  const nextUnit = getSanitizedCellUnitForScale(curUnit, scale);
  if (nextUnit !== curUnit) {
    patch.gridCellUnit = nextUnit;
  }

  return patch;
}

/** When scale changes (user or programmatic), apply the same rules with optional campaign locations. */
export function sanitizeLocationDraftForScale(
  values: LocationFormValues,
  nextScale: string,
  ctx: Omit<LocationFormSanitizeContext, 'scale'> = {},
): Partial<LocationFormValues> {
  return sanitizeLocationFormValues(values, { scale: nextScale, ...ctx });
}
