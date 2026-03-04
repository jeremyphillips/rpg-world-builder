/**
 * Calculate base max hit points.
 * Pure math — no Character, no effects.
 *
 * Level 1: max hit die + CON modifier
 * Levels 2+: average roll (floor(hitDie/2) + 1) + CON modifier per level
 */
export function calculateBaseHitPoints(
  level: number,
  hitDie: number,
  conScore: number
): number {
  if (level <= 0) return 0

  const conMod = Math.floor((conScore - 10) / 2)

  // 4e flat HP (hitDie === 0 means use flat hpPerLevel, handled by caller)
  if (hitDie <= 0) return 0

  const level1Hp = hitDie + conMod
  if (level === 1) return Math.max(1, level1Hp)

  const avgRoll = Math.floor(hitDie / 2) + 1
  const subsequentLevelsHp = (level - 1) * (avgRoll + conMod)
  return Math.max(1, level1Hp + subsequentLevelsHp)
}
