import { getCellForCombatant, gridDistanceFt } from '@/features/encounter/space'

import { isActiveCombatant } from '../combatants/combatant-participation'
import { canTakeReactions } from '../conditions/condition-rules/condition-queries'
import { canPerceiveTargetOccupantForCombat } from '../visibility/combatant-pair-visibility'
import type { CombatantInstance } from '../types'
import type { EncounterState } from '../types'
import type { EncounterViewerPerceptionCapabilities } from '../../environment/perception.types'

/**
 * Default melee reach (feet) for opportunity attacks when no melee attack entry supplies `range`.
 */
export const DEFAULT_OPPORTUNITY_ATTACK_REACH_FT = 5

/**
 * Best-effort melee reach for OA: first melee attack’s `rangeFt`, else {@link DEFAULT_OPPORTUNITY_ATTACK_REACH_FT}.
 */
export function getDefaultMeleeReachFtForOpportunityAttack(combatant: CombatantInstance): number {
  const melee = combatant.attacks.find((a) => a.range?.kind === 'melee')
  if (melee?.range?.kind === 'melee') return melee.range.rangeFt
  return DEFAULT_OPPORTUNITY_ATTACK_REACH_FT
}

/**
 * Whether the reactor can spend a reaction **or** an opportunity-only extra reaction (e.g. hydra heads)
 * on an opportunity attack. Does not check leave-reach or sight.
 */
export function reactorHasReactionBudgetForOpportunityAttack(reactor: CombatantInstance): boolean {
  if (!canTakeReactions(reactor)) return false
  const tr = reactor.turnResources
  if (!tr) return false
  if (tr.opportunityAttackReactionsRemaining > 0) return true
  return tr.reactionAvailable
}

/**
 * Spatial only: did `moverId` move such that they were within `reactorReachFt` of `reactorId` before
 * the move and are **not** within that reach after? Requires full grid state; if space/placements are
 * missing, returns **false** (no leave-reach trigger — we do not guess geometry).
 */
export function didHostileMoverLeaveMeleeReachOfReactor(
  stateBeforeMove: EncounterState,
  stateAfterMove: EncounterState,
  moverId: string,
  reactorId: string,
  reactorReachFt: number,
): boolean {
  if (moverId === reactorId) return false
  const space = stateBeforeMove.space
  const beforePl = stateBeforeMove.placements
  const afterPl = stateAfterMove.placements
  if (!space || !beforePl || !afterPl) return false

  const cellMoverBefore = getCellForCombatant(beforePl, moverId)
  const cellMoverAfter = getCellForCombatant(afterPl, moverId)
  const cellReactor = getCellForCombatant(beforePl, reactorId)
  if (!cellMoverBefore || !cellMoverAfter || !cellReactor) return false

  const distBefore = gridDistanceFt(space, cellReactor, cellMoverBefore)
  const distAfter = gridDistanceFt(space, cellReactor, cellMoverAfter)
  if (distBefore === undefined || distAfter === undefined) return false

  const wasInReach = distBefore <= reactorReachFt
  const stillInReach = distAfter <= reactorReachFt
  return wasInReach && !stillInReach
}

/**
 * Sight/perception legality for opportunity attacks: the reactor must perceive the **departing creature as an
 * occupant** (same seam as `canSeeForTargeting` and attack-roll pair visibility). Uses **pre-move** encounter
 * state so the mover is still evaluated at the cell they left from.
 *
 * **Missing tactical data:** follows {@link canPerceiveTargetOccupantForCombat} (permissive occupant
 * visibility after condition/LOS gates when no grid).
 */
export function canReactorPerceiveDepartingOccupantForOpportunityAttack(
  stateBeforeMove: EncounterState,
  reactorId: string,
  departeeId: string,
  options?: { capabilities?: EncounterViewerPerceptionCapabilities },
): boolean {
  return canPerceiveTargetOccupantForCombat(stateBeforeMove, reactorId, departeeId, options)
}

export type OpportunityAttackLegalityDenialReason =
  | 'self'
  | 'not-active'
  | 'not-hostile'
  | 'did-not-leave-reach'
  | 'cannot-take-reactions'
  | 'no-reaction-budget'
  | 'cannot-perceive-departing-occupant'

/**
 * Single predicate for OA **legality** (spatial leave-reach + hostile + active + reaction budget + shared
 * occupant sight). Does **not** spend a reaction or create an attack — UI/resolver calls this before offering
 * an OA.
 *
 * Returns `null` when the opportunity attack is allowed; otherwise a kebab-case denial reason.
 */
export function getOpportunityAttackLegalityDenialReason(
  stateBeforeMove: EncounterState,
  stateAfterMove: EncounterState,
  moverId: string,
  reactorId: string,
  options?: {
    capabilities?: EncounterViewerPerceptionCapabilities
    /** Defaults from {@link getDefaultMeleeReachFtForOpportunityAttack} for the reactor. */
    reactorReachFt?: number
  },
): OpportunityAttackLegalityDenialReason | null {
  if (moverId === reactorId) return 'self'

  const mover = stateBeforeMove.combatantsById[moverId]
  const reactor = stateBeforeMove.combatantsById[reactorId]
  if (!mover || !reactor) return 'not-active'

  if (!isActiveCombatant(mover) || !isActiveCombatant(reactor)) return 'not-active'

  if (mover.side === reactor.side) return 'not-hostile'

  const reachFt = options?.reactorReachFt ?? getDefaultMeleeReachFtForOpportunityAttack(reactor)
  if (!didHostileMoverLeaveMeleeReachOfReactor(stateBeforeMove, stateAfterMove, moverId, reactorId, reachFt)) {
    return 'did-not-leave-reach'
  }

  if (!canTakeReactions(reactor)) return 'cannot-take-reactions'
  if (!reactorHasReactionBudgetForOpportunityAttack(reactor)) return 'no-reaction-budget'

  if (
    !canReactorPerceiveDepartingOccupantForOpportunityAttack(stateBeforeMove, reactorId, moverId, options)
  ) {
    return 'cannot-perceive-departing-occupant'
  }

  return null
}

/**
 * All combatants that could legally make an opportunity attack against `moverId` for this movement
 * (each passes {@link getOpportunityAttackLegalityDenialReason} with `null`).
 */
export function getCombatantIdsEligibleForOpportunityAttackAgainstMover(
  stateBeforeMove: EncounterState,
  stateAfterMove: EncounterState,
  moverId: string,
  options?: {
    capabilities?: EncounterViewerPerceptionCapabilities
    reactorReachFtById?: Record<string, number>
  },
): string[] {
  const out: string[] = []
  for (const id of Object.keys(stateBeforeMove.combatantsById)) {
    if (id === moverId) continue
    const reach = options?.reactorReachFtById?.[id]
    if (
      getOpportunityAttackLegalityDenialReason(stateBeforeMove, stateAfterMove, moverId, id, {
        capabilities: options?.capabilities,
        reactorReachFt: reach,
      }) === null
    ) {
      out.push(id)
    }
  }
  return out
}
