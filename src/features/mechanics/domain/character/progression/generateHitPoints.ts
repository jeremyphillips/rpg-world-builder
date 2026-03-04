import type { HitPoints } from '@/shared/types/character.core'
import { getAverageHitPointsForLevel } from './getAverageHitPointsForLevel'
import { getHitPointInfoByClassId } from '@/features/mechanics/domain/classes/progression'
import { rollHitDie } from '@/features/mechanics/domain/dice'

/**
 * Generate total hit points for a new character.
 * Level 1 always receives max hit die; subsequent levels use the chosen mode.
 */
export type HitPointMode = 'rolled' | 'average'

export function generateHitPoints(
  classes: { classId?: string; level: number }[],
  mode: HitPointMode = 'average',
): HitPoints {
  let total = 0

  for (const cls of classes) {
    if (!cls.classId) continue
    const info = getHitPointInfoByClassId(cls.classId)

    for (let lvl = 1; lvl <= cls.level; lvl++) {
      if (lvl === 1 && cls === classes[0]) {
        total += info?.isFlat ? info?.flatHp ?? 0 : info?.hitDie ?? 8
      } else if (mode === 'rolled') {
        total += info?.isFlat ? info?.flatHp ?? 0 : rollHitDie(info?.hitDie ?? 8)
      } else {
        total += getAverageHitPointsForLevel(info ?? { hitDie: 8, averageHp: 0, isFlat: false, flatHp: 0 } as HitPointInfo)
      }
    }
  }

  return { total, generationMethod: mode }
}