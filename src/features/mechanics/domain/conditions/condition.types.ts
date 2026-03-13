import type { TriggerType } from '../triggers/trigger.types'

export type Condition =
  | LogicalCondition
  | StateCondition
  | EventCondition
  | ComparisonCondition


type LogicalCondition =
  | { kind: 'and'; conditions: Condition[] }
  | { kind: 'or'; conditions: Condition[] }
  | { kind: 'not'; condition: Condition } 


type StateCondition =
  | {
      kind: 'state'
      target: 'self' | 'target' | 'ally'
      property: string
      equals?: unknown
      notEquals?: unknown
    }

type ComparisonCondition = {
  kind: 'compare'
  target: 'self' | 'target'
  property: string
  operator: '>' | '>=' | '<' | '<=' | '==' | '!='
  value: number
}

type EventCondition = {
  kind: 'event'
  event: TriggerType
}
