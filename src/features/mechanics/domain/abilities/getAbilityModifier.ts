import type { CreatureSnapshot } from '../conditions/evaluation-context.types'
import type { AbilityKey } from '@/features/mechanics/domain/character'

export function getAbilityModifier(score: number): number
export function getAbilityModifier(creature: CreatureSnapshot, ability: AbilityKey): number
export function getAbilityModifier(
  scoreOrCreature: number | CreatureSnapshot,
  ability?: AbilityKey
): number {
  const score =
    typeof scoreOrCreature === 'number'
      ? scoreOrCreature
      : (scoreOrCreature.abilities[ability!] ?? 10)
  return Math.floor((score - 10) / 2)
}
