import type { LevelProgression } from '@/data/editions/edition.types'

/**
 * Determine the character level for a given XP total.
 * Walks the table from highest level downward, returning the first level
 * whose xpRequired the character meets or exceeds.
 */
export const getLevelForXp = (
  xp: number,
  xpTable?: LevelProgression[],
): number => {
  if (!xpTable?.length) return 1

  const maxLevel = xpTable.length > 0
    ? Math.max(...xpTable.map(e => e.level))
    : 1

  for (let lvl = maxLevel; lvl >= 1; lvl--) {
    const entry = xpTable.find(e => e.level === lvl)
    if (entry && xp >= entry.xpRequired) return lvl
  }

  return 1
}

/**
 * Look up the XP required to reach a given level.
 */
export const getXpForLevel = (
  level: number,
  xpTable?: LevelProgression[],
): number => {
  if (!xpTable?.length) return 0

  const maxLevel = xpTable.length > 0
    ? Math.max(...xpTable.map(e => e.level))
    : 1

  const target = Math.min(Math.max(1, level), maxLevel)
  const entry = xpTable.find(e => e.level === target)
  return entry?.xpRequired ?? 0
}

/** @deprecated Use `getXpForLevel` — this alias exists for migration. */
export const getXpByLevelAndEdition = getXpForLevel
