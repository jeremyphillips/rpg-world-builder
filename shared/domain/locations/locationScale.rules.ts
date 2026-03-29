/**
 * Pure scale hierarchy rules for locations (shared client + server).
 * Uses LOCATION_SCALE_ORDER as structural source of truth.
 */
import { LOCATION_SCALE_ORDER } from './location.constants';
import type { LocationScaleId } from './location.types';

export function locationScaleRank(scale: string): number {
  return LOCATION_SCALE_ORDER.indexOf(scale as LocationScaleId);
}

export function isValidLocationScaleId(scale: string): scale is LocationScaleId {
  return LOCATION_SCALE_ORDER.includes(scale as LocationScaleId);
}

export function isWorldScale(scale: string): boolean {
  return scale === 'world';
}

/** Parent index must be strictly less than child (broader than child). */
export function isValidParentScaleForChild(parentScale: string, childScale: string): boolean {
  const pi = locationScaleRank(parentScale);
  const ci = locationScaleRank(childScale);
  if (pi === -1 || ci === -1) return false;
  return pi < ci;
}

/** No finer scale than room — room locations cannot have children. */
export function canLocationScaleHaveChildren(scale: string): boolean {
  return scale !== 'room';
}

/**
 * Locations that may appear as parent candidates for a child with the given scale.
 * Excludes: world as child (no parents); invalid nesting; room (cannot have children).
 */
export function filterLocationsEligibleAsParent<T extends { scale: string }>(
  locations: T[],
  childScale: string,
): T[] {
  if (isWorldScale(childScale)) return [];
  return locations.filter((loc) => {
    if (!canLocationScaleHaveChildren(loc.scale)) return false;
    return isValidParentScaleForChild(loc.scale, childScale);
  });
}
