import type { AbilityId } from '@/features/mechanics/domain/core/character'

import type { SubclassSelection } from './subclass.types'
import type { ClassProficiencies} from './proficiencies.types'
import type { ClassProgression } from './progression.types'
import type { ClassRequirement } from './requirements.types'


export interface WealthTier {
  /** [minLevel, maxLevel] inclusive */
  levelRange: number[]
  /** Total gold budget for a character starting at this level */
  baseGold: number
  /** Max value of any single item (optional, used by 5e) */
  maxItemValue?: number
}

export interface StartingWealth {
  /** Dice formula for level 1 (display / rolling) */
  classInitialGold?: string
  /** Average gold at level 1 (used as base for formula-based editions) */
  avgGold?: number
  /** Gold added per level beyond 1 (for linear-scaling editions: 1e, 2e, OD&D, Basic) */
  goldPerLevel?: number
  /** Level-based wealth tiers (for 5e, 3e, 3.5e, 4e) — takes precedence over avgGold+goldPerLevel */
  tiers?: WealthTier[]
}

export interface CharacterClass {
  id: string
  name: string
  description?: string
  definitions?: SubclassSelection
  requirements: ClassRequirement
  proficiencies: ClassProficiencies
  progression: ClassProgression,
  generation: {
    primaryAbilities: AbilityId[]
  }
}
