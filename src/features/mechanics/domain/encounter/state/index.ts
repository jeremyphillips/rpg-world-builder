export { getCombatantDisplayLabel } from './combatants/combatant-display-label'
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
} from './combatants/combatant-participation'
export {
  appendEncounterLogEvent,
  appendEncounterNote,
  appendHookTriggeredLog,
  getEncounterCombatantLabel,
} from './effects/logging'
export * from './types'
export {
  addAttachedAuraInstance,
  removeAttachedAurasForSource,
  removeAttachedAurasForSpell,
} from './auras/attached-aura-mutations'
export type { AttachedBattlefieldEffectSource } from './auras/attached-battlefield-source'
export type { BattlefieldEffectAnchor } from './battlefield/battlefield-effect-anchor'
export { resolveBattlefieldEffectOriginCellId } from './battlefield/battlefield-effect-anchor'
export {
  reconcileBattlefieldEffectAnchors,
  moveGridObstacleInEncounterState,
} from './auras/battlefield-effect-anchor-reconciliation'
export {
  attachedAuraInstanceId,
  attachedBattlefieldSourceEquals,
  concentrationLinkedMarkerIdForSpellAttachedEmanation,
} from './auras/attached-battlefield-source'
export {
  getEffectsForAttachedBattlefieldSource,
  getLabelForAttachedBattlefieldSource,
  type BattlefieldAttachedSourceResolutionOptions,
} from './auras/battlefield-attached-source-effects'
export {
  resolveIntervalEffectsForCombatantAtTurnBoundary,
  type BattlefieldIntervalResolutionOptions,
} from './battlefield/battlefield-interval-resolution'
export {
  resolveAttachedAuraSpatialEntryAfterMovement,
  type BattlefieldSpatialEntryResolutionOptions,
} from './battlefield/battlefield-spatial-entry-resolution'
export {
  combatantHasSpatialSpeedReduction,
  getEffectiveGroundMovementBudgetFt,
  getSpatialAttachedAuraSpeedMultiplier,
  getSpeedMultiplyProductFromSpell,
  type BattlefieldSpellContext,
  type SpatialBattlefieldPresentationOptions,
} from './battlefield/battlefield-spatial-movement-modifiers'
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
} from './mutations/mutations'
export { inferStatModifierEligibilityFromEffect } from './combatants/equipment-eligibility'
export {
  lineOfSightClear,
  lineOfEffectClear,
  canSeeForTargeting,
  canPerceiveTargetOccupantForCombat,
  evaluatePerceiveTargetOccupantForCombat,
  formatPerceiveTargetOccupantBreakdownCompact,
  formatStealthRevealHumanReadable,
  resolveCombatantPairVisibilityForAttackRoll,
  getAttackVisibilityRollModifiersFromPair,
  type PerceiveTargetOccupantBreakdown,
  type PerceiveTargetOccupantEvaluation,
} from './visibility/visibility-seams'
export {
  DEFAULT_OPPORTUNITY_ATTACK_REACH_FT,
  getDefaultMeleeReachFtForOpportunityAttack,
  reactorHasReactionBudgetForOpportunityAttack,
  didHostileMoverLeaveMeleeReachOfReactor,
  canReactorPerceiveDepartingOccupantForOpportunityAttack,
  getOpportunityAttackLegalityDenialReason,
  getCombatantIdsEligibleForOpportunityAttackAgainstMover,
  type OpportunityAttackLegalityDenialReason,
} from './reactions/opportunity-attack'
export { getCombatantHideEligibilityExtensionOptions } from './stealth/combatant-hide-eligibility'
export { FEAT_IDS_ALLOW_HALF_COVER_FOR_HIDE, featGrantsAllowHalfCoverForHide } from './stealth/hide-eligibility-feat-sources'
export {
  RUNTIME_MARKER_HIDE_ELIGIBILITY_ALLOW_HALF_COVER_ID,
  RUNTIME_MARKER_HIDE_ELIGIBILITY_ALLOW_DIM_LIGHT_ID,
  RUNTIME_MARKER_HIDE_ELIGIBILITY_ALLOW_MAGICAL_CONCEALMENT_ID,
  RUNTIME_MARKER_HIDE_ELIGIBILITY_ALLOW_DIFFICULT_TERRAIN_ID,
  RUNTIME_MARKER_HIDE_ELIGIBILITY_ALLOW_HIGH_WIND_ID,
  mergeHideEligibilityFeatureFlagsOr,
  resolveTemporaryHideEligibilityFeatureFlagsFromCombatantRuntime,
} from './stealth/hide-eligibility-runtime-sources'
export {
  canVisuallyPerceiveSubjectForRules,
  getSightBasedCheckLegalityDenialReason,
  cellTerrainCoverSupportsHideBaseline,
  cellWorldSupportsDifficultTerrainHideBasis,
  cellWorldSupportsHighWindHideBasis,
  cellWorldSupportsHideAttemptWorldBasis,
  cellWorldSupportsHideConcealment,
  getHideAttemptEligibilityDenialReason,
  pairSupportsHideWorldBasisFromObserver,
  resolveHideEligibilityForCombatant,
  type GetHideAttemptEligibilityDenialReasonOptions,
  type SightBasedCheckDenialReason,
  type HideAttemptEligibilityDenialReason,
  type HideEligibilityExtensionOptions,
  type HideEligibilityFeatureFlags,
} from './stealth/sight-hide-rules'
export {
  maxTerrainCoverGrade,
  resolveTerrainCoverGradeForHideFromObserver,
  terrainCoverGradeSupportsHideAttempt,
} from './environment/observer-hide-terrain-cover'
export {
  applyStealthHideSuccess,
  breakStealthOnAttack,
  getHideActionUnavailableReason,
  getStealthHideAttemptDenialReason,
  isHiddenFromObserver,
  applyEncounterEnvironmentBaselinePatchAndReconcileStealth,
  reconcileStealthAfterMovementOrEnvironmentChange,
  reconcileStealthHiddenForPerceivedObservers,
  resolveDefaultHideObservers,
  resolveHideWithPassivePerception,
  stealthBeatsPassivePerception,
  type HideResolutionOutcome,
  type StealthRulesOptions,
} from './stealth/stealth-rules'
export {
  STEALTH_DEBUG_REASON,
  appendStealthBrokenOnAttackNote,
  appendStealthHideBasisLostContextNote,
  appendStealthHideSuccessAppliedNote,
  appendStealthMovementRecheckHeaderNote,
  appendStealthPrunedObserverCanPerceiveNote,
} from './stealth/stealth-debug-log'
export {
  applyNoiseAwarenessForSubject,
  clearGuessedCellForObserver,
  getGuessedCellForObserver,
  reconcileAwarenessGuessesWithPerception,
  resolveTargetLocationAwareness,
  setGuessedCellForObserver,
  type NoiseAwarenessKind,
  type TargetLocationAwarenessResolution,
} from './awareness/awareness-rules'
export {
  getCombatantAbilityScore,
  getPassivePerceptionScore,
  getStealthCheckModifier,
} from './awareness/passive-perception'
export { ATTACK_ROLL_READS_STEALTH_HIDDEN_STATE } from './stealth/stealth-attack-integration'
export {
  combatantHasBattlefieldAbsenceEngineState,
  findNearestUnoccupiedPassableCell,
  markerCausesBattlefieldAbsence,
  maybeRestoreBattlefieldPlacement,
  reconcileBattlefieldPresenceForCombatants,
  stripPlacementAndRememberReturnCell,
} from './battlefield/battlefield-return-placement'
export {
  createEncounterState,
  advanceEncounterTurn,
  formatRuntimeEffectLabel,
  mergeCombatantsIntoEncounter,
  removeCombatantFromInitiativeOrder,
  type AdvanceEncounterTurnOptions,
} from './runtime'
export { triggerManualHook } from './effects/manual-hooks'
export { effectDurationToRuntimeDuration, formatMarkerLabel } from './shared'
export { combatantToCreatureSnapshot } from './combatants/combatant-evaluation-snapshot'
export { isImmuneToConditionIncludingScopedGrants } from './conditions/condition-immunity-resolution'
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
} from './conditions/condition-rules'
