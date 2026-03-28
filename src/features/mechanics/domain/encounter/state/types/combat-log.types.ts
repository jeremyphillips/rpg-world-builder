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
  /** Stealth: hidden-from pruned because observer can perceive subject's occupant (user-facing summary + optional debug trace). */
  | 'stealth-reveal'

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
  debugDetails?: string[]
}
