export { getCombatantDisplayLabel } from './combatant-display-label'
export {
  canCombatantTakeActions,
  canCombatantTakeBonusActions,
  canCombatantTakeReactions,
  canTargetAsDeadCreature,
  getCombatantTurnStatus,
  hasBattlefieldPresence,
  hasConsumableRemains,
  hasIntactRemainsForRevival,
  hasRemainsOnGrid,
  isActiveCombatant,
  isDeadCombatant,
  isDefeatedCombatant,
  shouldAutoSkipCombatantTurn,
} from './combatant-participation'
export {
  appendEncounterLogEvent,
  appendEncounterNote,
  appendHookTriggeredLog,
  getEncounterCombatantLabel,
} from './logging'
export * from './types'
export {
  addAttachedAuraInstance,
  removeAttachedAurasForSource,
  removeAttachedAurasForSpell,
} from './attached-aura-mutations'
export type { AttachedBattlefieldEffectSource } from './attached-battlefield-source'
export type { BattlefieldEffectAnchor } from './battlefield-effect-anchor'
export { resolveBattlefieldEffectOriginCellId } from './battlefield-effect-anchor'
export {
  reconcileBattlefieldEffectAnchors,
  moveGridObstacleInEncounterState,
} from './battlefield-effect-anchor-reconciliation'
export {
  attachedAuraInstanceId,
  attachedBattlefieldSourceEquals,
  concentrationLinkedMarkerIdForSpellAttachedEmanation,
} from './attached-battlefield-source'
export {
  getEffectsForAttachedBattlefieldSource,
  getLabelForAttachedBattlefieldSource,
  type BattlefieldAttachedSourceResolutionOptions,
} from './battlefield-attached-source-effects'
export {
  resolveIntervalEffectsForCombatantAtTurnBoundary,
  type BattlefieldIntervalResolutionOptions,
} from './battlefield-interval-resolution'
export {
  resolveAttachedAuraSpatialEntryAfterMovement,
  type BattlefieldSpatialEntryResolutionOptions,
} from './battlefield-spatial-entry-resolution'
export {
  combatantHasSpatialSpeedReduction,
  getEffectiveGroundMovementBudgetFt,
  getSpatialAttachedAuraSpeedMultiplier,
  getSpeedMultiplyProductFromSpell,
  type BattlefieldSpellContext,
  type SpatialBattlefieldPresentationOptions,
} from './battlefield-spatial-movement-modifiers'
export {
  addConditionToCombatant,
  addDamageResistanceMarker,
  addRollModifierToCombatant,
  addStateToCombatant,
  addStatModifierToCombatant,
  applyDamageToCombatant,
  applyHealingToCombatant,
  dropConcentration,
  removeDamageResistanceMarker,
  removeConditionFromCombatant,
  removeStateFromCombatant,
  removeStatesByClassification,
  setConcentration,
  tickConcentrationDuration,
  updateEncounterCombatant,
  patchCombatantEquipmentSnapshot,
  updateEncounterEnvironmentBaseline,
} from './mutations'
export { inferStatModifierEligibilityFromEffect } from './equipment-eligibility'
export {
  lineOfSightClear,
  lineOfEffectClear,
  canSeeForTargeting,
  canPerceiveTargetOccupantForCombat,
  resolveCombatantPairVisibilityForAttackRoll,
  getAttackVisibilityRollModifiersFromPair,
} from './visibility-seams'
export {
  DEFAULT_OPPORTUNITY_ATTACK_REACH_FT,
  getDefaultMeleeReachFtForOpportunityAttack,
  reactorHasReactionBudgetForOpportunityAttack,
  didHostileMoverLeaveMeleeReachOfReactor,
  canReactorPerceiveDepartingOccupantForOpportunityAttack,
  getOpportunityAttackLegalityDenialReason,
  getCombatantIdsEligibleForOpportunityAttackAgainstMover,
  type OpportunityAttackLegalityDenialReason,
} from './opportunity-attack'
export {
  combatantHasBattlefieldAbsenceEngineState,
  findNearestUnoccupiedPassableCell,
  markerCausesBattlefieldAbsence,
  maybeRestoreBattlefieldPlacement,
  reconcileBattlefieldPresenceForCombatants,
  stripPlacementAndRememberReturnCell,
} from './battlefield-return-placement'
export {
  createEncounterState,
  advanceEncounterTurn,
  formatRuntimeEffectLabel,
  mergeCombatantsIntoEncounter,
  removeCombatantFromInitiativeOrder,
  type AdvanceEncounterTurnOptions,
} from './runtime'
export { triggerManualHook } from './manual-hooks'
export { effectDurationToRuntimeDuration, formatMarkerLabel } from './shared'
export { combatantToCreatureSnapshot } from './combatant-evaluation-snapshot'
export { isImmuneToConditionIncludingScopedGrants } from './condition-immunity-resolution'
export {
  ALL_MARKER_RULES,
  CONDITION_RULES,
  ENGINE_STATE_RULES,
  canTakeActions,
  canTakeReactions,
  getActiveConsequences,
  getActiveEngineStateRuleIds,
  getBattlefieldPresenceSkipReason,
  getSpeedConsequences,
  getIncomingAttackModifiers,
  getOutgoingAttackModifiers,
  getIncomingAttackModifiersForAttack,
  getOutgoingAttackModifiersForAttack,
  hasBattlefieldAbsenceConsequence,
  shouldCountAttackModForAttackRoll,
  autoFailsSave,
  getSaveModifiersFromConditions,
  getDamageResistanceFromConditions,
  incomingHitBecomesCrit,
  getConditionSourceIds,
  hasConditionFromSource,
  getSourceRelativeRestrictions,
  cannotTargetWithHostileAction,
  canSpeak,
  isAwareOfSurroundings,
  canSee,
  getActiveConsequencesWithOrigin,
  type BattlefieldAbsenceConsequence,
  type ConditionConsequence,
  type ConditionRule,
  type MarkerRule,
  type SourceRelativeRestriction,
  type ConsequenceWithOrigin,
} from './condition-rules'
