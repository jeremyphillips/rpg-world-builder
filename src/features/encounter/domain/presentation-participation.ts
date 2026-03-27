/**
 * Centralized opacity / visibility hints for encounter participation (defeated, banished, off-grid, …).
 * Pair with domain predicates from mechanics (`isDefeatedCombatant`, `hasBattlefieldPresence`, …).
 */

import type { TurnOrderStatus } from './view/encounter-view.types'

export const PARTICIPATION_VISUALS = {
  defeated: {
    opacity: 0.5,
  },
  /** Living (or otherwise non-defeated) but not on the tactical grid — banished, off-grid, etc. */
  battlefieldAbsent: {
    opacity: 0.5,
    hideToken: true as const,
  },
} as const

export function getCombatantPreviewCardOpacity(input: {
  isDefeated: boolean
  /** From {@link hasBattlefieldPresence}; false ⇒ banished / off-grid style dimming when still in initiative. */
  hasBattlefieldPresence: boolean
}): number {
  if (input.isDefeated) return PARTICIPATION_VISUALS.defeated.opacity
  if (!input.hasBattlefieldPresence) return PARTICIPATION_VISUALS.battlefieldAbsent.opacity
  return 1
}

export function getTurnOrderRowOpacity(input: {
  status: TurnOrderStatus
  /** True when the combatant is not defeated but has no battlefield presence (banished, off-grid, …). */
  isBattlefieldAbsent: boolean
}): number {
  if (input.status === 'defeated') return PARTICIPATION_VISUALS.defeated.opacity
  if (input.isBattlefieldAbsent) return PARTICIPATION_VISUALS.battlefieldAbsent.opacity
  return 1
}
