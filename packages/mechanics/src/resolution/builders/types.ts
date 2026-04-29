import type { EvaluationContext } from '../../conditions/evaluation-context.types'
import type { Effect } from '../../effects/effects.types'
import type { CreatureAbilityScores } from '../../character'
import type { DieFace } from '@/shared/domain/dice';

/**
 * Universal contract produced by builders and consumed by resolvers.
 */
export type ResolutionInput = {
  context: EvaluationContext
  effects: Effect[]
}

/**
 * Minimal shape shared by all creatures (characters and monsters).
 * This is the input contract for buildCreatureResolutionInput.
 */
export type CreatureResolutionShape = {
  id: string
  level: number
  proficiencyBonus?: number
  hp: number
  hpMax: number
  hitDie?: DieFace
  abilities: CreatureAbilityScores
  conditions?: string[]
  creatureType?: string
  resources?: Record<string, number>
  equipment?: {
    armorEquipped?: string | null
    shieldEquipped?: boolean
    weaponEquipped?: { id: string; category: string; properties: string[] }
  }
  flags?: Record<string, boolean>
}
