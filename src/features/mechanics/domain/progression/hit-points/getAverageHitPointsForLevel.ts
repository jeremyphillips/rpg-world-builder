import type { HitPointInfo } from '@/features/mechanics/domain/progression/class';

/** Return the average (or flat) HP gained for one level. */
export function getAverageHitPointsForLevel(info: HitPointInfo): number {
  return info?.isFlat ? (info?.flatHp ?? 0) : (info?.averageHp ?? 0)
}
