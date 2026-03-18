import { getClassProgression } from './getClassProgression'
import type { DieFace } from '@/features/mechanics/domain/dice/dice.types'

export interface HitPointInfo {
  hitDie: DieFace
  averageHp: number
  /** True for editions (e.g. 4e) that grant flat HP per level instead of a hit die */
  isFlat?: boolean
  flatHp?: number
}

/** Derive hit-die size, average HP, and flat-HP info from a class */
export function getHitPointInfoByClassId(
  classId: string | undefined
): HitPointInfo {
  const prog = getClassProgression(classId)
  const hitDie = prog?.hitDie ?? 8
  const averageHp = Math.floor(hitDie / 2) + 1
  const isFlat = !hitDie && prog?.hpPerLevel != null
  const flatHp = prog?.hpPerLevel ?? averageHp

  return { hitDie, averageHp, isFlat, flatHp }
}
