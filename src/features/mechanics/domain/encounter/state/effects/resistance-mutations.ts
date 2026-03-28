import type { DamageResistanceMarker, EncounterState } from '../types'
import { updateCombatant } from '../shared'
import { appendLog, getCombatantLabel } from './logging'

export function addDamageResistanceMarker(
  state: EncounterState,
  targetId: string,
  marker: DamageResistanceMarker,
  options?: { sourceLabel?: string },
): EncounterState {
  const target = state.combatantsById[targetId]
  if (!target) return state

  const existing = target.damageResistanceMarkers ?? []
  if (existing.some((m) => m.id === marker.id)) return state

  const nextState = updateCombatant(state, targetId, (combatant) => ({
    ...combatant,
    damageResistanceMarkers: [...(combatant.damageResistanceMarkers ?? []), marker],
  }))

  return appendLog(nextState, {
    type: 'note',
    actorId: state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} gains ${marker.level} to ${marker.damageType} damage.`,
    details: [
      options?.sourceLabel ? `Source: ${options.sourceLabel}.` : null,
      marker.duration
        ? `Duration: ${marker.duration.remainingTurns} turn(s), tick on ${marker.duration.tickOn}.`
        : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined,
  })
}

export function removeDamageResistanceMarker(
  state: EncounterState,
  targetId: string,
  markerId: string,
): EncounterState {
  const target = state.combatantsById[targetId]
  if (!target) return state

  const existing = target.damageResistanceMarkers ?? []
  const marker = existing.find((m) => m.id === markerId)
  if (!marker) return state

  const nextState = updateCombatant(state, targetId, (combatant) => ({
    ...combatant,
    damageResistanceMarkers: (combatant.damageResistanceMarkers ?? []).filter(
      (m) => m.id !== markerId,
    ),
  }))

  return appendLog(nextState, {
    type: 'note',
    actorId: state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} loses ${marker.level} to ${marker.damageType} damage.`,
  })
}

export function getDamageAfterResistance(
  amount: number,
  damageType: string | undefined,
  markers: DamageResistanceMarker[],
): { adjusted: number; applied: DamageResistanceMarker | null } {
  if (!damageType || markers.length === 0) return { adjusted: amount, applied: null }

  const normalized = damageType.trim().toLowerCase()
  const match = markers.find((m) => m.damageType.trim().toLowerCase() === normalized)
  if (!match) return { adjusted: amount, applied: null }

  switch (match.level) {
    case 'immunity':
      return { adjusted: 0, applied: match }
    case 'resistance':
      return { adjusted: Math.floor(amount / 2), applied: match }
    case 'vulnerability':
      return { adjusted: amount * 2, applied: match }
    default:
      return { adjusted: amount, applied: null }
  }
}
