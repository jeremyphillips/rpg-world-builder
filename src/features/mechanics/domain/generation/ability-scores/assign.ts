import type { AbilityScores, AbilityId } from '@/shared/types/character.core'
import type { AbilityScoreMethod } from '@/data/types'
import { generateScoreArray, type Rng } from './methods'

const ABILITY_KEYS: AbilityId[] = [
  'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
]

/**
 * Generate a complete AbilityScores object with scores assigned to abilities
 * in standard order (STR, DEX, CON, INT, WIS, CHA).
 */
export function generateAbilityScores(method: AbilityScoreMethod, rng: Rng = Math.random): AbilityScores {
  const scores = generateScoreArray(method, rng)
  const result: AbilityScores = {}
  for (let i = 0; i < ABILITY_KEYS.length; i++) {
    result[ABILITY_KEYS[i]] = scores[i]
  }
  return result
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
  priority: (keyof AbilityScores)[],
  rng: Rng = Math.random,
): AbilityScores {
  const scores = generateScoreArray(method, rng).sort((a, b) => b - a)
  const result: AbilityScores = {}

  const remaining = ABILITY_KEYS.filter(k => !priority.includes(k))
  const orderedKeys = [...priority, ...remaining]

  for (let i = 0; i < orderedKeys.length; i++) {
    result[orderedKeys[i]] = scores[i]
  }
  return result
}
