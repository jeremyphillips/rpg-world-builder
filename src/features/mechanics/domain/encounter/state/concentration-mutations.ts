import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import { reconcileBattlefieldPresenceForCombatants } from './battlefield-return-placement'
import { removeAttachedAurasForSpell } from './attached-aura-mutations'
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
  const spellId = caster.concentration.spellId
  const linkedIds = new Set(caster.concentration.linkedMarkerIds)

  let nextState = removeAttachedAurasForSpell(state, casterId, spellId)

  nextState = updateCombatant(nextState, casterId, (combatant) => ({
    ...combatant,
    concentration: undefined,
    conditions: combatant.conditions.filter((m) => !linkedIds.has(m.id)),
    states: combatant.states.filter((m) => !linkedIds.has(m.id)),
    statModifiers: (combatant.statModifiers ?? []).filter((m) => !linkedIds.has(m.id)),
    rollModifiers: (combatant.rollModifiers ?? []).filter((m) => !linkedIds.has(m.id)),
    turnHooks: combatant.turnHooks.filter((h) => !h.id || !linkedIds.has(h.id)),
    damageResistanceMarkers: (combatant.damageResistanceMarkers ?? []).filter((m) => !linkedIds.has(m.id)),
    activeEffects: combatant.activeEffects.filter((e: Effect) => {
      const link = e.concentrationLinkId
      return link == null || !linkedIds.has(link)
    }),
  }))

  const reconcileIds = new Set<string>([casterId])

  for (const [id, instance] of Object.entries(nextState.combatantsById)) {
    if (id === casterId) continue
    const activeEffectLinked = instance.activeEffects.some((e: Effect) => {
      const link = e.concentrationLinkId
      return link != null && linkedIds.has(link)
    })

    const hasLinked =
      instance.conditions.some((m) => linkedIds.has(m.id)) ||
      instance.states.some((m) => linkedIds.has(m.id)) ||
      (instance.statModifiers ?? []).some((m) => linkedIds.has(m.id)) ||
      (instance.rollModifiers ?? []).some((m) => linkedIds.has(m.id)) ||
      instance.turnHooks.some((h) => h.id != null && linkedIds.has(h.id)) ||
      (instance.damageResistanceMarkers ?? []).some((m) => linkedIds.has(m.id)) ||
      activeEffectLinked

    if (hasLinked) {
      reconcileIds.add(id)
      nextState = updateCombatant(nextState, id, (combatant) => ({
        ...combatant,
        conditions: combatant.conditions.filter((m) => !linkedIds.has(m.id)),
        states: combatant.states.filter((m) => !linkedIds.has(m.id)),
        statModifiers: (combatant.statModifiers ?? []).filter((m) => !linkedIds.has(m.id)),
        rollModifiers: (combatant.rollModifiers ?? []).filter((m) => !linkedIds.has(m.id)),
        turnHooks: combatant.turnHooks.filter((h) => !h.id || !linkedIds.has(h.id)),
        damageResistanceMarkers: (combatant.damageResistanceMarkers ?? []).filter((m) => !linkedIds.has(m.id)),
        activeEffects: combatant.activeEffects.filter((e: Effect) => {
          const link = e.concentrationLinkId
          return link == null || !linkedIds.has(link)
        }),
      }))
    }
  }

  nextState = reconcileBattlefieldPresenceForCombatants(nextState, [...reconcileIds])

  return appendLog(nextState, {
    type: 'note',
    actorId: casterId,
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, casterId)} loses concentration on ${spellLabel}.`,
  })
}
