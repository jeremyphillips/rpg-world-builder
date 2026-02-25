import type { SpellWithEntry } from '../catalog/types'

/** Group spells by level, sorted ascending. */
export function groupSpellsByLevel(spells: SpellWithEntry[]): Map<number, SpellWithEntry[]> {
  const groups = new Map<number, SpellWithEntry[]>()
  for (const s of spells) {
    if (!groups.has(s.level)) groups.set(s.level, [])
    groups.get(s.level)!.push(s)
  }
  return new Map([...groups.entries()].sort(([a], [b]) => a - b))
}
