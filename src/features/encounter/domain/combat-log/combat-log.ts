import type {
  CombatLogEntry,
  CombatLogEntryImportance,
  CombatLogPresentationMode,
} from './combat-log.types'

export type GroupedLogEntry = {
  groupKey: string
  round: number
  turn: number
  entries: CombatLogEntry[]
}

const IMPORTANCE_VISIBILITY: Record<CombatLogPresentationMode, CombatLogEntryImportance[]> = {
  compact: ['headline'],
  normal: ['headline', 'supporting'],
  debug: ['headline', 'supporting', 'debug'],
}

export function filterLogByMode(
  entries: CombatLogEntry[],
  mode: CombatLogPresentationMode,
): CombatLogEntry[] {
  const visible = new Set(IMPORTANCE_VISIBILITY[mode])
  return entries.filter((entry) => visible.has(entry.importance))
}

export function groupLogEntries(entries: CombatLogEntry[]): GroupedLogEntry[] {
  const groups: GroupedLogEntry[] = []
  let current: GroupedLogEntry | null = null

  for (const entry of entries) {
    const groupKey = `R${entry.round}-T${entry.turn}`

    if (current && current.groupKey === groupKey) {
      current.entries.push(entry)
    } else {
      current = {
        groupKey,
        round: entry.round,
        turn: entry.turn,
        entries: [entry],
      }
      groups.push(current)
    }
  }

  return groups
}

export function formatLogGroupHeader(group: GroupedLogEntry): string {
  return `R${group.round} T${group.turn}`
}

export function formatLogEntryDetail(entry: CombatLogEntry): string {
  const parts = [entry.message]

  if (entry.details && entry.details.length > 0) {
    parts.push(...entry.details.map((d) => `  - ${d}`))
  }

  if (entry.debugDetails && entry.debugDetails.length > 0) {
    parts.push(...entry.debugDetails.map((d) => `  [debug] ${d}`))
  }

  return parts.join('\n')
}
