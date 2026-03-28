/**
 * Encounter visibility: line-of-sight (`visibility-los.ts`) and re-exports from `combatant-pair-visibility.ts`.
 * `canSeeForTargeting` is the stable public name for spell/ability targeting; implementation is
 * `canPerceiveTargetOccupantForCombat` (same source of truth as attack-roll pair visibility).
 */
export { lineOfSightClear, lineOfEffectClear } from './visibility-los'
export {
  canSeeForTargeting,
  canPerceiveTargetOccupantForCombat,
  evaluatePerceiveTargetOccupantForCombat,
  formatPerceiveTargetOccupantBreakdownCompact,
  formatStealthRevealHumanReadable,
  resolveCombatantPairVisibilityForAttackRoll,
  getAttackVisibilityRollModifiersFromPair,
  type PerceiveTargetOccupantBreakdown,
  type PerceiveTargetOccupantEvaluation,
} from './combatant-pair-visibility'
