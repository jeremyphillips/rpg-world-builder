import { DEFAULT_PICK_LOCK_COMBAT_ACTION } from '../resolution/combat-action.types';
import { canSpendActionCost, canUseCombatAction, getCombatantTurnResources } from '../resolution/action/action-cost';
import type { CombatActionDefinition } from '../resolution/combat-action.types';
import type { EncounterState } from '../state/types';
import type { CombatantInstance } from '../state/types';
import { getEncounterSpaceForCombatant } from '../space/encounter-spaces';
import { findEncounterEdgeBetween } from '../space/spatial/edgeCrossing';
import type { EncounterEdge } from '../space/space.types';
import { getCellAt, getCellById, getCellForCombatant } from '../space/space.helpers';
import { sanitizeAuthoredDoorState } from '@/shared/domain/locations/map/locationMapDoorAuthoring.helpers';

const THIEVES_TOOLS_ID = 'thieves-tools';

export type PickLockLegalTarget = {
  doorId: string;
  cellIdA: string;
  cellIdB: string;
};

export type PickLockUnavailableReason =
  | 'missing-tool-proficiency'
  | 'missing-thieves-tools'
  | 'no-locked-door-in-range'
  | 'cannot-spend-action'
  | 'action-unavailable';

export type PickLockAvailability =
  | { available: true; legalTargets: PickLockLegalTarget[] }
  | { available: false; legalTargets: []; reason: PickLockUnavailableReason };

function stableDoorId(edge: EncounterEdge, cellIdA: string, cellIdB: string): string {
  if (edge.mapEdgeId) return edge.mapEdgeId;
  return [cellIdA, cellIdB].sort().join('::');
}

function isPickLockableDoorEdge(edge: EncounterEdge): boolean {
  if (edge.kind !== 'door') return false;
  if (edge.blocksMovement !== true) return false;
  const door = sanitizeAuthoredDoorState(edge.doorState);
  if (door.openState !== 'closed') return false;
  return door.lockState === 'locked';
}

/**
 * Enumerates locked door edges adjacent to the combatant's cell (king-adjacency).
 * Neighbor order is sorted by cell id for deterministic ordering.
 */
export function enumerateAdjacentLockedDoorsForPickLock(
  encounterState: EncounterState,
  combatantId: string,
): PickLockLegalTarget[] {
  if (!encounterState.placements?.length) return [];
  const space = getEncounterSpaceForCombatant(encounterState, combatantId);
  if (!space) return [];
  const combatantCellId = getCellForCombatant(
    encounterState.placements,
    combatantId,
    space,
    encounterState,
  );
  if (!combatantCellId) return [];
  const cell = getCellById(space, combatantCellId);
  if (!cell) return [];

  const neighborCells = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const n = getCellAt(space, cell.x + dx, cell.y + dy);
      if (n) neighborCells.push(n);
    }
  }
  neighborCells.sort((a, b) => a.id.localeCompare(b.id));

  const out: PickLockLegalTarget[] = [];
  for (const n of neighborCells) {
    const edge = findEncounterEdgeBetween(space, combatantCellId, n.id);
    if (!edge || !isPickLockableDoorEdge(edge)) continue;
    out.push({
      doorId: stableDoorId(edge, combatantCellId, n.id),
      cellIdA: combatantCellId,
      cellIdB: n.id,
    });
  }
  return out;
}

function getPickLockActionFromCombatant(combatant: CombatantInstance): CombatActionDefinition | undefined {
  return combatant.actions?.find((a) => a.id === DEFAULT_PICK_LOCK_COMBAT_ACTION.id);
}

/**
 * Single source of truth for whether Pick Lock is enabled: proficiency, gear, adjacent locked door,
 * and ability to spend the action cost (matches {@link getCombatantAvailableActions} semantics).
 */
export function resolvePickLockAvailability(
  encounterState: EncounterState,
  combatantId: string,
): PickLockAvailability {
  const combatant = encounterState.combatantsById[combatantId];
  if (!combatant) {
    return { available: false, legalTargets: [], reason: 'action-unavailable' };
  }

  const pickLockAction = getPickLockActionFromCombatant(combatant);
  if (!pickLockAction) {
    return { available: false, legalTargets: [], reason: 'action-unavailable' };
  }

  const resources = getCombatantTurnResources(combatant);
  if (!canSpendActionCost(resources, pickLockAction.cost) || !canUseCombatAction(pickLockAction)) {
    return { available: false, legalTargets: [], reason: 'cannot-spend-action' };
  }

  const granted = combatant.grantedToolProficiencies ?? [];
  if (!granted.includes(THIEVES_TOOLS_ID)) {
    return { available: false, legalTargets: [], reason: 'missing-tool-proficiency' };
  }

  const gearIds = combatant.equipment?.gearIds ?? [];
  if (!gearIds.includes(THIEVES_TOOLS_ID)) {
    return { available: false, legalTargets: [], reason: 'missing-thieves-tools' };
  }

  const legalTargets = enumerateAdjacentLockedDoorsForPickLock(encounterState, combatantId);
  if (legalTargets.length === 0) {
    return { available: false, legalTargets: [], reason: 'no-locked-door-in-range' };
  }

  return { available: true, legalTargets };
}

/** True when the cell pair identifies a valid locked door adjacent to the actor (for resolve readiness). */
export function isPickLockDoorSelectionValid(
  encounterState: EncounterState,
  combatantId: string,
  cellIdA: string | undefined,
  cellIdB: string | undefined,
): boolean {
  const a = cellIdA?.trim()
  const b = cellIdB?.trim()
  if (!a || !b) return false
  const legal = enumerateAdjacentLockedDoorsForPickLock(encounterState, combatantId)
  return legal.some(
    (t) => (t.cellIdA === a && t.cellIdB === b) || (t.cellIdA === b && t.cellIdB === a),
  )
}

export function pickLockUnavailableReasonToHint(reason: PickLockUnavailableReason): string {
  switch (reason) {
    case 'missing-tool-proficiency':
      return 'Thieves’ tools proficiency required';
    case 'missing-thieves-tools':
      return 'Thieves’ tools required';
    case 'no-locked-door-in-range':
      return 'No locked door in reach';
    case 'cannot-spend-action':
      return 'No action available';
    case 'action-unavailable':
      return 'Pick Lock unavailable';
    default:
      return 'Pick Lock unavailable';
  }
}
