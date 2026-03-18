import type { Character } from '@/features/character/domain/types'
import type { CreatureArmorCatalogEntry } from '../../equipment/armorClass'
import type { ResolutionInput } from './types'
import { buildCharacterContext } from '@/features/character/domain/engine/buildCharacterContext'
import { collectIntrinsicEffects } from '@/features/character/domain/engine/collectCharacterEffects'
import {
  getEquipmentEffects,
  selectActiveEquipmentEffects,
} from '@/features/mechanics/domain/effects/sources/equipment-to-effects'
import { resolveLoadout } from '@/features/mechanics/domain/equipment/loadout'

export type { ResolutionInput } from './types'

/**
 * Build resolution input for a character (PC or NPC).
 *
 * Extends the creature base with character-specific concerns:
 *  - Intrinsic effects (class, race, buffs, conditions)
 *  - Equipment effects filtered to active loadout
 *
 * For full combat stats (magic items, enchantments), consumers can
 * spread additional effects onto the returned input.
 */
export function buildCharacterResolutionInput(
  character: Character,
  catalog?: { armorById?: Record<string, CreatureArmorCatalogEntry> },
): ResolutionInput {
  const characterContext = buildCharacterContext(character)

  const intrinsicEffects = collectIntrinsicEffects(character)
  const candidateEffects = getEquipmentEffects(character.equipment, catalog?.armorById)
  const loadout = resolveLoadout(character.combat)
  const activeEquipmentEffects = selectActiveEquipmentEffects(candidateEffects, loadout)

  return {
    context: characterContext,
    effects: [...intrinsicEffects, ...activeEquipmentEffects],
  }
}
