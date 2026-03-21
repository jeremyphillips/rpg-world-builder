import type { ConditionImmunityId } from '@/features/mechanics/domain/conditions/effect-condition-definitions'
import type { CreatureDamageImmunityType } from '@/features/mechanics/domain/damage/damage.types'

/**
 * One entry in a mixed immunity list (damage type or condition immunity), as in
 * creature stat blocks (MM-style). Shared by authored monsters and any future
 * PC/NPC sources that use the same shape.
 */
export type ImmunityType = CreatureDamageImmunityType | ConditionImmunityId

/** Damage types for innate resistance (half damage). */
export type CreatureResistanceDamageType = CreatureDamageImmunityType

/** Damage types for innate vulnerability (double damage). */
export type CreatureVulnerabilityDamageType = CreatureDamageImmunityType
