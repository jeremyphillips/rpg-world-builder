import type { EncounterState } from '@/features/mechanics/domain/encounter/state/types'
import { isActiveCombatant } from '@/features/mechanics/domain/encounter/state/combatants/combatant-participation'

export type EncounterSideOutcome =
  | { kind: 'ongoing' }
  | { kind: 'allies_win' }
  | { kind: 'enemies_win' }
  | { kind: 'stalemate' }

/**
 * Lightweight "game over" detection: one side has no active (HP > 0) combatants.
 */
export function deriveEncounterSideOutcome(state: EncounterState | null): EncounterSideOutcome {
  if (!state?.started) return { kind: 'ongoing' }

  const partyIds = state.partyCombatantIds ?? []
  const enemyIds = state.enemyCombatantIds ?? []
  if (partyIds.length === 0 && enemyIds.length === 0) return { kind: 'ongoing' }

  const partyActive = partyIds.some((id) => {
    const c = state.combatantsById[id]
    return c != null && isActiveCombatant(c)
  })
  const enemyActive = enemyIds.some((id) => {
    const c = state.combatantsById[id]
    return c != null && isActiveCombatant(c)
  })

  if (partyActive && enemyActive) return { kind: 'ongoing' }
  if (!partyActive && !enemyActive) return { kind: 'stalemate' }
  if (partyActive && !enemyActive) return { kind: 'allies_win' }
  return { kind: 'enemies_win' }
}
