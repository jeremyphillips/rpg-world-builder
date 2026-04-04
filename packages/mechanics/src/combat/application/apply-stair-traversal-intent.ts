import type { CombatIntent } from '../intents';
import type { CombatEvent, CombatIntentResult } from '../results';
import { mergeSpacesIntoRegistry, syncEncounterSpaceToActiveCombatant } from '../space/encounter-spaces'
import {
  cellMovementBlockedForEntering,
  getCellById,
  getCellForCombatant,
  getOccupant,
  placementsOnSpace,
} from '../space/space.helpers';
import { reconcileBattlefieldEffectAnchors } from '../state';
import { createEmptyTurnContext } from '../state/shared';
import { getEffectiveGroundMovementBudgetFt } from '../state/battlefield/battlefield-spatial-movement-modifiers';
import type { BattlefieldSpellContext } from '../state/battlefield/battlefield-spatial-movement-modifiers';
import type { EncounterState } from '../state/types';
import type { ApplyCombatIntentContext } from './apply-combat-intent-context.types';

/**
 * Mechanics applies traversal only against already-resolved destination spaces.
 * It does not load floors, prefetch maps, or perform multi-floor planning.
 *
 * TODO: AI-driven multi-floor traversal will need higher-level orchestration.
 */
export function applyStairTraversalIntent(
  state: EncounterState,
  intent: Extract<CombatIntent, { kind: 'stair-traversal' }>,
  ctx: ApplyCombatIntentContext,
): CombatIntentResult {
  if (!state.placements?.length) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [{ code: 'no-placements', message: 'Encounter has no grid placements; cannot traverse.' }],
      },
    };
  }

  const { space } = state;
  if (!space) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [{ code: 'no-space', message: 'Encounter has no tactical space; cannot traverse.' }],
      },
    };
  }

  if (intent.combatantId !== state.activeCombatantId) {
    return {
      ok: false,
      error: {
        code: 'actor-mismatch',
        message: `Stair traversal expected active combatant ${state.activeCombatantId ?? 'none'}, got ${intent.combatantId}.`,
      },
    };
  }

  const sourceFloorId = space.locationId ?? null;
  if (sourceFloorId !== intent.sourceFloorLocationId) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [
          {
            code: 'source-floor-mismatch',
            message: 'Tactical space floor does not match stair traversal source.',
          },
        ],
      },
    };
  }

  const fromCellId = getCellForCombatant(state.placements, intent.combatantId, space, state);
  if (!fromCellId) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [{ code: 'no-placement', message: 'Combatant has no placement on the current floor.' }],
      },
    };
  }

  const destSpace = intent.destinationEncounterSpace;
  if ((destSpace.locationId ?? null) !== intent.destinationFloorLocationId) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [
          {
            code: 'destination-space-mismatch',
            message: 'Resolved destination space location id must match destination floor.',
          },
        ],
      },
    };
  }

  const destCell = getCellById(destSpace, intent.destinationCellId);
  if (!destCell || cellMovementBlockedForEntering(destSpace, intent.destinationCellId)) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [{ code: 'blocked-destination', message: 'Destination stair cell is blocked or invalid.' }],
      },
    };
  }

  const sourceFloor = intent.sourceFloorLocationId;
  const tagged = state.placements.map((p) => ({
    ...p,
    floorLocationId: p.floorLocationId ?? sourceFloor,
  }));
  const withoutMover = tagged.filter((p) => p.combatantId !== intent.combatantId);

  if (
    getOccupant(placementsOnSpace(destSpace, withoutMover, state), intent.destinationCellId, destSpace, state) !==
    undefined
  ) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [{ code: 'destination-occupied', message: 'Destination stair cell is occupied.' }],
      },
    };
  }

  const combatant = state.combatantsById[intent.combatantId];
  if (!combatant) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [{ code: 'missing-combatant', message: 'Combatant not found.' }],
      },
    };
  }

  const dist = intent.movementCostFt;
  const spellCtx: BattlefieldSpellContext | undefined = ctx.moveCombatantSpellContext;
  const spacesById = mergeSpacesIntoRegistry(state, space, destSpace);

  const moverPlacement = {
    combatantId: intent.combatantId,
    cellId: intent.destinationCellId,
    floorLocationId: intent.destinationFloorLocationId,
    encounterSpaceId: destSpace.id,
  };
  const placementsNext = [...withoutMover, moverPlacement];

  if (spellCtx?.spellLookup) {
    const spent = (combatant.turnContext?.movementSpentThisTurn ?? 0) + dist;
    const nextStateBase: EncounterState = {
      ...state,
      spacesById,
      space: destSpace,
      placements: placementsNext,
    };
    const effectiveMax = getEffectiveGroundMovementBudgetFt(combatant, nextStateBase, spellCtx);
    if (spent > effectiveMax) {
      return {
        ok: false,
        error: {
          code: 'validation-failed',
          issues: [{ code: 'insufficient-movement', message: 'Not enough movement remaining for stair traversal.' }],
        },
      };
    }
    const updatedCombatant = {
      ...combatant,
      turnContext: {
        ...(combatant.turnContext ?? createEmptyTurnContext()),
        movementSpentThisTurn: spent,
      },
      turnResources: {
        ...combatant.turnResources!,
        movementRemaining: Math.max(0, effectiveMax - spent),
      },
    };
    let next: EncounterState = {
      ...nextStateBase,
      combatantsById: {
        ...nextStateBase.combatantsById,
        [intent.combatantId]: updatedCombatant,
      },
    };
    next = reconcileBattlefieldEffectAnchors(next);
    next = syncEncounterSpaceToActiveCombatant(next);
    const events: CombatEvent[] = [
      {
        kind: 'combatant-moved',
        combatantId: intent.combatantId,
        fromCellId: fromCellId,
        toCellId: intent.destinationCellId,
      },
    ];
    return { ok: true, nextState: next, events };
  }

  const movementRemaining = combatant.turnResources?.movementRemaining ?? 0;
  if (movementRemaining < dist) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [{ code: 'insufficient-movement', message: 'Not enough movement remaining for stair traversal.' }],
      },
    };
  }

  const updatedResources = {
    ...combatant.turnResources!,
    movementRemaining: movementRemaining - dist,
  };

  let next: EncounterState = {
    ...state,
    spacesById,
    space: destSpace,
    placements: placementsNext,
    combatantsById: {
      ...state.combatantsById,
      [intent.combatantId]: {
        ...combatant,
        turnResources: updatedResources,
      },
    },
  };
  next = reconcileBattlefieldEffectAnchors(next);
  next = syncEncounterSpaceToActiveCombatant(next);

  const events: CombatEvent[] = [
    {
      kind: 'combatant-moved',
      combatantId: intent.combatantId,
      fromCellId: fromCellId,
      toCellId: intent.destinationCellId,
    },
  ];
  return { ok: true, nextState: next, events };
}
