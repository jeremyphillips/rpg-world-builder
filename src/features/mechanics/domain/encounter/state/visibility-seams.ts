import { getCellForCombatant, hasLineOfSight } from '@/features/encounter/space'

import type { EncounterState } from './types'
import type { CombatantInstance } from './types'
import { canSee } from './condition-rules/condition-queries'

/** State marker from the See Invisibility spell (`stateId: 'see-invisibility'`). */
const SEE_INVISIBILITY_STATE_LABEL = 'see-invisibility'

function hasInvisibleCondition(c: CombatantInstance): boolean {
  return c.conditions.some((m) => m.label === 'invisible')
}

function hasSeeInvisibilityState(c: CombatantInstance): boolean {
  return c.states.some((s) => s.label === SEE_INVISIBILITY_STATE_LABEL)
}

/**
 * Grid line-of-sight: segment between observer and target cell centers; **intermediate** cells
 * with `blocksSight` block. Endpoints do not block. When space/placements are missing, returns
 * `true` (backwards-compatible with non-tactical state).
 */
export function lineOfSightClear(
  observerId: string,
  targetId: string,
  state: EncounterState,
): boolean {
  if (!state.space || !state.placements) return true
  const from = getCellForCombatant(state.placements, observerId)
  const to = getCellForCombatant(state.placements, targetId)
  if (!from || !to) return true
  return hasLineOfSight(state.space, from, to)
}

/**
 * First pass: same geometry as {@link lineOfSightClear}. Cover / partial LoE can diverge later.
 */
export function lineOfEffectClear(
  observerId: string,
  targetId: string,
  state: EncounterState,
): boolean {
  return lineOfSightClear(observerId, targetId, state)
}

/**
 * Whether `observer` may select `target` for effects that require sight (e.g. “a creature you can see”).
 * Combines {@link canSee} (blinded / visibility consequences), invisible vs See Invisibility, and LOS/LoE stubs.
 */
export function canSeeForTargeting(
  state: EncounterState,
  observerId: string,
  targetId: string,
): boolean {
  const observer = state.combatantsById[observerId]
  const target = state.combatantsById[targetId]
  if (!observer || !target) return false
  if (!canSee(observer)) return false
  if (hasInvisibleCondition(target) && !hasSeeInvisibilityState(observer)) {
    return false
  }
  if (!lineOfSightClear(observerId, targetId, state)) return false
  if (!lineOfEffectClear(observerId, targetId, state)) return false
  return true
}
