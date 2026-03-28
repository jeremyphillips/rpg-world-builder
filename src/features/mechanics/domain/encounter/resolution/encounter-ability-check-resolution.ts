import type { EncounterViewerPerceptionCapabilities } from '@/features/mechanics/domain/perception/perception.types'
import {
  getSightBasedCheckLegalityDenialReason,
  type SightBasedCheckDenialReason,
} from '../state/stealth/sight-hide-rules'
import type { EncounterState } from '../state/types'

/**
 * Sight legality for encounter ability/skill **check** effects (`CheckEffect.requiresSight`).
 *
 * When `requiresSight` is false or omitted, returns `null` (no gate). When true, delegates to
 * {@link getSightBasedCheckLegalityDenialReason} — same occupant perception seam as spell targeting,
 * opportunity attacks, and `sight-hide-rules`. Missing tactical grid follows the permissive fallback
 * on `canPerceiveTargetOccupantForCombat` (condition gates still apply, e.g. blinded).
 */
export function getEncounterAbilityCheckSightDenialReason(
  state: EncounterState,
  actorId: string,
  subjectId: string,
  requiresSight: boolean | undefined,
  options?: { capabilities?: EncounterViewerPerceptionCapabilities },
): SightBasedCheckDenialReason | null {
  if (!requiresSight) return null
  return getSightBasedCheckLegalityDenialReason(state, actorId, subjectId, options)
}
