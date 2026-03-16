import type { Effect } from '@/features/mechanics/domain/effects/effects.types'

import type { EncounterState } from './types'
import { formatEffectLabel } from './shared'
import { appendEncounterNote, appendHookTriggeredLog } from './logging'
import {
  addConditionToCombatant,
  addStateToCombatant,
  applyDamageToCombatant,
  applyHealingToCombatant,
} from './mutations'

function formatManualEffectLabel(effect: Effect): string {
  if (effect.kind === 'custom') {
    return `Custom: ${effect.id}`
  }

  if (effect.kind === 'save') {
    const successNotes = (effect.onSuccess ?? [])
      .map((nestedEffect) => (nestedEffect.kind === 'note' ? nestedEffect.text : formatEffectLabel(nestedEffect)))
      .join('; ')

    return successNotes
      ? `Save: ${effect.save.ability} (success: ${successNotes})`
      : `Save: ${effect.save.ability}`
  }

  if (effect.kind === 'note') {
    return effect.text
  }

  return formatEffectLabel(effect)
}

function noteRestoresToOneHitPoint(effect: Effect): boolean {
  return effect.kind === 'note' && /drops to 1 hit point instead/i.test(effect.text)
}

function applyManualEffectToCombatant(
  state: EncounterState,
  targetId: string,
  sourceLabel: string,
  effect: Effect,
  options?: { saveOutcome?: 'success' | 'fail' },
): EncounterState {
  if (effect.kind === 'condition') {
    return addConditionToCombatant(state, targetId, effect.conditionId, {
      sourceLabel,
    })
  }

  if (effect.kind === 'state') {
    return addStateToCombatant(state, targetId, effect.stateId, {
      sourceLabel,
    })
  }

  if (effect.kind === 'hit-points') {
    return effect.mode === 'heal'
      ? applyHealingToCombatant(state, targetId, effect.value, {
          sourceLabel,
        })
      : applyDamageToCombatant(state, targetId, effect.value, {
          sourceLabel,
        })
  }

  if (effect.kind === 'save') {
    const saveOutcome = options?.saveOutcome ?? 'success'
    const branchEffects = saveOutcome === 'success' ? (effect.onSuccess ?? []) : effect.onFail
    let nextState = appendEncounterNote(
      state,
      `${sourceLabel}: Save ${effect.save.ability} -> ${saveOutcome}.`,
      {
        actorId: targetId,
        targetIds: [targetId],
      },
    )

    branchEffects.forEach((branchEffect) => {
      nextState = applyManualEffectToCombatant(nextState, targetId, sourceLabel, branchEffect, options)
    })

    return nextState
  }

  let nextState = appendEncounterNote(state, `${sourceLabel}: ${formatManualEffectLabel(effect)}.`, {
    actorId: targetId,
    targetIds: [targetId],
  })

  if (noteRestoresToOneHitPoint(effect) && nextState.combatantsById[targetId]?.stats.currentHitPoints === 0) {
    nextState = applyHealingToCombatant(nextState, targetId, 1, {
      sourceLabel,
    })
  }

  return nextState
}

export function triggerManualHook(
  state: EncounterState,
  combatantId: string,
  hookLabel: string,
  effects: Effect[],
  options?: {
    details?: string
    saveOutcome?: 'success' | 'fail'
  },
): EncounterState {
  let nextState = appendHookTriggeredLog(state, combatantId, hookLabel, options?.details)

  effects.forEach((effect) => {
    nextState = applyManualEffectToCombatant(nextState, combatantId, hookLabel, effect, {
      saveOutcome: options?.saveOutcome,
    })
  })

  return nextState
}
