import type { AbilityScoreMethod } from '@/features/mechanics/domain/rulesets/types/abilityScores.types'

export type Rng = () => number

/** Roll a single die with `sides` faces (1-indexed). */
function rollDie(sides: number, rng: Rng): number {
  return Math.floor(rng() * sides) + 1
}

/** Roll `count` dice, return the individual results. */
function rollDice(count: number, sides: number, rng: Rng): number[] {
  return Array.from({ length: count }, () => rollDie(sides, rng))
}

/**
 * 4d6 drop lowest: roll four d6, discard the lowest, sum the remaining three.
 * Standard method from 5e PHB.
 */
export function roll4d6DropLowest(rng: Rng = Math.random): number {
  const rolls = rollDice(4, 6, rng)
  rolls.sort((a, b) => a - b)
  return rolls[1] + rolls[2] + rolls[3]
}

/**
 * 3d6 straight: roll three d6 and sum them.
 * Classic method from earlier editions (1e, 2e, B/X).
 */
export function roll3d6(rng: Rng = Math.random): number {
  return rollDice(3, 6, rng).reduce((sum, n) => sum + n, 0)
}

/**
 * Average (fixed) scores: returns the standard array (15, 14, 13, 12, 10, 8)
 * commonly used as the "average" or point-buy baseline in 5e.
 */
export function averageScores(): number[] {
  return [15, 14, 13, 12, 10, 8]
}

/**
 * Generate a full set of six ability scores using the specified method.
 * Results are returned as raw score arrays (unassigned to specific abilities)
 * so the caller can let the player arrange them.
 */
export function generateScoreArray(method: AbilityScoreMethod, rng: Rng = Math.random): number[] {
  switch (method) {
    case '4d6-drop-lowest':
      return Array.from({ length: 6 }, () => roll4d6DropLowest(rng))
    case '3d6':
      return Array.from({ length: 6 }, () => roll3d6(rng))
    case 'average':
      return averageScores()
    case 'custom':
      return Array.from({ length: 6 }, () => 10)
  }
}
