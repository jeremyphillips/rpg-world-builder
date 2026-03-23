import type { CharacterClassSummary } from '@/features/character/read-model/character-read.types'

export function formatCharacterClassLine(classes: CharacterClassSummary[]): string {
  return Array.isArray(classes) && classes.length > 0
    ? classes
        .filter((c) => c && (c.className || c.classId))
        .map((c) => {
          const base = c.className || c.classId || ''
          const sub = c.subclassName ? ` (${c.subclassName})` : ''
          const levelStr = c.level ? ` Lvl ${c.level}` : ''
          return `${base}${sub}${levelStr}`
        })
        .join(' / ')
    : ''
}
