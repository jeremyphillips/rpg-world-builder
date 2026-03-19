import type { ConcentrationState, EncounterState } from './types'
import { updateCombatant } from './shared'
import { appendLog, getCombatantLabel } from './logging'

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
  }))

  for (const [id, instance] of Object.entries(nextState.combatantsById)) {
    if (id === casterId) continue
    const hasLinked =
      instance.conditions.some((m) => linkedIds.has(m.id)) ||
      instance.states.some((m) => linkedIds.has(m.id)) ||
      (instance.statModifiers ?? []).some((m) => linkedIds.has(m.id)) ||
      (instance.rollModifiers ?? []).some((m) => linkedIds.has(m.id))

    if (hasLinked) {
      nextState = updateCombatant(nextState, id, (combatant) => ({
        ...combatant,
        conditions: combatant.conditions.filter((m) => !linkedIds.has(m.id)),
        states: combatant.states.filter((m) => !linkedIds.has(m.id)),
        statModifiers: (combatant.statModifiers ?? []).filter((m) => !linkedIds.has(m.id)),
        rollModifiers: (combatant.rollModifiers ?? []).filter((m) => !linkedIds.has(m.id)),
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
