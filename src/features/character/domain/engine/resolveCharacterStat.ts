import type { Character } from '@/features/character/domain/types'
import type { StatTarget } from '@/features/mechanics/domain/resolution/stat-resolver'
import { buildCharacterContext } from './buildCharacterContext'
import { collectIntrinsicEffects } from './collectCharacterEffects'
import { resolveStat } from '@/features/mechanics/domain/resolution/stat-resolver'
import {
  getEquipmentEffects,
  selectActiveEquipmentEffects,
  resolveLoadout,
} from '@/features/mechanics/domain/effects/sources/equipment-to-effects'

/**
 * Resolve a character stat via the mechanics engine.
 *
 * Flow:
 *  1. Collect intrinsic effects (class, race, buffs, conditions)
 *  2. Get candidate equipment effects (all owned items)
 *  3. Filter to active loadout
 *  4. Merge and resolve
 */
export function resolveCharacterStat(
  character: Character,
  target: StatTarget
): number {
  const context = buildCharacterContext(character)
  const intrinsicEffects = collectIntrinsicEffects(character)
  const candidateEffects = getEquipmentEffects(character.equipment)
  const loadout = resolveLoadout(character.combat)
  const activeEquipmentEffects = selectActiveEquipmentEffects(candidateEffects, loadout)

  const effects = [...intrinsicEffects, ...activeEquipmentEffects]
  return resolveStat(target, context, effects)
}
