export type CombatLogEventType =
  | 'encounter_started'
  | 'turn_started'
  | 'turn_ended'
  | 'round_started'
  | 'hook_triggered'
  | 'effect_expired'
  | 'damage_applied'
  | 'healing_applied'
  | 'condition_applied'
  | 'condition_removed'
  | 'state_applied'
  | 'state_removed'
  | 'note'

export interface CombatLogEvent {
  id: string
  timestamp: string
  type: CombatLogEventType
  actorId?: string
  targetIds?: string[]
  round: number
  turn: number
  summary: string
  details?: string
}
