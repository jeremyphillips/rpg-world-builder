import { getCellForCombatant, hasLineOfSight } from '@/features/mechanics/domain/combat/space'

import type { EncounterState } from '@/features/mechanics/domain/combat/state/types'

/**
 * Grid line-of-sight: segment between observer and target cell centers; **intermediate** cells
 * with `blocksSight` block. Endpoints do not block. When space/placements are missing, returns
 * `true` (backwards-compatible with non-tactical state).
 */
export function lineOfSightClear(observerId: string, targetId: string, state: EncounterState): boolean {
  if (!state.space || !state.placements) return true
  const from = getCellForCombatant(state.placements, observerId)
  const to = getCellForCombatant(state.placements, targetId)
  if (!from || !to) return true
  return hasLineOfSight(state.space, from, to)
}

/**
 * First pass: same geometry as {@link lineOfSightClear}. Cover / partial LoE can diverge later.
 */
export function lineOfEffectClear(observerId: string, targetId: string, state: EncounterState): boolean {
  return lineOfSightClear(observerId, targetId, state)
}
