import type { DamageType } from '@/features/mechanics/domain/damage/damage.types'
import type { CreatureSense } from '@/features/content/shared/domain/vocab/creatureSenses.types'

import type { RaceTraitGrant } from './race-traits.types'

/**
 * Ongoing capabilities from a race or a selected lineage/ancestry option (not generation-only).
 *
 * Extend with spells, movement, proficiencies, etc. when authoring/UI needs them—avoid empty stubs.
 */
export interface RaceGrants {
  senses?: readonly CreatureSense[]
  traits?: readonly RaceTraitGrant[]
  /** Dragonborn draconic ancestor energy type for breath/resistance (SRD). */
  damageType?: DamageType
}
