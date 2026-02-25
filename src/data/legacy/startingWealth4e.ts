import type { WealthTier } from './classes/types'

/** 4e starting gold by level (simplified — magic item budgets tracked separately).
 *  Heroic tier 1-10, Paragon tier 11-20, Epic tier 21-30. */
export const startingWealthTiers4e: WealthTier[] = [
  // Heroic tier
  { levelRange: [1, 1],   baseGold: 100 },
  { levelRange: [2, 2],   baseGold: 250 },
  { levelRange: [3, 3],   baseGold: 450 },
  { levelRange: [4, 4],   baseGold: 680 },
  { levelRange: [5, 5],   baseGold: 1000 },
  { levelRange: [6, 6],   baseGold: 1800 },
  { levelRange: [7, 7],   baseGold: 2600 },
  { levelRange: [8, 8],   baseGold: 3400 },
  { levelRange: [9, 9],   baseGold: 4200 },
  { levelRange: [10, 10], baseGold: 5000 },
  // Paragon tier
  { levelRange: [11, 11], baseGold: 9000 },
  { levelRange: [12, 12], baseGold: 13000 },
  { levelRange: [13, 13], baseGold: 17000 },
  { levelRange: [14, 14], baseGold: 21000 },
  { levelRange: [15, 15], baseGold: 25000 },
  { levelRange: [16, 16], baseGold: 45000 },
  { levelRange: [17, 17], baseGold: 65000 },
  { levelRange: [18, 18], baseGold: 85000 },
  { levelRange: [19, 19], baseGold: 105000 },
  { levelRange: [20, 20], baseGold: 125000 },
  // Epic tier
  { levelRange: [21, 21], baseGold: 225000 },
  { levelRange: [22, 22], baseGold: 325000 },
  { levelRange: [23, 23], baseGold: 425000 },
  { levelRange: [24, 24], baseGold: 525000 },
  { levelRange: [25, 25], baseGold: 625000 },
  { levelRange: [26, 26], baseGold: 1125000 },
  { levelRange: [27, 27], baseGold: 1625000 },
  { levelRange: [28, 28], baseGold: 2125000 },
  { levelRange: [29, 29], baseGold: 2625000 },
  { levelRange: [30, 30], baseGold: 3125000 }
]

export const startingWealth4e = {
  tiers: startingWealthTiers4e
}
