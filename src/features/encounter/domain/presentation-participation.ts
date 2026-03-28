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

const UNSEEN_FROM_VIEWER_DIM = 0.68

export function getCombatantPreviewCardOpacity(input: {
  isDefeated: boolean
  /** From {@link hasBattlefieldPresence}; false ⇒ banished / off-grid style dimming when still in initiative. */
  hasBattlefieldPresence: boolean
  /** True when viewer presentation is `out-of-sight` or `hidden` (not fully visible to POV). */
  nonVisibleViewerPresentation?: boolean
}): number {
  let o = 1
  if (input.isDefeated) o = PARTICIPATION_VISUALS.defeated.opacity
  else if (!input.hasBattlefieldPresence) o = PARTICIPATION_VISUALS.battlefieldAbsent.opacity
  if (input.nonVisibleViewerPresentation) o *= UNSEEN_FROM_VIEWER_DIM
  return o
}

export function getTurnOrderRowOpacity(input: {
  status: TurnOrderStatus
  /** True when the combatant is not defeated but has no battlefield presence (banished, off-grid, …). */
  isBattlefieldAbsent: boolean
  nonVisibleViewerPresentation?: boolean
}): number {
  let o = 1
  if (input.status === 'defeated') o = PARTICIPATION_VISUALS.defeated.opacity
  else if (input.isBattlefieldAbsent) o = PARTICIPATION_VISUALS.battlefieldAbsent.opacity
  if (input.nonVisibleViewerPresentation) o *= UNSEEN_FROM_VIEWER_DIM
  return o
}
