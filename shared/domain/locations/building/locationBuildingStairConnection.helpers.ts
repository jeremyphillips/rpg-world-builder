import type {
  LocationStairEndpointRef,
  LocationVerticalStairConnection,
} from './locationBuildingStairConnection.types';

/**
 * True if both refs denote the same stair endpoint (same floor, cell, and object).
 */
export function stairEndpointRefsEqual(a: LocationStairEndpointRef, b: LocationStairEndpointRef): boolean {
  return a.floorLocationId === b.floorLocationId && a.cellId === b.cellId && a.objectId === b.objectId;
}

/**
 * Whether a connection references this endpoint on either side.
 */
export function connectionReferencesEndpoint(
  c: LocationVerticalStairConnection,
  ref: LocationStairEndpointRef,
): boolean {
  return stairEndpointRefsEqual(c.endpointA, ref) || stairEndpointRefsEqual(c.endpointB, ref);
}

/**
 * Returns the other endpoint in a connection, or `undefined` if `ref` is not part of this connection.
 */
export function getCounterpartStairEndpoint(
  c: LocationVerticalStairConnection,
  ref: LocationStairEndpointRef,
): LocationStairEndpointRef | undefined {
  if (stairEndpointRefsEqual(c.endpointA, ref)) return c.endpointB;
  if (stairEndpointRefsEqual(c.endpointB, ref)) return c.endpointA;
  return undefined;
}

/**
 * Finds the connection that includes this endpoint, if any.
 */
export function findStairConnectionForEndpoint(
  connections: readonly LocationVerticalStairConnection[] | undefined,
  ref: LocationStairEndpointRef,
): LocationVerticalStairConnection | undefined {
  if (!connections?.length) return undefined;
  return connections.find((c) => connectionReferencesEndpoint(c, ref));
}

/**
 * Removes every connection that references `ref`. Returns the filtered list (new array).
 */
export function removeStairConnectionsInvolvingEndpoint(
  connections: readonly LocationVerticalStairConnection[] | undefined,
  ref: LocationStairEndpointRef,
): LocationVerticalStairConnection[] {
  if (!connections?.length) return [];
  return connections.filter((c) => !connectionReferencesEndpoint(c, ref));
}

export type ValidateStairEndpointsCanPairResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Validates that two endpoints can form one **paired** stair connection under a building.
 * Does not check map contents (objects must exist on maps separately).
 */
export function validateStairEndpointsCanPair(
  _buildingLocationId: string,
  a: LocationStairEndpointRef,
  b: LocationStairEndpointRef,
  allowedFloorLocationIds: ReadonlySet<string>,
): ValidateStairEndpointsCanPairResult {
  if (a.floorLocationId === b.floorLocationId) {
    return { ok: false, reason: 'Both stair endpoints must be on different floors.' };
  }
  if (!allowedFloorLocationIds.has(a.floorLocationId) || !allowedFloorLocationIds.has(b.floorLocationId)) {
    return { ok: false, reason: 'Each endpoint must be a floor under this building.' };
  }
  if (stairEndpointRefsEqual(a, b)) {
    return { ok: false, reason: 'Cannot link an endpoint to itself.' };
  }
  return { ok: true };
}

/**
 * Builds a new connection. Caller must ensure {@link validateStairEndpointsCanPair} passed and ids are unique among existing connections.
 */
export function createVerticalStairConnection(
  buildingLocationId: string,
  id: string,
  endpointA: LocationStairEndpointRef,
  endpointB: LocationStairEndpointRef,
): LocationVerticalStairConnection {
  return {
    id,
    kind: 'stairs',
    buildingLocationId,
    endpointA,
    endpointB,
  };
}

/**
 * True if any existing connection already uses either endpoint (pairing is exclusive).
 */
export function connectionWouldDuplicateEndpoint(
  connections: readonly LocationVerticalStairConnection[] | undefined,
  a: LocationStairEndpointRef,
  b: LocationStairEndpointRef,
): boolean {
  if (!connections?.length) return false;
  for (const c of connections) {
    if (connectionReferencesEndpoint(c, a) || connectionReferencesEndpoint(c, b)) return true;
  }
  return false;
}

/**
 * Resolution for inspector / workspace: canonical connection vs stale object state.
 * **Play traversal** uses `resolveStairPlayTraversalFromCellObjects` plus session/orchestration to build
 * the `stair-traversal` combat intent payload; mechanics does not resolve links from raw building data.
 */
export type StairEndpointPairingResolution =
  | {
      kind: 'linked';
      connection: LocationVerticalStairConnection;
      counterpart: LocationStairEndpointRef;
    }
  | { kind: 'orphaned'; reason: 'missing_connection' | 'counterpart_missing_on_map' }
  | { kind: 'unlinked' };

/**
 * Resolves pairing for one endpoint using canonical `connections` plus optional legacy `connectionId` on the object.
 * Prefer this over duplicated `targetLocationId` for “where does this stair lead?” when a connection exists.
 */
export function resolveStairEndpointPairing(
  connections: readonly LocationVerticalStairConnection[] | undefined,
  ref: LocationStairEndpointRef,
  /** `stairEndpoint.connectionId` from the map object, if any */
  objectConnectionId: string | undefined,
): StairEndpointPairingResolution {
  const byEndpoint = findStairConnectionForEndpoint(connections, ref);
  if (byEndpoint) {
    const counterpart = getCounterpartStairEndpoint(byEndpoint, ref);
    if (counterpart) {
      return { kind: 'linked', connection: byEndpoint, counterpart };
    }
  }

  const id = objectConnectionId?.trim();
  if (id) {
    const byId = connections?.find((c) => c.id === id);
    if (!byId || !connectionReferencesEndpoint(byId, ref)) {
      return { kind: 'orphaned', reason: 'missing_connection' };
    }
    const counterpart = getCounterpartStairEndpoint(byId, ref);
    if (counterpart) {
      return { kind: 'linked', connection: byId, counterpart };
    }
    return { kind: 'orphaned', reason: 'missing_connection' };
  }

  return { kind: 'unlinked' };
}
