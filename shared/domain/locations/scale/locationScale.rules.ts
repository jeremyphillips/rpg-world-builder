/**
 * Generic scale ordering helpers — structural only (`LOCATION_SCALE_ORDER`).
 * Parent *eligibility* uses explicit policy in `locationScale.policy.ts`, not rank alone.
 */
import { LOCATION_SCALE_ORDER } from '../location.constants';
import type { LocationScaleId } from '../location.types';
import { isAllowedParentScale } from './locationScale.policy';

export function locationScaleRank(scale: string): number {
  return LOCATION_SCALE_ORDER.indexOf(scale as LocationScaleId);
}

/** Alias for callers that prefer `get*` naming. */
export function getLocationScaleRank(scale: string): number {
  return locationScaleRank(scale);
}

export function isValidLocationScaleId(scale: string): scale is LocationScaleId {
  return LOCATION_SCALE_ORDER.includes(scale as LocationScaleId);
}

export function isWorldScale(scale: string): boolean {
  return scale === 'world';
}

/** Strictly finer in `LOCATION_SCALE_ORDER` (lower index = broader). */
export function isBroaderLocationScale(parentScale: string, childScale: string): boolean {
  const pi = locationScaleRank(parentScale);
  const ci = locationScaleRank(childScale);
  if (pi === -1 || ci === -1) return false;
  return pi < ci;
}

export function isSameOrBroaderLocationScale(a: string, b: string): boolean {
  const ai = locationScaleRank(a);
  const bi = locationScaleRank(b);
  if (ai === -1 || bi === -1) return false;
  return ai <= bi;
}

/**
 * @deprecated Use `isAllowedParentScale` from `locationScale.policy.ts` for parent validation.
 * Kept as an alias for explicit policy (no longer rank-only).
 */
export function isValidParentScaleForChild(parentScale: string, childScale: string): boolean {
  return isAllowedParentScale(parentScale, childScale);
}

/** No finer scale than room — room locations cannot have children. */
export function canLocationScaleHaveChildren(scale: string): boolean {
  return scale !== 'room';
}

/**
 * Locations that may appear as parent candidates for a child with the given scale.
 * Uses explicit allowed-parent-scale policy; ordering helpers are not sufficient alone.
 */
export function filterLocationsEligibleAsParent<T extends { scale: string }>(
  locations: T[],
  childScale: string,
): T[] {
  if (isWorldScale(childScale)) return [];
  return locations.filter((loc) => {
    if (!canLocationScaleHaveChildren(loc.scale)) return false;
    return isAllowedParentScale(loc.scale, childScale);
  });
}
