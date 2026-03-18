import type { Character } from '@/features/character/domain/types'
import type { StatTarget } from '@/features/mechanics/domain/resolution'
import { resolveStat, buildCharacterResolutionInput } from '@/features/mechanics/domain/resolution'

/**
 * Resolve a character stat via the mechanics engine.
 *
 * Uses buildCharacterResolutionInput to assemble context + effects,
 * then delegates to the stat resolver.
 */
export function resolveCharacterStat(
  character: Character,
  target: StatTarget
): number {
  const { context, effects } = buildCharacterResolutionInput(character)
  return resolveStat(target, context, effects)
}
