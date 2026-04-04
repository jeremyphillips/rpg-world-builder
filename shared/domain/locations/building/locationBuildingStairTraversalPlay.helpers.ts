import type { LocationMapCellObjectEntry } from '../map/locationMap.types';
import type { LocationStairEndpointRef, LocationVerticalStairConnection } from './locationBuildingStairConnection.types';
import { resolveStairEndpointPairing, type StairEndpointPairingResolution } from './locationBuildingStairConnection.helpers';

/**
 * Pure play/combat stair eligibility using canonical building stair connections.
 * Does not load maps or floors — callers supply map cell objects for the token’s cell.
 *
 * TODO: Generalized multi-floor pathfinding across arbitrary transitions is out of scope for Phase 4.
 * TODO: AI stair traversal planning is out of scope; requires higher-level orchestration.
 */
export type StairPlayTraversalResolution =
  | {
      kind: 'ok';
      connectionId: string;
      sourceRef: LocationStairEndpointRef;
      counterpart: LocationStairEndpointRef;
    }
  | { kind: 'no_stairs_object_on_cell' }
  | { kind: 'pairing_blocked'; pairing: Exclude<StairEndpointPairingResolution, { kind: 'linked' }> };

/**
 * Finds a `stairs` object on the cell (if any) and resolves canonical pairing.
 */
export function resolveStairPlayTraversalFromCellObjects(
  connections: readonly LocationVerticalStairConnection[] | undefined,
  floorLocationId: string,
  authorCellId: string,
  objectsOnCell: readonly LocationMapCellObjectEntry[] | undefined,
): StairPlayTraversalResolution {
  const stairs = objectsOnCell?.find((o) => o.kind === 'stairs');
  if (!stairs) return { kind: 'no_stairs_object_on_cell' };

  const sourceRef: LocationStairEndpointRef = {
    floorLocationId,
    cellId: authorCellId,
    objectId: stairs.id,
  };
  const pairing = resolveStairEndpointPairing(connections, sourceRef, stairs.stairEndpoint?.connectionId);
  if (pairing.kind !== 'linked') {
    return { kind: 'pairing_blocked', pairing };
  }
  return {
    kind: 'ok',
    connectionId: pairing.connection.id,
    sourceRef,
    counterpart: pairing.counterpart,
  };
}
