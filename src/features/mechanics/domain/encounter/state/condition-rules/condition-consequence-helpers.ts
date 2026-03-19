import type { ConditionConsequence } from './condition-consequences.types'

export const cannotAct = (): ConditionConsequence[] => [
  { kind: 'action_limit', cannotTakeActions: true, cannotTakeReactions: true },
]

export const immobile = (): ConditionConsequence[] => [
  { kind: 'movement', speedBecomesZero: true },
]

export const autoFailStrDexSaves = (): ConditionConsequence[] => [
  { kind: 'save_mod', appliesTo: 'self', abilities: ['strength', 'dexterity'], modifier: 'auto_fail' },
]

export const incomingAttackAdvantage = (range: 'melee' | 'ranged' | 'any' = 'any'): ConditionConsequence[] => [
  { kind: 'attack_mod', appliesTo: 'incoming', modifier: 'advantage', range },
]

export const outgoingAttackDisadvantage = (range: 'melee' | 'ranged' | 'any' = 'any'): ConditionConsequence[] => [
  { kind: 'attack_mod', appliesTo: 'outgoing', modifier: 'disadvantage', range },
]

export const nearbyMeleeHitsCrit = (): ConditionConsequence[] => [
  { kind: 'crit_window', incomingMeleeWithinFt: 5, becomeCritical: true },
]

export const cannotSpeak = (): ConditionConsequence[] => [
  { kind: 'speech', cannotSpeak: true },
]

export const unawareOfSurroundings = (): ConditionConsequence[] => [
  { kind: 'awareness', unawareOfSurroundings: true },
]

export const incomingAttackDisadvantage = (range: 'melee' | 'ranged' | 'any' = 'any'): ConditionConsequence[] => [
  { kind: 'attack_mod', appliesTo: 'incoming', modifier: 'disadvantage', range },
]

export const outgoingAttackAdvantage = (range: 'melee' | 'ranged' | 'any' = 'any'): ConditionConsequence[] => [
  { kind: 'attack_mod', appliesTo: 'outgoing', modifier: 'advantage', range },
]
