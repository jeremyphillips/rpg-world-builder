import { getCellForCombatant } from '@/features/encounter/space'
import { resolveWorldEnvironmentFromEncounterState } from '@/features/mechanics/domain/encounter/environment/environment.resolve'
import type { EncounterWorldCellEnvironment } from '@/features/mechanics/domain/encounter/environment/environment.types'

import { canPerceiveTargetOccupantForCombat } from './combatant-pair-visibility'
import type { EncounterState } from './types'
import type { EncounterViewerPerceptionCapabilities } from '../environment/perception.types'

/**
 * Whether the observer can **visually perceive the subject’s occupant** for rules that care about sight
 * (sight-based checks, stealth vs observer, narrative gating). Same implementation as attack/targeting/OA:
 * {@link canPerceiveTargetOccupantForCombat}.
 *
 * **Missing tactical data:** follows that helper’s permissive occupant fallback after condition/LOS gates.
 */
export function canVisuallyPerceiveSubjectForRules(
  state: EncounterState,
  observerId: string,
  subjectId: string,
  options?: { capabilities?: EncounterViewerPerceptionCapabilities },
): boolean {
  return canPerceiveTargetOccupantForCombat(state, observerId, subjectId, options)
}

export type SightBasedCheckDenialReason = 'cannot-perceive-subject'

/**
 * Sight-dependent ability/skill checks: if the observer cannot perceive the subject occupant, the check
 * cannot proceed on sight alone (engine: **blocked** with a kebab-case reason).
 *
 * Callers that need “automatic fail” vs “blocked before roll” can map `cannot-perceive-subject` accordingly.
 */
export function getSightBasedCheckLegalityDenialReason(
  state: EncounterState,
  observerId: string,
  subjectId: string,
  options?: { capabilities?: EncounterViewerPerceptionCapabilities },
): SightBasedCheckDenialReason | null {
  if (!canVisuallyPerceiveSubjectForRules(state, observerId, subjectId, options)) {
    return 'cannot-perceive-subject'
  }
  return null
}

/**
 * World-only: does this cell provide **concealment** sufficient to attempt a Hide action (dim/darkness,
 * light/heavy obscurement, or magical darkness), independent of any viewer?
 *
 * Uses merged {@link EncounterWorldCellEnvironment} — not render/UI state.
 */
export function cellWorldSupportsHideConcealment(world: EncounterWorldCellEnvironment): boolean {
  if (world.visibilityObscured === 'light' || world.visibilityObscured === 'heavy') return true
  if (world.lightingLevel === 'dim' || world.lightingLevel === 'darkness') return true
  if (world.magicalDarkness) return true
  return false
}

export type HideAttemptEligibilityDenialReason =
  | 'self'
  | 'missing-hider-placement'
  | 'observer-sees-without-concealment'

/**
 * Narrow Hide **attempt** eligibility (not a full Stealth contest): whether `hiderId` may attempt to hide
 * from `observerId` using the same **occupant** perception seam plus **concealment** from world state.
 *
 * - If the observer **can** perceive the hider’s **occupant** (`canPerceiveTargetOccupantForCombat`) **and**
 *   the hider’s cell has **no** concealment (bright + clear), hiding in plain sight is denied.
 * - If the observer **cannot** perceive the occupant (heavy obscurement, magical darkness, invisibility, etc.),
 *   the attempt is allowed from a sight perspective.
 * - If the observer **can** perceive the occupant **but** the cell has concealment (e.g. dim, light obscured),
 *   a Hide attempt is allowed (contested Stealth vs passive Perception is out of scope here).
 *
 * **Missing tactical grid / hider placement:** permissive — returns `null` (allow attempt) so behavior
 * matches the pair-visibility fallback when geometry is absent.
 */
export function getHideAttemptEligibilityDenialReason(
  state: EncounterState,
  hiderId: string,
  observerId: string,
  options?: { capabilities?: EncounterViewerPerceptionCapabilities },
): HideAttemptEligibilityDenialReason | null {
  if (hiderId === observerId) return 'self'

  if (!state.space || !state.placements) {
    return null
  }

  const hiderCell = getCellForCombatant(state.placements, hiderId)
  if (!hiderCell) {
    return 'missing-hider-placement'
  }

  const world = resolveWorldEnvironmentFromEncounterState(state, hiderCell)
  const hasConcealment = world != null && cellWorldSupportsHideConcealment(world)

  const observerSeesOccupant = canPerceiveTargetOccupantForCombat(state, observerId, hiderId, options)

  if (observerSeesOccupant && !hasConcealment) {
    return 'observer-sees-without-concealment'
  }

  return null
}
