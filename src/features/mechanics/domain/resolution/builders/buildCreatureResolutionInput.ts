import type { EvaluationContext } from '../../conditions/evaluation-context.types'
import type { Effect } from '../../effects/effects.types'
import type { CreatureResolutionShape, ResolutionInput } from './types'

export type { CreatureResolutionShape, ResolutionInput } from './types'

/**
 * Build resolution input for any creature (character or monster).
 *
 * This is the shared base: it maps a flat creature shape into an
 * EvaluationContext and pairs it with optional pre-collected effects.
 *
 * Character-specific logic (equipment, loadout, intrinsic class/race effects)
 * is handled by buildCharacterResolutionInput, which extends this.
 */
export function buildCreatureResolutionInput(
  creature: CreatureResolutionShape,
  effects?: Effect[],
): ResolutionInput {
  const context: EvaluationContext = {
    self: {
      id: creature.id,
      level: creature.level,
      proficiencyBonus: creature.proficiencyBonus,
      hp: creature.hp,
      hpMax: creature.hpMax,
      hitDie: creature.hitDie,
      abilities: creature.abilities,
      creatureType: creature.creatureType,
      conditions: creature.conditions ?? [],
      resources: creature.resources ?? {},
      equipment: creature.equipment ?? {},
      flags: creature.flags ?? {},
    },
  }

  return { context, effects: effects ?? [] }
}
