import type { CharacterClassSummary } from '@/features/character/read-model/character-read.types'

/**
 * Class levels, multiclass joins (` / `), and subclass labels. Does **not** include race or owner.
 * For full list/card subtitles (race · class · owner), use {@link formatCharacterSubtitleLine}.
 */
export function formatCharacterIdentityLine(classes: CharacterClassSummary[]): string {
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
