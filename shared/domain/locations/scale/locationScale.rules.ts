/**
 * Scale helpers: **which id means what**, ordering, and broadness — not form field policy.
 *
 * - **`isContentLocationScaleId`** — first-class **new authoring** content scales only (`world`…`room`).
 * - **`isLegacyMapZoneLocationScaleId`** — `region` / `subregion` / `district` persisted as scale (compatibility).
 * - **`isValidLocationScaleId`** — any member of `LOCATION_SCALE_IDS_WITH_LEGACY` (API/DB persistence union).
 * - **Rank** (`locationScaleRank`, `getLocationScaleRank`) uses `LOCATION_SCALE_RANK_ORDER_LEGACY` **only** for
 *   stable sort/compare of persisted rows — not for parent validation (use `locationScale.policy.ts`).
 */
import {
  CONTENT_LOCATION_SCALE_IDS,
  LOCATION_MAP_ZONE_KIND_IDS,
  LOCATION_SCALE_RANK_ORDER_LEGACY,
} from '../location.constants';
import type {
  ContentLocationScaleId,
  LegacyMapZoneLocationScaleId,
  LocationScaleId,
} from '../location.types';
import { isAllowedParentScale } from './locationScale.policy';

const LEGACY_RANK = LOCATION_SCALE_RANK_ORDER_LEGACY as readonly string[];

const CONTENT_SET = new Set<string>(CONTENT_LOCATION_SCALE_IDS as readonly string[]);
const LEGACY_ZONE_SET = new Set<string>(LOCATION_MAP_ZONE_KIND_IDS as readonly string[]);

export function isContentLocationScaleId(scale: string): scale is ContentLocationScaleId {
  return CONTENT_SET.has(scale);
}

export function isLegacyMapZoneLocationScaleId(scale: string): scale is LegacyMapZoneLocationScaleId {
  return LEGACY_ZONE_SET.has(scale);
}

export function locationScaleRank(scale: string): number {
  return LEGACY_RANK.indexOf(scale);
}

/** Alias for callers that prefer `get*` naming. */
export function getLocationScaleRank(scale: string): number {
  return locationScaleRank(scale);
}

/** True if `scale` is any persisted/API scale id (content + legacy map-zone-as-scale). */
export function isValidLocationScaleId(scale: string): scale is LocationScaleId {
  return LEGACY_RANK.includes(scale);
}

export function isWorldScale(scale: string): boolean {
  return scale === 'world';
}

/** Strictly finer in legacy rank order (lower index = broader). */
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
