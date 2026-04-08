/**
 * Runtime door lock mutation for Pick Lock resolution (encounter space only).
 */
import { sanitizeAuthoredDoorState } from '@/shared/domain/locations/map/locationMapDoorAuthoring.helpers';
import {
  resolveDoorRuntimeFromState,
  resolveLocationPlacedObjectKindRuntimeDefaults,
} from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.runtime';
import type { EncounterEdge, EncounterSpace } from './space.types';

const DOOR_BASE_RUNTIME = resolveLocationPlacedObjectKindRuntimeDefaults('door');

/** Default DC when {@link EncounterEdge.lockPickDc} is unset. */
export const DEFAULT_LOCK_PICK_DC = 15;

export function resolveDoorLockPickDc(edge: EncounterEdge): number {
  return edge.lockPickDc ?? DEFAULT_LOCK_PICK_DC;
}

function unlockedDoorEdge(edge: EncounterEdge): EncounterEdge {
  const doorState = sanitizeAuthoredDoorState({
    openState: 'closed',
    lockState: 'unlocked',
  });
  const rt = resolveDoorRuntimeFromState(DOOR_BASE_RUNTIME, {
    openState: doorState.openState,
    lockState: doorState.lockState,
  });
  return {
    ...edge,
    blocksMovement: rt.blocksMovement,
    blocksSight: rt.blocksLineOfSight,
    doorState,
  };
}

export function withDoorUnlockedOnSpace(space: EncounterSpace, cellIdA: string, cellIdB: string): EncounterSpace {
  const edges = space.edges ?? [];
  const nextEdges = edges.map((e) => {
    const matches =
      (e.fromCellId === cellIdA && e.toCellId === cellIdB) ||
      (e.fromCellId === cellIdB && e.toCellId === cellIdA);
    if (!matches) return e;
    return unlockedDoorEdge(e);
  });
  return { ...space, edges: nextEdges.length > 0 ? nextEdges : undefined };
}
