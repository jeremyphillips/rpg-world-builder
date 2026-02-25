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
  event:
    | 'on_attack'
    | 'on_hit'
    | 'on_damage_taken'
    | 'on_turn_start'
    | 'on_turn_end'
    | 'on_spell_cast'
}
