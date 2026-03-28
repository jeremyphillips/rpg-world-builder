import type { AbilityRef } from '@/features/mechanics/domain/character'

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
  | BattlefieldAbsenceConsequence

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

/**
 * Not on the tactical grid / not a valid on-grid presence target (engine markers such as
 * banished or off-grid). Distinct from SRD conditions; modeled in the engine-state rule map.
 */
export interface BattlefieldAbsenceConsequence {
  kind: 'battlefield_absence'
  absentFromBattlefield: true
  /** When set, drives auto-skip reason and targeting edge cases (banished vs off-grid). */
  presenceReason?: 'banished' | 'off-grid'
}

/** Rule entry for a named marker (core SRD condition or custom engine state). */
export interface MarkerRule {
  id: string
  label: string
  consequences: ConditionConsequence[]
}

/** @deprecated Use {@link MarkerRule}; name kept for call sites tied to core conditions. */
export type ConditionRule = MarkerRule
