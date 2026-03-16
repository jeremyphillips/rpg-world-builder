import type { TriggerType } from '../triggers/trigger.types'
import type { MonsterType } from '@/features/content/monsters/domain/vocab/monster.vocab'

export type ConditionTarget = 'self' | 'target' | 'source' | 'ally'

export type Condition =
  | LogicalCondition
  | StateCondition
  | EventCondition
  | ComparisonCondition
  | CreatureTypeCondition


type LogicalCondition =
  | { kind: 'and'; conditions: Condition[] }
  | { kind: 'or'; conditions: Condition[] }
  | { kind: 'not'; condition: Condition } 


type StateCondition =
  | {
      kind: 'state'
      target: ConditionTarget
      property: string
      equals?: unknown
      notEquals?: unknown
    }

type ComparisonCondition = {
  kind: 'compare'
  target: 'self' | 'target' | 'source'
  property: string
  operator: '>' | '>=' | '<' | '<=' | '==' | '!='
  value: number
}

type EventCondition = {
  kind: 'event'
  event: TriggerType
}

export type CreatureTypeCondition = {
  kind: 'creature-type'
  target: ConditionTarget
  creatureTypes: MonsterType[]
}
