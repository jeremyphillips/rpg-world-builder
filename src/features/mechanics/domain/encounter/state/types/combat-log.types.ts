export type CombatLogEventType =
  | 'encounter-started'
  | 'turn-started'
  | 'turn-ended'
  | 'round-started'
  | 'action-declared'
  | 'action-resolved'
  | 'attack-hit'
  | 'attack-missed'
  | 'spell-logged'
  | 'hook-triggered'
  | 'effect-expired'
  | 'damage-applied'
  | 'healing-applied'
  | 'condition-applied'
  | 'condition-removed'
  | 'state-applied'
  | 'state-removed'
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
