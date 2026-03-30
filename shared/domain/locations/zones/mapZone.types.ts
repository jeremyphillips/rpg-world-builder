/**
 * MapZone: painted, named areas on a map (regions, districts, hazards, etc.).
 *
 * This is separate from `Location` records and from cell-linked child locations.
 * Long-term, geographic concepts like `region`, `subregion`, and `district` are modeled
 * here rather than as first-class linked location targets — see `mapZone.policy.ts` and
 * comments on `ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE`.
 */

export const MAP_ZONE_KIND_IDS = [
  'region',
  'subregion',
  'district',
  'hazard',
  'territory',
  'custom',
] as const;

export type MapZoneKindId = (typeof MAP_ZONE_KIND_IDS)[number];

/**
 * A painted zone on a specific map. Persistence and editor wiring are deferred; this is the
 * shared structural shape only.
 */
export type MapZone = {
  id: string;
  mapId: string;
  kind: MapZoneKindId;
  name: string;
  /** Grid cell ids (`makeGridCellId` / `"x,y"` convention) covered by this zone. */
  cellIds: string[];
};

export function isValidMapZoneKindId(value: string): value is MapZoneKindId {
  return (MAP_ZONE_KIND_IDS as readonly string[]).includes(value);
}
