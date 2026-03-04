import type { Movement } from "../../core/combat.types"
import type { Attack } from "../../core/combat.types"
import type { AbilityScoreMapResolved } from '@/features/mechanics/domain/core/character/abilities.types'

export interface MechanicsD20 {
  hitDice: number
  hitDieSize: number              // varies by creature type (d4-d12)
  armorClass: number              // ascending (already 5e-style)
  baseAttackBonus: number         // BAB
  movement: Movement              // already in feet
  attacks: Attack[]
  specialAttacks?: string[]
  specialDefenses?: string[]
  abilities?: AbilityScoreMapResolved 
}