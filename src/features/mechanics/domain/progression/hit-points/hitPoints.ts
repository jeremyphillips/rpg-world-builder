import type { HitPoints } from '@/shared/types/character.core'
import { getClassProgression } from '../class/classProgression'

export type HitPointMode = 'rolled' | 'average'

export interface HitPointInfo {
  hitDie: number
  averageHp: number
  /** True for editions (e.g. 4e) that grant flat HP per level instead of a hit die */
  isFlat: boolean
  flatHp: number
}

/** Derive hit-die size, average HP, and flat-HP info from a class + edition. */
export function getHitPointInfo(
  classId: string | undefined,
  edition: string | undefined,
): HitPointInfo {
  const prog = getClassProgression(classId, edition)
  const hitDie = prog?.hitDie ?? 8
  const averageHp = Math.floor(hitDie / 2) + 1
  const isFlat = hitDie === 0 && prog?.hpPerLevel != null
  const flatHp = prog?.hpPerLevel ?? averageHp

  return { hitDie, averageHp, isFlat, flatHp }
}

/** Return the average (or flat) HP gained for one level. */
export function getAverageHpForLevel(info: HitPointInfo): number {
  return info.isFlat ? info.flatHp : info.averageHp
}

/** Roll a hit die and return HP gained (minimum 1). */
export function rollHitDie(hitDie: number): number {
  const rolled = Math.floor(Math.random() * hitDie) + 1
  return Math.max(1, rolled)
}

/**
 * Generate total hit points for a new character.
 * Level 1 always receives max hit die; subsequent levels use the chosen mode.
 */
export function generateHitPoints(
  classes: { classId?: string; level: number }[],
  edition: string | undefined,
  mode: HitPointMode = 'average',
): HitPoints {
  let total = 0

  for (const cls of classes) {
    if (!cls.classId) continue
    const info = getHitPointInfo(cls.classId, edition)

    for (let lvl = 1; lvl <= cls.level; lvl++) {
      if (lvl === 1 && cls === classes[0]) {
        total += info.isFlat ? info.flatHp : info.hitDie
      } else if (mode === 'rolled') {
        total += info.isFlat ? info.flatHp : rollHitDie(info.hitDie)
      } else {
        total += getAverageHpForLevel(info)
      }
    }
  }

  return { total, generationMethod: mode }
}
