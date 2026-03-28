import type { CombatantEquipmentSnapshot, EncounterState, StatModifierMarker } from '../types'
import { updateCombatant } from '../shared'
import { appendLog, getCombatantLabel } from '../effects/logging'
import { expireStatModifier } from '../effects/modifier-mutations'

function isWearingArmor(equipment: CombatantEquipmentSnapshot | undefined): boolean {
  const a = equipment?.armorEquipped
  return typeof a === 'string' && a.length > 0
}

function shouldDropUnarmoredModifier(
  m: StatModifierMarker,
  equipment: CombatantEquipmentSnapshot | undefined,
): boolean {
  return Boolean(m.eligibility?.requiresUnarmored && isWearingArmor(equipment))
}

/**
 * Merge equipment fields on a combatant, then remove stat modifiers that are no longer eligible
 * (e.g. unarmored-only AC buffs when `armorEquipped` becomes set). Reverses stats via `expireStatModifier`.
 */
export function patchCombatantEquipmentSnapshot(
  state: EncounterState,
  combatantId: string,
  patch: Partial<CombatantEquipmentSnapshot>,
): EncounterState {
  let next = updateCombatant(state, combatantId, (c) => ({
    ...c,
    equipment: { ...c.equipment, ...patch },
  }))
  const combatant = next.combatantsById[combatantId]
  if (!combatant) return next

  const toRemove = (combatant.statModifiers ?? []).filter((m) =>
    shouldDropUnarmoredModifier(m, combatant.equipment),
  )
  for (const m of toRemove) {
    next = expireStatModifier(next, combatantId, m)
  }
  if (toRemove.length > 0) {
    next = appendLog(next, {
      type: 'note',
      actorId: state.activeCombatantId ?? undefined,
      targetIds: [combatantId],
      round: state.roundNumber,
      turn: state.turnIndex + 1,
      summary: `${getCombatantLabel(state, combatantId)} equipment updated; ${toRemove.length} stat modifier(s) ended (no longer eligible).`,
    })
  }
  return next
}
