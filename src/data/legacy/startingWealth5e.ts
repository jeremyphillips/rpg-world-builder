import type { WealthTier } from './classes/types'

/** 5e starting wealth tiers (DMG p. 38 "Starting Equipment" variant).
 *  Shared by all 5e classes; class-specific classInitialGold is only used at level 1. */
export const startingWealthTiers5e: WealthTier[] = [
  { levelRange: [1, 4],   baseGold: 125,  maxItemValue: 75 },
  { levelRange: [5, 10],  baseGold: 500,  maxItemValue: 200 },
  { levelRange: [11, 20], baseGold: 5000, maxItemValue: 2000 }
]

export const startingWealth5e = {
  classInitialGold: '5d4 * 10',
  tiers: startingWealthTiers5e
}
