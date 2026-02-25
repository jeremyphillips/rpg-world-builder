import type { AbilityScores } from '@/shared/types/character.core'
import type { Condition } from '../conditions/condition.types'
import type { TriggerType } from '../triggers/trigger.types'
import type { StatTarget } from '../resolution/stat-resolver'

export type Duration = '1 minute' | '1 hour' | '1 day' | '1 week' | '1 month' | '1 year' | 'instant'

export type FormulaDefinition = {}

export type ScalingRule = {}

export type ResourceCost = {
  resource: string
  amount: number
}

export type ModifierEffect = {
  kind: 'modifier'
  target: StatTarget
  mode: 'add' | 'set' | 'multiply'
  value: number | { ability: keyof AbilityScores } | { perLevel: number }
  source?: string
  condition?: Condition
  duration?: Duration
}

export type FormulaEffect = {
  kind: 'formula'
  target: StatTarget
  formula: FormulaDefinition
  source?: string
  condition?: Condition
}

export type ProficiencyGrantValue = {
  target: 'armor' | 'weapon' | 'tool' | 'skill' | 'saving_throw'
  categories?: string[]
  items?: string[]
}

export type GrantEffect = {
  kind: 'grant'
  grantType: 'proficiency' | 'action' | 'spell' | 'condition_immunity'
  value: ProficiencyGrantValue[] | unknown
  source?: string
}


export type ResourceEffect = {
  kind: 'resource'
  resource: {
    id: string
    max: number | ScalingRule
    recharge: 'short_rest' | 'long_rest' | 'none'
    dice?: string
  }
}

export type TriggeredEffect = {
  kind: 'trigger'
  trigger: TriggerType
  effects: Effect[]
  cost?: ResourceCost
}

export type AuraEffect = {
  kind: 'aura'
  range: number
  affects: 'allies' | 'enemies' | 'self'
  effects: Effect[]
}

export type Effect =
  | ModifierEffect
  | FormulaEffect
  | GrantEffect
  | ResourceEffect
  | TriggeredEffect
  | AuraEffect
