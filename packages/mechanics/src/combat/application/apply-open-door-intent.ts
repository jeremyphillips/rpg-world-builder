/**
 * Opens a closed door edge adjacent to the active combatant. Updates runtime {@link EncounterState} only;
 * authored location-map `doorState` is not modified (no write-back in Phase 1).
 */

import type { CombatIntent } from '../intents';
import type { CombatEvent, CombatIntentResult } from '../results';
import { getEncounterSpaceForCombatant, getSpacesRegistry, syncEncounterSpaceToActiveCombatant } from '../space/encounter-spaces';
import { findEncounterEdgeBetween } from '../space/spatial/edgeCrossing';
import type { EncounterEdge, EncounterSpace } from '../space/space.types';
import { getCellForCombatant } from '../space/space.helpers';
import type { EncounterState } from '../state/types';
import { sanitizeAuthoredDoorState } from '@/shared/domain/locations/map/locationMapDoorAuthoring.helpers';
import {
  resolveDoorRuntimeFromState,
  resolveLocationPlacedObjectKindRuntimeDefaults,
} from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.runtime';

const DOOR_BASE_RUNTIME = resolveLocationPlacedObjectKindRuntimeDefaults('door');

/**
 * Phase 1: `locked` and `barred` both block the simple "open door" action with the same failure code.
 * This is a deliberate UX simplification — future rules may treat barred differently (unbar, force, …).
 */
function doorBlocksSimpleOpen(lockState: 'unlocked' | 'locked' | 'barred'): boolean {
  return lockState === 'locked' || lockState === 'barred';
}

function openedDoorEdge(edge: EncounterEdge): EncounterEdge {
  const prev = edge.doorState ?? sanitizeAuthoredDoorState(undefined);
  const doorState = sanitizeAuthoredDoorState({
    openState: 'open',
    lockState: prev.lockState,
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

function withDoorOpenedOnSpace(space: EncounterSpace, cellIdA: string, cellIdB: string): EncounterSpace {
  const edges = space.edges ?? [];
  const nextEdges = edges.map((e) => {
    const matches =
      (e.fromCellId === cellIdA && e.toCellId === cellIdB) ||
      (e.fromCellId === cellIdB && e.toCellId === cellIdA);
    if (!matches) return e;
    return openedDoorEdge(e);
  });
  return { ...space, edges: nextEdges.length > 0 ? nextEdges : undefined };
}

export function applyOpenDoorIntent(
  state: EncounterState,
  intent: Extract<CombatIntent, { kind: 'open-door' }>,
): CombatIntentResult {
  if (!state.placements?.length) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [{ code: 'no-placements', message: 'Encounter has no grid placements.' }],
      },
    };
  }

  if (intent.combatantId !== state.activeCombatantId) {
    return {
      ok: false,
      error: {
        code: 'actor-mismatch',
        message: `Open door expected active combatant ${state.activeCombatantId ?? 'none'}, got ${intent.combatantId}.`,
      },
    };
  }

  const space = getEncounterSpaceForCombatant(state, intent.combatantId);
  if (!space) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [{ code: 'no-space', message: 'No tactical space for active combatant.' }],
      },
    };
  }

  const combatantCell = getCellForCombatant(state.placements, intent.combatantId, space, state);
  if (!combatantCell) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [{ code: 'no-placement', message: 'Combatant has no cell placement.' }],
      },
    };
  }

  if (combatantCell !== intent.cellIdA && combatantCell !== intent.cellIdB) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [
          {
            code: 'not-adjacent-to-door',
            message: 'Combatant must occupy a cell on this door segment to open it.',
          },
        ],
      },
    };
  }

  const edge = findEncounterEdgeBetween(space, intent.cellIdA, intent.cellIdB);
  if (!edge || edge.kind !== 'door') {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [{ code: 'not-a-door', message: 'No door edge between the given cells.' }],
      },
    };
  }

  if (edge.blocksMovement !== true) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [{ code: 'door-already-open', message: 'Door is already open.' }],
      },
    };
  }

  const lockState = edge.doorState?.lockState ?? 'unlocked';
  if (doorBlocksSimpleOpen(lockState)) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [
          {
            code: 'door-locked',
            message: 'Door is locked.',
          },
        ],
      },
    };
  }

  const updatedSpace = withDoorOpenedOnSpace(space, intent.cellIdA, intent.cellIdB);
  const registry = { ...getSpacesRegistry(state), [updatedSpace.id]: updatedSpace };

  let nextState: EncounterState = {
    ...state,
    spacesById: registry,
  };
  nextState = syncEncounterSpaceToActiveCombatant(nextState);

  const events: CombatEvent[] = [];
  return { ok: true, nextState, events };
}
