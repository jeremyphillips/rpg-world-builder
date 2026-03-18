import type { XpTable } from './xp.types'

/**
 * Look up the XP required to reach a given level.
 */
export const getXpForLevel = (
  level: number,
  xpTable?: XpTable,
): number => {
  if (!xpTable?.length) return 0

  const maxLevel = xpTable.length > 0
    ? Math.max(...xpTable.map(e => e.level))
    : 1

  const target = Math.min(Math.max(1, level), maxLevel)
  const entry = xpTable.find(e => e.level === target)
  return entry?.xpRequired ?? 0
}
