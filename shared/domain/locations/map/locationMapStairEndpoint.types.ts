/**
 * Staircase **endpoint** authoring for floor maps (`kind === 'stairs'` on {@link LocationMapCellObjectEntry}).
 *
 * Phase 1 stores **intent** and lightweight metadata for a future vertical link between **floor** locations.
 * Full **paired** endpoint records, **cell-level** destination picking, **combat traversal**, and **cross-floor
 * pathfinding** are **not** implemented yet — this module is intentional groundwork only.
 */

/** Default direction when placing a new stairs object in the editor. */
export const LOCATION_MAP_STAIR_ENDPOINT_DEFAULT_DIRECTION = 'both' as const;

export const LOCATION_MAP_STAIR_ENDPOINT_DIRECTION_IDS = ['up', 'down', 'both'] as const;

export type LocationMapStairEndpointDirection = (typeof LOCATION_MAP_STAIR_ENDPOINT_DIRECTION_IDS)[number];

/**
 * Authored configuration for one **stair endpoint** on a floor map cell.
 *
 * A placed stairs object is **one endpoint** of a future vertical connection, not the whole connection.
 * {@link LocationMapStairEndpointLinkStatus} and {@link deriveLocationMapStairEndpointLinkStatus} describe
 * completeness for editors and later traversal — **paired** sync between two endpoints is still **TODO**.
 */
export type LocationMapStairEndpointAuthoring = {
  /**
   * Intended travel direction from this cell’s perspective (authoring hint).
   * Does not yet gate combat movement — **TODO** when vertical traversal exists.
   */
  direction: LocationMapStairEndpointDirection;
  /**
   * Intended **target floor** (campaign `locationId` with `scale: 'floor'`), typically a sibling under the
   * same building. Phase 1: reference only; no runtime transition.
   */
  targetLocationId?: string;
  /**
   * Optional stable id for a future **vertical connection** document linking two endpoints.
   * Not enforced or paired in Phase 1.
   */
  connectionId?: string;
};
