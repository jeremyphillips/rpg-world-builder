import type { Character } from '@/shared/types'
import { resolveCharacterStat } from '../engine/resolveCharacterStat'

/**
 * Calculate the character's effective armor class.
 * Delegates to the mechanics engine for 5e.
 */
export function calculateArmorClass(character: Character, edition: string) {
  // if (edition !== '5e') {
  //   return { value: character.armorClass?.base ?? 10, breakdown: 'Unsupported edition' }
  // }

  const value = resolveCharacterStat(character, 'armor_class')
  return { value, breakdown: `${value} (mechanics engine)` }
}
