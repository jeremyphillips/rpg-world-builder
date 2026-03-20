import type { TurnBoundary } from '@/features/mechanics/domain/effects/timing.types'
import {
  resolveD20RollMode,
  rollD20WithRollMode,
  rollHealing,
} from '@/features/mechanics/domain/resolution/engines/dice.engine'
import { abilityIdToKey } from '@/features/mechanics/domain/character'
import { getAbilityModifier } from '@/features/mechanics/domain/abilities/getAbilityModifier'
import type {
  EncounterState,
  RuntimeTurnHook,
  RuntimeTurnHookRepeatSave,
} from './types'
import {
  effectDurationToRuntimeDuration,
  formatTurnHookNote,
  requirementLabel,
  unmetHookRequirements,
  updateCombatant,
} from './shared'
import { appendLog, getCombatantLabel } from './logging'
import {
  addConditionToCombatant,
  addStateToCombatant,
  applyDamageToCombatant,
  applyHealingToCombatant,
  removeConditionFromCombatant,
  removeStateFromCombatant,
} from './mutations'
import { autoFailsSave, getSaveModifiersFromConditions } from './condition-rules/condition-queries'

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

    if (hook.repeatSave) {
      nextState = resolveRepeatSave(nextState, combatantId, hook, hook.repeatSave)
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

      if (effect.kind === 'tracked-part' && 'change' in effect && effect.change) {
        nextState = applyTrackedPartChange(nextState, combatantId, effect.part, effect.change, hook.label)
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

function applyTrackedPartChange(
  state: EncounterState,
  combatantId: string,
  part: 'head' | 'limb',
  change: { mode: 'sever' | 'grow'; count: number },
  sourceLabel: string,
): EncounterState {
  const combatant = state.combatantsById[combatantId]
  if (!combatant) return state

  const trackedParts = combatant.trackedParts ?? []
  const partEntry = trackedParts.find((tp) => tp.part === part)
  if (!partEntry) {
    return appendLog(state, {
      type: 'note',
      actorId: combatantId,
      targetIds: [combatantId],
      round: state.roundNumber,
      turn: state.turnIndex + 1,
      summary: `${sourceLabel}: No tracked ${part} to modify.`,
    })
  }

  const verb = change.mode === 'sever' ? 'loses' : 'grows'
  const delta = change.mode === 'sever' ? -change.count : change.count
  const newCount = Math.max(0, partEntry.currentCount + delta)

  let nextState = updateCombatant(state, combatantId, (c) => ({
    ...c,
    trackedParts: (c.trackedParts ?? []).map((tp) =>
      tp.part === part
        ? {
            ...tp,
            currentCount: newCount,
            lostSinceLastTurn: change.mode === 'sever'
              ? tp.lostSinceLastTurn + change.count
              : tp.lostSinceLastTurn,
          }
        : tp,
    ),
  }))

  nextState = appendLog(nextState, {
    type: 'note',
    actorId: combatantId,
    targetIds: [combatantId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, combatantId)} ${verb} ${change.count} ${part}${change.count === 1 ? '' : 's'} (${newCount} remaining).`,
    details: `Source: ${sourceLabel}.`,
  })

  if (partEntry.deathWhenCountReaches != null && newCount <= partEntry.deathWhenCountReaches) {
    nextState = applyDamageToCombatant(nextState, combatantId, combatant.stats.currentHitPoints, {
      actorId: combatantId,
      sourceLabel: `${sourceLabel}: all ${part}s lost`,
    })
  }

  return nextState
}

function getSaveModifierForCombatant(
  state: EncounterState,
  combatantId: string,
  repeatSave: RuntimeTurnHookRepeatSave,
): number {
  const combatant = state.combatantsById[combatantId]
  if (!combatant) return 0
  const abilityKey = abilityIdToKey(repeatSave.ability)
  return (
    combatant.stats.savingThrowModifiers?.[abilityKey] ??
    getAbilityModifier(combatant.stats.abilityScores?.[abilityKey] ?? 10)
  )
}

function buildOutcomeTrackDetailSuffix(
  track: NonNullable<RuntimeTurnHookRepeatSave['outcomeTrack']>,
  prev: { successes: number; fails: number },
  succeeded: boolean,
): string {
  if (succeeded) {
    const ns = prev.successes + 1
    return ` Outcome track: ${ns}/${track.successCountToEnd ?? '—'} successes, ${prev.fails} failures.`
  }
  const nf = prev.fails + 1
  return ` Outcome track: ${prev.successes} successes, ${nf}/${track.failCountToLock ?? '—'} failures.`
}

function resolveRepeatSave(
  state: EncounterState,
  combatantId: string,
  hook: RuntimeTurnHook,
  repeatSave: RuntimeTurnHookRepeatSave,
): EncounterState {
  const combatant = state.combatantsById[combatantId]
  const saveModifier = getSaveModifierForCombatant(state, combatantId, repeatSave)

  let succeeded: boolean
  let details: string

  if (combatant && autoFailsSave(combatant, repeatSave.ability)) {
    succeeded = false
    details = `Auto-fail ${repeatSave.ability.toUpperCase()} save (condition).`
  } else if (
    combatant &&
    repeatSave.autoSuccessIfImmuneTo &&
    combatant.conditionImmunities?.includes(repeatSave.autoSuccessIfImmuneTo)
  ) {
    succeeded = true
    details = `Auto-success (immune to ${repeatSave.autoSuccessIfImmuneTo}).`
  } else {
    const saveRollMod = combatant
      ? resolveD20RollMode(getSaveModifiersFromConditions(combatant, repeatSave.ability))
      : 'normal'
    const { rawRoll, detail } = rollD20WithRollMode(saveRollMod, Math.random)
    const total = rawRoll + saveModifier
    succeeded = total >= repeatSave.dc
    details = `Saving throw: ${detail} + ${saveModifier} = ${total} vs DC ${repeatSave.dc}.`
  }

  const track = repeatSave.outcomeTrack
  const prevProgress = hook.repeatSaveProgress ?? { successes: 0, fails: 0 }
  const detailsWithTrack =
    track != null
      ? `${details}${buildOutcomeTrackDetailSuffix(track, prevProgress, succeeded)}`
      : details

  let nextState = appendLog(state, {
    type: 'note',
    actorId: combatantId,
    targetIds: [combatantId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, combatantId)} ${succeeded ? 'succeeds' : 'fails'} repeat ${repeatSave.ability.toUpperCase()} save for ${hook.label}.`,
    details: detailsWithTrack,
  })

  if (track) {
    if (succeeded) {
      const successes = prevProgress.successes + 1
      const fails = prevProgress.fails
      if (track.successCountToEnd != null && successes >= track.successCountToEnd) {
        if (repeatSave.removeCondition) {
          nextState = removeConditionFromCombatant(nextState, combatantId, repeatSave.removeCondition)
        }
        if (repeatSave.removeState) {
          nextState = removeStateFromCombatant(nextState, combatantId, repeatSave.removeState)
        }
        return updateCombatant(nextState, combatantId, (c) => ({
          ...c,
          turnHooks: c.turnHooks.filter((h) => h.id !== hook.id),
        }))
      }
      return updateCombatant(nextState, combatantId, (c) => ({
        ...c,
        turnHooks: c.turnHooks.map((h) =>
          h.id === hook.id ? { ...h, repeatSaveProgress: { successes, fails } } : h,
        ),
      }))
    }

    const fails = prevProgress.fails + 1
    const successes = prevProgress.successes
    if (track.failCountToLock != null && fails >= track.failCountToLock) {
      if (track.failLockStateId) {
        nextState = addStateToCombatant(nextState, combatantId, track.failLockStateId, {
          sourceLabel: hook.label,
        })
      }
      return updateCombatant(nextState, combatantId, (c) => ({
        ...c,
        turnHooks: c.turnHooks.filter((h) => h.id !== hook.id),
      }))
    }
    return updateCombatant(nextState, combatantId, (c) => ({
      ...c,
      turnHooks: c.turnHooks.map((h) =>
        h.id === hook.id ? { ...h, repeatSaveProgress: { successes, fails } } : h,
      ),
    }))
  }

  if (succeeded) {
    if (repeatSave.removeCondition) {
      nextState = removeConditionFromCombatant(nextState, combatantId, repeatSave.removeCondition)
    }
    if (repeatSave.removeState) {
      nextState = removeStateFromCombatant(nextState, combatantId, repeatSave.removeState)
    }
    nextState = updateCombatant(nextState, combatantId, (combatant) => ({
      ...combatant,
      turnHooks: combatant.turnHooks.filter((h) => h.id !== hook.id),
    }))
  } else if (repeatSave.singleAttempt && repeatSave.onFail?.addCondition) {
    if (repeatSave.removeCondition) {
      nextState = removeConditionFromCombatant(nextState, combatantId, repeatSave.removeCondition)
    }
    nextState = addConditionToCombatant(nextState, combatantId, repeatSave.onFail.addCondition, {
      sourceLabel: hook.label,
      sourceInstanceId: repeatSave.casterInstanceId,
      classification:
        repeatSave.onFail.markerClassification && repeatSave.onFail.markerClassification.length > 0
          ? repeatSave.onFail.markerClassification
          : undefined,
    })
    nextState = updateCombatant(nextState, combatantId, (combatant) => ({
      ...combatant,
      turnHooks: combatant.turnHooks.filter((h) => h.id !== hook.id),
    }))
  } else if (repeatSave.singleAttempt) {
    nextState = updateCombatant(nextState, combatantId, (combatant) => ({
      ...combatant,
      turnHooks: combatant.turnHooks.filter((h) => h.id !== hook.id),
    }))
  }

  return nextState
}
