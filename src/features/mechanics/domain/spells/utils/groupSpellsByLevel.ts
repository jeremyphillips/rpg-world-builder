import type { Spell } from '@/features/content/shared/domain/types'

/** Group spells by level, sorted ascending. */
export function groupSpellsByLevel(spells: Spell[]): Map<number, Spell[]> {
  const groups = new Map<number, Spell[]>()
  for (const s of spells) {
    if (!groups.has(s.level)) groups.set(s.level, [])
    groups.get(s.level)!.push(s)
  }
  return new Map([...groups.entries()].sort(([a], [b]) => a - b))
}
