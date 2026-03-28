import type { CombatLogEvent, CombatLogEventType } from '@/features/mechanics/domain/encounter'
import type { CombatLogEntry, CombatLogEntryImportance } from '../domain'

const TYPE_TO_CATEGORY: Record<CombatLogEventType, CombatLogEntry['category']> = {
  'encounter-started': 'encounter',
  'round-started': 'encounter',
  'turn-started': 'turn',
  'turn-ended': 'turn',
  'action-declared': 'action',
  'action-resolved': 'action',
  'attack-hit': 'attack',
  'attack-missed': 'attack',
  'spell-logged': 'action',
  'hook-triggered': 'effect',
  'effect-expired': 'effect',
  'damage-applied': 'damage',
  'healing-applied': 'healing',
  'condition-applied': 'condition',
  'condition-removed': 'condition',
  'state-applied': 'effect',
  'state-removed': 'effect',
  'note': 'system',
  'stealth-reveal': 'system',
}

const HEADLINE_TYPES = new Set<CombatLogEventType>([
  'encounter-started',
  'round-started',
  'action-resolved',
  'attack-hit',
  'attack-missed',
  'damage-applied',
  'healing-applied',
  'condition-applied',
  'condition-removed',
  'hook-triggered',
])

const DEBUG_TYPES = new Set<CombatLogEventType>([
  'note',
])

function getImportance(type: CombatLogEventType): CombatLogEntryImportance {
  if (HEADLINE_TYPES.has(type)) return 'headline'
  if (DEBUG_TYPES.has(type)) return 'debug'
  return 'supporting'
}

export function toCombatLogEntry(event: CombatLogEvent): CombatLogEntry {
  return {
    id: event.id,
    round: event.round,
    turn: event.turn,
    category: TYPE_TO_CATEGORY[event.type] ?? 'system',
    importance: getImportance(event.type),
    message: event.summary,
    details: event.details ? [event.details] : undefined,
    debugDetails: event.debugDetails,
  }
}

export function toCombatLogEntries(events: CombatLogEvent[]): CombatLogEntry[] {
  return events.map(toCombatLogEntry)
}
