import type { CreatureSnapshot } from '../conditions/evaluation-context.types'
import type { AbilityScores } from '@/shared/types/character.core'

export function getAbilityModifier(score: number): number
export function getAbilityModifier(creature: CreatureSnapshot, ability: keyof AbilityScores): number
export function getAbilityModifier(
  scoreOrCreature: number | CreatureSnapshot,
  ability?: keyof AbilityScores
): number {
  const score =
    typeof scoreOrCreature === 'number'
      ? scoreOrCreature
      : (scoreOrCreature.abilities[ability!] ?? 10)
  return Math.floor((score - 10) / 2)
}
