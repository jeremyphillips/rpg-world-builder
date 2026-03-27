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
} from './mutations'
export { inferStatModifierEligibilityFromEffect } from './equipment-eligibility'
export {
  lineOfSightClear,
  lineOfEffectClear,
  canSeeForTargeting,
} from './visibility-seams'
export {
  combatantHasBattlefieldAbsenceEngineState,
  findNearestUnoccupiedPassableCell,
  markerCausesBattlefieldAbsence,
  maybeRestoreBattlefieldPlacement,
  reconcileBattlefieldPresenceForCombatants,
  stripPlacementAndRememberReturnCell,
} from './battlefield-return-placement'
export { createEncounterState, advanceEncounterTurn, formatRuntimeEffectLabel, mergeCombatantsIntoEncounter, removeCombatantFromInitiativeOrder } from './runtime'
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
