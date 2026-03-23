export type CombatLogPresentationMode = 'compact' | 'normal' | 'debug'

export type CombatLogEntryImportance = 'headline' | 'supporting' | 'debug'

export type CombatLogEntry = {
  id: string
  round: number
  turn: number
  category:
    | 'encounter'
    | 'turn'
    | 'action'
    | 'attack'
    | 'damage'
    | 'healing'
    | 'condition'
    | 'effect'
    | 'system'
  importance: CombatLogEntryImportance
  message: string
  details?: string[]
  debugDetails?: string[]
}
