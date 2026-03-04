import type { XpTable } from '@/features/mechanics/domain/core/progression/xp/xp.types'

/**
 * Determine the character level for a given XP total.
 * Walks the table from highest level downward, returning the first level
 * whose xpRequired the character meets or exceeds.
 */
export const getLevelForXp = (
  xp: number,
  xpTable?: XpTable,
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