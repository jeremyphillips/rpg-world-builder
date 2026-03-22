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
export { createEncounterState, advanceEncounterTurn, formatRuntimeEffectLabel, mergeCombatantsIntoEncounter } from './runtime'
export { triggerManualHook } from './manual-hooks'
export { effectDurationToRuntimeDuration, formatMarkerLabel } from './shared'
export { combatantToCreatureSnapshot } from './combatant-evaluation-snapshot'
export { isImmuneToConditionIncludingScopedGrants } from './condition-immunity-resolution'
export {
  CONDITION_RULES,
  canTakeActions,
  canTakeReactions,
  getActiveConsequences,
  getSpeedConsequences,
  getIncomingAttackModifiers,
  getOutgoingAttackModifiers,
  getIncomingAttackModifiersForAttack,
  getOutgoingAttackModifiersForAttack,
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
  type ConditionConsequence,
  type ConditionRule,
  type SourceRelativeRestriction,
  type ConsequenceWithOrigin,
} from './condition-rules'
