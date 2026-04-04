import type { LocationMapStairEndpointAuthoring } from './locationMapStairEndpoint.types';

/**
 * Derived **link readiness** for a stair endpoint in the editor (and future warnings / traversal).
 *
 * Combat **pathing** and **token movement** across floors do **not** consume this yet — Phase 1 is
 * configuration + validation surface only.
 */
export type LocationMapStairEndpointLinkStatus = 'unlinked' | 'incomplete' | 'linked' | 'invalid';

export type DeriveLocationMapStairEndpointLinkStatusParams = {
  /** Parsed stair endpoint config; omit when legacy object has no `stairEndpoint`. */
  stairEndpoint: LocationMapStairEndpointAuthoring | undefined;
  /** Location id of the map’s floor (the floor being edited). */
  currentFloorLocationId: string;
  /**
   * Other floors that may be selected as `targetLocationId` (siblings under the building, excluding current).
   * Empty when the building has only one floor — links cannot be completed yet.
   */
  validTargetFloorIds: readonly string[];
};

/**
 * Computes a simple status for a stair endpoint: whether a target floor is chosen, valid, or impossible
 * until more floors exist. Does **not** verify a reciprocal endpoint on the target map — **TODO** when
 * full vertical connections exist.
 */
export function deriveLocationMapStairEndpointLinkStatus(
  params: DeriveLocationMapStairEndpointLinkStatusParams,
): LocationMapStairEndpointLinkStatus {
  const { stairEndpoint, currentFloorLocationId, validTargetFloorIds } = params;
  const targetSet = new Set(validTargetFloorIds);
  const rawTarget = stairEndpoint?.targetLocationId?.trim();

  if (rawTarget) {
    if (rawTarget === currentFloorLocationId) {
      return 'invalid';
    }
    if (!targetSet.has(rawTarget)) {
      return 'invalid';
    }
    return 'linked';
  }

  if (validTargetFloorIds.length === 0) {
    return 'incomplete';
  }

  return 'unlinked';
}
