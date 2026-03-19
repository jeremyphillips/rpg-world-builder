import type { CombatantInstance, EncounterState, RollModifierMarker, StatModifierMarker } from './types'
import { updateCombatant } from './shared'
import { appendLog, getCombatantLabel } from './logging'

function applyStatModifierToStats(
  stats: CombatantInstance['stats'],
  modifier: StatModifierMarker,
): CombatantInstance['stats'] {
  if (modifier.target === 'armor_class') {
    if (modifier.mode === 'add') {
      return { ...stats, armorClass: stats.armorClass + modifier.value }
    }
    if (modifier.mode === 'set') {
      return { ...stats, armorClass: Math.max(stats.armorClass, modifier.value) }
    }
  }
  if (modifier.target === 'speed' && modifier.mode === 'add') {
    const speeds = { ...(stats.speeds ?? {}) }
    const ground = (speeds.ground ?? 30) + modifier.value
    return { ...stats, speeds: { ...speeds, ground } }
  }
  return stats
}

function reverseStatModifierFromStats(
  stats: CombatantInstance['stats'],
  modifier: StatModifierMarker,
): CombatantInstance['stats'] {
  if (modifier.target === 'armor_class') {
    if (modifier.mode === 'add') {
      return { ...stats, armorClass: stats.armorClass - modifier.value }
    }
    // 'set' modifiers can't be cleanly reversed without storing the original value;
    // recalculating from base would be needed for full correctness.
  }
  if (modifier.target === 'speed' && modifier.mode === 'add') {
    const speeds = { ...(stats.speeds ?? {}) }
    const ground = (speeds.ground ?? 30) - modifier.value
    return { ...stats, speeds: { ...speeds, ground } }
  }
  return stats
}

export function addStatModifierToCombatant(
  state: EncounterState,
  targetId: string,
  modifier: StatModifierMarker,
  options?: { sourceLabel?: string },
): EncounterState {
  const target = state.combatantsById[targetId]
  if (!target) return state

  const nextState = updateCombatant(state, targetId, (combatant) => ({
    ...combatant,
    stats: applyStatModifierToStats(combatant.stats, modifier),
    statModifiers: [...(combatant.statModifiers ?? []), modifier],
  }))

  return appendLog(nextState, {
    type: 'note',
    actorId: state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} gains ${modifier.label}.`,
    details: [
      options?.sourceLabel ? `Source: ${options.sourceLabel}.` : null,
      modifier.duration
        ? `Duration: ${modifier.duration.remainingTurns} turn(s), tick on ${modifier.duration.tickOn}.`
        : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined,
  })
}

export function expireStatModifier(
  state: EncounterState,
  targetId: string,
  modifier: StatModifierMarker,
): EncounterState {
  const target = state.combatantsById[targetId]
  if (!target) return state

  return updateCombatant(state, targetId, (combatant) => ({
    ...combatant,
    stats: reverseStatModifierFromStats(combatant.stats, modifier),
    statModifiers: (combatant.statModifiers ?? []).filter((m) => m.id !== modifier.id),
  }))
}

export function addRollModifierToCombatant(
  state: EncounterState,
  targetId: string,
  marker: RollModifierMarker,
  options?: { sourceLabel?: string },
): EncounterState {
  const target = state.combatantsById[targetId]
  if (!target) return state

  const nextState = updateCombatant(state, targetId, (combatant) => ({
    ...combatant,
    rollModifiers: [...(combatant.rollModifiers ?? []), marker],
  }))

  return appendLog(nextState, {
    type: 'note',
    actorId: state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} gains ${marker.modifier} on ${Array.isArray(marker.appliesTo) ? marker.appliesTo.join(', ') : marker.appliesTo}.`,
    details: options?.sourceLabel ? `Source: ${options.sourceLabel}.` : undefined,
  })
}
