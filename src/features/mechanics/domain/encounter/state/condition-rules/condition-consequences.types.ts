import type { AbilityRef } from '@/features/mechanics/domain/character'
import type { EffectConditionId } from '@/features/mechanics/domain/effects/effects.types'

export type ConditionConsequence =
  | ActionLimitConsequence
  | MovementConsequence
  | AttackModConsequence
  | SaveModConsequence
  | CheckModConsequence
  | SpeechConsequence
  | AwarenessConsequence
  | VisibilityConsequence
  | CritWindowConsequence
  | SourceRelativeConsequence
  | DamageInteractionConsequence

export interface ActionLimitConsequence {
  kind: 'action_limit'
  cannotTakeActions: true
  cannotTakeReactions?: true
}

export interface MovementConsequence {
  kind: 'movement'
  speedBecomesZero?: true
  standUpCostsHalfMovement?: true
}

export interface AttackModConsequence {
  kind: 'attack_mod'
  appliesTo: 'incoming' | 'outgoing'
  modifier: 'advantage' | 'disadvantage'
  range?: 'melee' | 'ranged' | 'any'
}

export interface SaveModConsequence {
  kind: 'save_mod'
  appliesTo: 'self'
  abilities: AbilityRef[]
  modifier: 'auto_fail' | 'advantage' | 'disadvantage'
}

export interface CheckModConsequence {
  kind: 'check_mod'
  abilities: 'all' | AbilityRef[]
  modifier: 'advantage' | 'disadvantage'
}

export interface SpeechConsequence {
  kind: 'speech'
  cannotSpeak?: true
}

export interface AwarenessConsequence {
  kind: 'awareness'
  unawareOfSurroundings?: true
}

export interface VisibilityConsequence {
  kind: 'visibility'
  cannotSee?: true
  unseenByDefault?: true
}

export interface CritWindowConsequence {
  kind: 'crit_window'
  incomingMeleeWithinFt: number
  becomeCritical: true
}

export interface SourceRelativeConsequence {
  kind: 'source_relative'
  cannotAttackSource?: true
  cannotMoveCloserToSource?: true
  whileSourceInSight?: true
}

export interface DamageInteractionConsequence {
  kind: 'damage_interaction'
  damageType: 'all' | string
  modifier: 'resistance' | 'vulnerability'
}

export interface ConditionRule {
  id: EffectConditionId
  label: string
  consequences: ConditionConsequence[]
}
