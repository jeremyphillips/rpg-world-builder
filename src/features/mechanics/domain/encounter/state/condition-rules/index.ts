export type {
  ConditionConsequence,
  ConditionRule,
  ActionLimitConsequence,
  MovementConsequence,
  AttackModConsequence,
  SaveModConsequence,
  CheckModConsequence,
  SpeechConsequence,
  AwarenessConsequence,
  VisibilityConsequence,
  CritWindowConsequence,
  SourceRelativeConsequence,
  DamageInteractionConsequence,
} from './condition-consequences.types'
export { CONDITION_RULES } from './condition-definitions'
export {
  getActiveConsequences,
  canTakeActions,
  canTakeReactions,
  getSpeedConsequences,
  getIncomingAttackModifiers,
  getOutgoingAttackModifiers,
  autoFailsSave,
  getSaveModifiersFromConditions,
} from './condition-queries'
