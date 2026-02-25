import type { WealthTier } from './classes/types'

/** 3e Wealth By Level (DMG Table 5-1).
 *  Level 1 uses the class-specific classInitialGold / avgGold instead.
 *  Each entry is a single-level tier for precise wealth targets. */
export const startingWealthTiers3e: WealthTier[] = [
  { levelRange: [2, 2],   baseGold: 900 },
  { levelRange: [3, 3],   baseGold: 2700 },
  { levelRange: [4, 4],   baseGold: 5400 },
  { levelRange: [5, 5],   baseGold: 9000 },
  { levelRange: [6, 6],   baseGold: 13000 },
  { levelRange: [7, 7],   baseGold: 19000 },
  { levelRange: [8, 8],   baseGold: 27000 },
  { levelRange: [9, 9],   baseGold: 36000 },
  { levelRange: [10, 10], baseGold: 49000 },
  { levelRange: [11, 11], baseGold: 66000 },
  { levelRange: [12, 12], baseGold: 88000 },
  { levelRange: [13, 13], baseGold: 110000 },
  { levelRange: [14, 14], baseGold: 150000 },
  { levelRange: [15, 15], baseGold: 200000 },
  { levelRange: [16, 16], baseGold: 260000 },
  { levelRange: [17, 17], baseGold: 340000 },
  { levelRange: [18, 18], baseGold: 440000 },
  { levelRange: [19, 19], baseGold: 580000 },
  { levelRange: [20, 20], baseGold: 760000 }
]
