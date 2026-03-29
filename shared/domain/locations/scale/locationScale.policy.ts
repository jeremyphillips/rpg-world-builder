/**
 * Explicit location scale *business* policy (parent eligibility, etc.).
 *
 * For generic structural comparisons (rank, broader/finer), use `locationScale.rules.ts`
 * and `LOCATION_SCALE_ORDER` — ordering alone does not encode which parent scales are valid.
 */
import { LOCATION_SCALE_ORDER } from '../location.constants';
import type { LocationScaleId } from '../location.types';

/** Child scale → parent scales that may be assigned (empty = root only, e.g. world). */
export const ALLOWED_PARENT_SCALES_BY_SCALE: Record<
  LocationScaleId,
  readonly LocationScaleId[]
> = {
  world: [],
  region: ['world'],
  subregion: ['region'],
  /** Macro place: may sit under world (single-world campaigns) or regional geography. */
  city: ['world', 'region', 'subregion'],
  district: ['city'],
  /** Sites can sit under macro area, urban fabric, or district. */
  site: ['region', 'subregion', 'city', 'district'],
  building: ['site', 'district', 'city'],
  floor: ['building'],
  room: ['floor', 'building'],
};

function isKnownScale(scale: string): scale is LocationScaleId {
  return (LOCATION_SCALE_ORDER as readonly string[]).includes(scale);
}

export function getAllowedParentScalesForScale(childScale: string): readonly LocationScaleId[] {
  if (!isKnownScale(childScale)) return [];
  return ALLOWED_PARENT_SCALES_BY_SCALE[childScale];
}

export function isAllowedParentScale(parentScale: string, childScale: string): boolean {
  if (!isKnownScale(parentScale) || !isKnownScale(childScale)) return false;
  const allowed = ALLOWED_PARENT_SCALES_BY_SCALE[childScale as LocationScaleId];
  return (allowed as readonly string[]).includes(parentScale);
}

export function isAllowedParentLocation<T extends { scale: string }>(
  parent: T,
  childScale: string,
): boolean {
  return isAllowedParentScale(parent.scale, childScale);
}

/**
 * Campaign locations eligible as parent for a child of `childScale`.
 * Excludes: world children (no parents); scales that cannot host children (room); self on edit via `excludeLocationId`.
 */
export function getAllowedParentLocationOptions<T extends { id: string; scale: string }>(
  locations: T[],
  childScale: string,
  excludeLocationId?: string,
): T[] {
  if (childScale === 'world') return [];
  return locations.filter((loc) => {
    if (excludeLocationId && loc.id === excludeLocationId) return false;
    if (loc.scale === 'room') return false;
    return isAllowedParentScale(loc.scale, childScale);
  });
}
