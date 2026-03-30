/**
 * Which MapZone kinds may be authored on maps for a given **host location scale**.
 *
 * Separate from:
 * - `LOCATION_SCALE_FIELD_POLICY` (form fields, geometry, cell unit)
 * - `ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE` (cell-linked child locations)
 * - feature `mapContent` policy (fills, paths, placed objects)
 *
 * Future: zones are authored with a paint / area tool (not cell-link picks).
 */
import type { LocationScaleId } from '../location.types';
import { isValidLocationScaleId } from '../scale/locationScale.rules';
import type { MapZoneKindId } from './mapZone.types';

/**
 * Host location scale → MapZone kinds allowed on that host’s maps (phase 1).
 * Empty arrays mean no zone authoring at that scale in policy yet.
 *
 * `hazard`, `territory`, and `custom` are reserved in vocabulary; host assignments can grow
 * in later phases without changing `MapZoneKindId`.
 */
export const ALLOWED_MAP_ZONE_KINDS_BY_HOST_SCALE: Record<
  LocationScaleId,
  readonly MapZoneKindId[]
> = {
  world: ['region', 'subregion'],
  region: [],
  subregion: [],
  city: ['district'],
  district: [],
  site: [],
  building: [],
  floor: [],
  room: [],
};

export function getAllowedMapZoneKindsForHostScale(
  hostScale: string,
): readonly MapZoneKindId[] {
  if (!isValidLocationScaleId(hostScale)) return [];
  return ALLOWED_MAP_ZONE_KINDS_BY_HOST_SCALE[hostScale as LocationScaleId];
}

export function canHostMapZoneKind(hostScale: string, kind: string): boolean {
  if (!isValidLocationScaleId(hostScale)) return false;
  const allowed = ALLOWED_MAP_ZONE_KINDS_BY_HOST_SCALE[hostScale as LocationScaleId];
  return (allowed as readonly string[]).includes(kind);
}
