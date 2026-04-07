/**
 * Map cell authoring policy (linked locations + simple objects on a cell).
 *
 * Layers (do not conflate):
 * - `LOCATION_SCALE_RANK_ORDER_LEGACY` + `locationScale.rules.ts` — generic structural ranking.
 * - `locationScale.policy.ts` — parent/child assignment when saving a location.
 * - This module — what may be *linked from* or *placed on* a map cell for a *host* location/map.
 *   Building composes floors and hosts no cell objects; floor is the tactical interior object host.
 * - `zones/mapZone.policy.ts` — painted **MapZone** kinds per host scale (area tool); not links.
 *
 * Linked targets are **navigable child locations only** (world → city/site, etc.). Region/subregion/district
 * are no longer valid link targets — use MapZones on the parent map instead.
 *
 * **Host → allowed target scales** are built in {@link AUTHORED_PLACED_OBJECT_DEFINITIONS}
 * (`locationPlacedObject.registry.ts`): linked families (`linkedScale` × `allowedScales`) plus structural
 * interior edges; re-exported here as {@link ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE}.
 *
 * Future extensions (max links per cell, map-kind overrides, category exceptions) should live
 * here or in adjacent `locationMap*.policy.ts` files — keep maps explicit.
 */
import type { LocationScaleId } from '../location.types';
import type { LocationMapObjectKindId } from './locationMap.types';
import { isValidLocationScaleId } from '../scale/locationScale.rules';

import { ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.registry';

// --- A. Linked location from a cell (target scale allowed for this host scale) ---

export { ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE };

export function getAllowedLinkedLocationScalesForHostScale(
  hostScale: string,
): readonly LocationScaleId[] {
  if (!isValidLocationScaleId(hostScale)) return [];
  return ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE[hostScale as LocationScaleId];
}

export function canLinkLocationScaleFromHostScale(
  hostScale: string,
  targetScale: string,
): boolean {
  if (!isValidLocationScaleId(hostScale) || !isValidLocationScaleId(targetScale)) return false;
  const allowed = ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE[hostScale as LocationScaleId];
  return (allowed as readonly string[]).includes(targetScale);
}

export function isAllowedLinkedLocation<T extends { id: string; scale: string }>(
  hostLocation: T,
  targetLocation: T,
): boolean {
  if (hostLocation.id === targetLocation.id) return false;
  return canLinkLocationScaleFromHostScale(hostLocation.scale, targetLocation.scale);
}

export type LinkedLocationOptionContext = {
  /** When set, drops candidates whose `campaignId` differs (when present on the row). */
  campaignId?: string;
  /** Exclude this id (e.g. host location id, or cell’s current link). */
  excludeLocationId?: string;
};

/**
 * Candidate list should already be campaign-scoped when possible; `campaignId` adds a defensive filter
 * when rows include `campaignId`.
 */
export function getAllowedLinkedLocationOptions<
  T extends { id: string; scale: string; campaignId?: string },
>(hostLocation: T, candidateLocations: T[], ctx: LinkedLocationOptionContext = {}): T[] {
  const exclude = new Set<string>();
  if (ctx.excludeLocationId) exclude.add(ctx.excludeLocationId);
  exclude.add(hostLocation.id);

  return candidateLocations.filter((loc) => {
    if (exclude.has(loc.id)) return false;
    if (
      ctx.campaignId !== undefined &&
      loc.campaignId !== undefined &&
      loc.campaignId !== ctx.campaignId
    ) {
      return false;
    }
    return canLinkLocationScaleFromHostScale(hostLocation.scale, loc.scale);
  });
}

// --- B. Simple objects on a cell (kinds allowed for this host location scale) ---

/** Host location scale → object kinds allowed on cells of maps for that location. */
export const ALLOWED_MAP_OBJECT_KINDS_BY_HOST_SCALE: Record<
  LocationScaleId,
  readonly LocationMapObjectKindId[]
> = {
  world: ['marker'],
  region: ['marker'],
  subregion: ['marker'],
  city: ['marker', 'table'],
  district: ['marker', 'table'],
  site: ['marker', 'table', 'treasure'],
  building: [],
  floor: ['table', 'door', 'treasure', 'stairs'],
  room: ['marker', 'table', 'door', 'treasure'],
};

export function getAllowedObjectKindsForHostScale(
  hostScale: string,
): readonly LocationMapObjectKindId[] {
  if (!isValidLocationScaleId(hostScale)) return [];
  return ALLOWED_MAP_OBJECT_KINDS_BY_HOST_SCALE[hostScale as LocationScaleId];
}

export function canPlaceObjectKindOnHostScale(
  hostScale: string,
  objectKind: string,
): boolean {
  if (!isValidLocationScaleId(hostScale)) return false;
  const allowed = ALLOWED_MAP_OBJECT_KINDS_BY_HOST_SCALE[hostScale as LocationScaleId];
  return (allowed as readonly string[]).includes(objectKind);
}
