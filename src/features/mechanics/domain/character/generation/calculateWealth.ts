import type { WealthTier } from '@/features/classes/domain/types'

/**
 * Unified wealth calculation for all editions.
 *
 * Resolution order:
 *  1. Tier-based — find a matching tier by totalLevel (5e, 3e, 3.5e, 4e)
 *  2. Formula-based — avgGold + goldPerLevel × (level − 1) (2e, 1e, OD&D, Basic)
 *     Also serves as the level-1 fallback when tiers start at level 2 (3e/3.5e)
 */
export const calculateWealth = (
  totalLevel: number,
  startingWealthTiers: WealthTier[]
  // startingWealth: StartingWealth
) => {
  // 1. Tier-based: find matching tier
  if (startingWealthTiers?.length) {
    const tier = startingWealthTiers.find(
      t => totalLevel >= t.levelRange[0] && totalLevel <= t.levelRange[1]
    )
    if (tier) {
      return { gp: tier.baseGold, sp: 0, cp: 0, maxItemValue: tier.maxItemValue }
    }
  }

  // TODO: Add formula-based calculation
  // 2. Formula-based: avgGold + goldPerLevel × (level − 1)
  // if (startingWealth.avgGold != null) {
  //   const gp = startingWealth.avgGold
  //     + (startingWealth.goldPerLevel ?? 0) * Math.max(0, totalLevel - 1)
  //   return { gp, sp: 0, cp: 0 }
  // }

  return null
}
