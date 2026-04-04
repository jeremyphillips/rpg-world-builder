import type { CombatIntent } from '../intents'
import type { CombatEvent, CombatIntentResult } from '../results'
import { moveCombatant } from '../space/selectors/space.selectors'
import { getCellForCombatant } from '../space/space.helpers'
import {
  appendStealthMovementRecheckHeaderNote,
  reconcileBattlefieldEffectAnchors,
  resolveAttachedAuraSpatialEntryAfterMovement,
} from '../state'
import type { EncounterState } from '../state/types'
import type { ApplyCombatIntentContext } from './apply-combat-intent-context.types'

export function applyMoveCombatantIntent(
  state: EncounterState,
  intent: Extract<CombatIntent, { kind: 'move-combatant' }>,
  ctx: ApplyCombatIntentContext,
): CombatIntentResult {
  if (!state.placements) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [{ code: 'no-placements', message: 'Encounter has no grid placements; cannot move.' }],
      },
    }
  }

  if (intent.combatantId !== state.activeCombatantId) {
    return {
      ok: false,
      error: {
        code: 'actor-mismatch',
        message: `Move expected active combatant ${state.activeCombatantId ?? 'none'}, got ${intent.combatantId}.`,
      },
    }
  }

  const fromCellId = getCellForCombatant(state.placements, intent.combatantId, state.space, state)
  const afterMove = moveCombatant(
    state,
    intent.combatantId,
    intent.destinationCellId,
    ctx.moveCombatantSpellContext,
  )

  if (afterMove === state) {
    return {
      ok: false,
      error: {
        code: 'validation-failed',
        issues: [
          {
            code: 'move-not-applied',
            message: 'Move was not applied (invalid destination, out of range, or blocked).',
          },
        ],
      },
    }
  }

  const toCellId = getCellForCombatant(afterMove.placements!, intent.combatantId, afterMove.space, afterMove)
  const hadStealthBookkeeping = Object.values(afterMove.combatantsById).some(
    (c) => (c.stealth?.hiddenFromObserverIds?.length ?? 0) > 0,
  )
  let afterMoveWithLog = afterMove
  if (hadStealthBookkeeping && fromCellId && toCellId) {
    afterMoveWithLog = appendStealthMovementRecheckHeaderNote(
      afterMove,
      intent.combatantId,
      fromCellId,
      toCellId,
    )
  }

  const startLen = state.log.length
  let next = reconcileBattlefieldEffectAnchors(afterMoveWithLog)
  if (ctx.spatialEntryAfterMove != null) {
    next = resolveAttachedAuraSpatialEntryAfterMovement(state, next, ctx.spatialEntryAfterMove)
  }

  const appended = next.log.slice(startLen)
  const events: CombatEvent[] = [
    {
      kind: 'combatant-moved',
      combatantId: intent.combatantId,
      fromCellId: fromCellId ?? null,
      toCellId: toCellId ?? null,
    },
  ]
  if (appended.length > 0) {
    events.push({ kind: 'log-appended', entries: appended })
  }

  return { ok: true, nextState: next, events }
}
