import type { AbilityScoreMethod } from '@/features/mechanics/domain/rulesets/types/abilityScores.types'
import { generateScoreArray, type Rng } from './methods'
import { ABILITY_KEYS, type AbilityScoreMapResolved, type AbilityKey } from '@/features/mechanics/domain/character'

/**
 * Generate a complete AbilityScores object with scores assigned to abilities
 * in standard order (STR, DEX, CON, INT, WIS, CHA).
 */
export function generateAbilityScores(
  method: AbilityScoreMethod, 
  rng: Rng = Math.random
): AbilityScoreMapResolved {
  const scores = generateScoreArray(method, rng)

  return Object.fromEntries(
    ABILITY_KEYS.map((key, i) => [key, scores[i]])
  ) as AbilityScoreMapResolved
}

/**
 * Assign generated scores to abilities, placing the highest values on the
 * class's priority abilities first, then distributing the rest in descending
 * order across the remaining abilities.
 *
 * Example: a Fighter with priority ['strength', 'constitution'] and scores
 * [15, 14, 13, 12, 10, 8] → STR 15, CON 14, DEX 13, INT 12, WIS 10, CHA 8
 */
export function prioritizeAbilityScores(
  method: AbilityScoreMethod,
  priority: (AbilityKey)[],
  rng: Rng = Math.random,
): AbilityScoreMapResolved {
  const scores = generateScoreArray(method, rng).sort((a, b) => b - a)
  const remaining = ABILITY_KEYS.filter(k => !priority.includes(k))
  const orderedKeys = [...priority, ...remaining]
  
  const result = Object.fromEntries(
    orderedKeys.map((key, i) => [key, scores[i]])
  ) as AbilityScoreMapResolved
  
  return result
}
