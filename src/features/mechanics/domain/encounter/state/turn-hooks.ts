import type { TurnBoundary } from '@/features/mechanics/domain/effects/timing.types'
import { rollHealing } from '@/features/mechanics/domain/resolution/engines/dice.engine'
import type { EncounterState } from './types'
import {
  effectDurationToRuntimeDuration,
  formatTurnHookNote,
  requirementLabel,
  unmetHookRequirements,
} from './shared'
import { appendLog, getCombatantLabel } from './logging'
import {
  addConditionToCombatant,
  addStateToCombatant,
  applyDamageToCombatant,
  applyHealingToCombatant,
} from './mutations'

export function executeTurnHooks(
  state: EncounterState,
  combatantId: string | null,
  boundary: TurnBoundary,
): EncounterState {
  if (!combatantId) return state

  const combatant = state.combatantsById[combatantId]
  if (!combatant) return state

  const hooks = combatant.turnHooks.filter((hook) => hook.boundary === boundary)
  if (hooks.length === 0) return state

  let nextState = state

  hooks.forEach((hook) => {
    if ((combatant.suppressedHooks ?? []).some((marker) => marker.id === hook.id)) {
      nextState = appendLog(nextState, {
        type: 'note',
        actorId: combatantId,
        targetIds: [combatantId],
        round: nextState.roundNumber,
        turn: nextState.turnIndex + 1,
        summary: `${getCombatantLabel(nextState, combatantId)} hook is suppressed: ${hook.label}.`,
        details: `${boundary} of turn.`,
      })
      return
    }

    const unmetRequirements = unmetHookRequirements(combatant, hook)
    if (unmetRequirements.length > 0) {
      nextState = appendLog(nextState, {
        type: 'note',
        actorId: combatantId,
        targetIds: [combatantId],
        round: nextState.roundNumber,
        turn: nextState.turnIndex + 1,
        summary: `${getCombatantLabel(nextState, combatantId)} hook requirements not met: ${hook.label}.`,
        details: unmetRequirements.map(requirementLabel).join(', '),
      })
      return
    }

    nextState = appendLog(nextState, {
      type: 'hook-triggered',
      actorId: combatantId,
      targetIds: [combatantId],
      round: nextState.roundNumber,
      turn: nextState.turnIndex + 1,
      summary: `${getCombatantLabel(nextState, combatantId)} hook fires: ${hook.label}.`,
      details: `${boundary} of turn.`,
    })

    hook.effects.forEach((effect) => {
      if (effect.kind === 'hit-points') {
        const resolved = rollHealing(String(effect.value), Math.random)
        if (resolved && resolved.total > 0) {
          nextState =
            effect.mode === 'heal'
              ? applyHealingToCombatant(nextState, combatantId, resolved.total, {
                  actorId: combatantId,
                  sourceLabel: hook.label,
                })
              : applyDamageToCombatant(nextState, combatantId, resolved.total, {
                  actorId: combatantId,
                  sourceLabel: hook.label,
                })
        }
        return
      }

      if (effect.kind === 'condition') {
        nextState = addConditionToCombatant(nextState, combatantId, effect.conditionId, {
          duration: effectDurationToRuntimeDuration(effect) ?? undefined,
          sourceLabel: hook.label,
        })
        return
      }

      if (effect.kind === 'state') {
        nextState = addStateToCombatant(nextState, combatantId, effect.stateId, {
          duration: effectDurationToRuntimeDuration(effect) ?? undefined,
          sourceLabel: hook.label,
        })
        return
      }

      const turnHookNote = formatTurnHookNote(effect)
      if (turnHookNote) {
        nextState = appendLog(nextState, {
          type: 'note',
          actorId: combatantId,
          targetIds: [combatantId],
          round: nextState.roundNumber,
          turn: nextState.turnIndex + 1,
          summary: `${hook.label}: ${turnHookNote}`,
        })
        return
      }

      nextState = appendLog(nextState, {
        type: 'note',
        actorId: combatantId,
        targetIds: [combatantId],
        round: nextState.roundNumber,
        turn: nextState.turnIndex + 1,
        summary: `${hook.label} has unsupported runtime effect: ${effect.kind}.`,
      })
    })
  })

  return nextState
}
