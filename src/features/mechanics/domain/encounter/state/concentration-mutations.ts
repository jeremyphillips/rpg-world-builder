import type { ConcentrationState, EncounterState } from './types'
import { updateCombatant } from './shared'
import { appendLog, getCombatantLabel } from './logging'

export function tickConcentrationDuration(
  state: EncounterState,
  combatantId: string,
): EncounterState {
  const combatant = state.combatantsById[combatantId]
  if (!combatant?.concentration?.remainingTurns) return state

  const remaining = combatant.concentration.remainingTurns - 1

  if (remaining <= 0) {
    const nextState = appendLog(state, {
      type: 'note',
      actorId: combatantId,
      round: state.roundNumber,
      turn: state.turnIndex + 1,
      summary: `${getCombatantLabel(state, combatantId)}'s concentration on ${combatant.concentration.spellLabel} expires (duration ended).`,
    })
    return dropConcentration(nextState, combatantId)
  }

  return updateCombatant(state, combatantId, (c) => ({
    ...c,
    concentration: { ...c.concentration!, remainingTurns: remaining },
  }))
}

export function setConcentration(
  state: EncounterState,
  casterId: string,
  concentration: ConcentrationState,
): EncounterState {
  let nextState = state
  const caster = state.combatantsById[casterId]
  if (!caster) return state

  if (caster.concentration) {
    nextState = dropConcentration(nextState, casterId)
  }

  nextState = updateCombatant(nextState, casterId, (combatant) => ({
    ...combatant,
    concentration,
  }))

  return appendLog(nextState, {
    type: 'note',
    actorId: casterId,
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, casterId)} begins concentrating on ${concentration.spellLabel}.`,
  })
}

export function dropConcentration(
  state: EncounterState,
  casterId: string,
): EncounterState {
  const caster = state.combatantsById[casterId]
  if (!caster?.concentration) return state

  const spellLabel = caster.concentration.spellLabel
  const linkedIds = new Set(caster.concentration.linkedMarkerIds)

  let nextState = updateCombatant(state, casterId, (combatant) => ({
    ...combatant,
    concentration: undefined,
    conditions: combatant.conditions.filter((m) => !linkedIds.has(m.id)),
    states: combatant.states.filter((m) => !linkedIds.has(m.id)),
    statModifiers: (combatant.statModifiers ?? []).filter((m) => !linkedIds.has(m.id)),
    rollModifiers: (combatant.rollModifiers ?? []).filter((m) => !linkedIds.has(m.id)),
    turnHooks: combatant.turnHooks.filter((h) => !h.id || !linkedIds.has(h.id)),
    damageResistanceMarkers: (combatant.damageResistanceMarkers ?? []).filter((m) => !linkedIds.has(m.id)),
  }))

  for (const [id, instance] of Object.entries(nextState.combatantsById)) {
    if (id === casterId) continue
    const hasLinked =
      instance.conditions.some((m) => linkedIds.has(m.id)) ||
      instance.states.some((m) => linkedIds.has(m.id)) ||
      (instance.statModifiers ?? []).some((m) => linkedIds.has(m.id)) ||
      (instance.rollModifiers ?? []).some((m) => linkedIds.has(m.id)) ||
      instance.turnHooks.some((h) => h.id != null && linkedIds.has(h.id)) ||
      (instance.damageResistanceMarkers ?? []).some((m) => linkedIds.has(m.id))

    if (hasLinked) {
      nextState = updateCombatant(nextState, id, (combatant) => ({
        ...combatant,
        conditions: combatant.conditions.filter((m) => !linkedIds.has(m.id)),
        states: combatant.states.filter((m) => !linkedIds.has(m.id)),
        statModifiers: (combatant.statModifiers ?? []).filter((m) => !linkedIds.has(m.id)),
        rollModifiers: (combatant.rollModifiers ?? []).filter((m) => !linkedIds.has(m.id)),
        turnHooks: combatant.turnHooks.filter((h) => !h.id || !linkedIds.has(h.id)),
        damageResistanceMarkers: (combatant.damageResistanceMarkers ?? []).filter((m) => !linkedIds.has(m.id)),
      }))
    }
  }

  return appendLog(nextState, {
    type: 'note',
    actorId: casterId,
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, casterId)} loses concentration on ${spellLabel}.`,
  })
}
