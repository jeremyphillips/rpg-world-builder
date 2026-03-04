import type { Money } from '@/shared/money/types'
import type { ClassId } from '@/shared/types/ruleset'
import type { AlignmentId } from '@/features/content/domain/types'
import type { RaceId } from '@/features/content/domain/types'
import type { AbilityScoreMapResolved } from '@/features/mechanics/domain/core/character'


export type Wealth = {
  gp?: number | null
  sp?: number | null
  cp?: number | null
  baseBudget?: Money | null
}

export type EquipmentItemInstance = {
  instanceId: string
  baseId: string
  enhancementTemplateId?: string
}

export type Equipment = {
  armor?: string[]
  weapons?: string[]
  gear?: string[]
  magicItems?: string[]
  armorInstances?: EquipmentItemInstance[]
  weaponInstances?: EquipmentItemInstance[]
  weight?: number
}

export type CharacterClassInfo = {
  classId?: ClassId
  subclassId?: string
  level: number
}

export type CharacterNarrative = {
  personalityTraits?: string[]
  ideals?: string
  bonds?: string
  flaws?: string
  backstory?: string
}

export type HitPoints = {
  total?: number | null
  generationMethod?: string
}

export type ArmorClass = {
  base?: number
  current?: number | null
  calculation?: string
}

export type EquipmentLoadout = {
  armorId?: string
  shieldId?: string
  mainHandWeaponId?: string
  offHandWeaponId?: string
  armorInstanceId?: string
  shieldInstanceId?: string
  mainHandWeaponInstanceId?: string
  offHandWeaponInstanceId?: string
  armorEnhancementId?: string
  shieldEnhancementId?: string
  weaponEnhancementId?: string
}

export type CharacterProficiencies = {
  skills?: string[]
}

export type CharacterType = 'pc' | 'npc'

export type Character = {
  name: string
  type: CharacterType

  race?: RaceId
  alignment?: AlignmentId

  classes: CharacterClassInfo[]
  xp: number
  totalLevel: number
  levelUpPending?: boolean
  pendingLevel?: number

  abilityScores?: AbilityScoreMapResolved
  hitPoints?: HitPoints
  armorClass?: ArmorClass
  combat?: {
    loadout?: EquipmentLoadout
  }

  proficiencies?: CharacterProficiencies
  spells?: string[]
  equipment?: Equipment
  wealth?: Wealth
  narrative?: CharacterNarrative
}

export type PlayerCharacter = Character & {
  type: 'pc'
}

export type NonPlayerCharacter = Character & {
  type: 'npc'
  source?: 'generated' | 'platform'
  id: string
}

/**
 * Working state used by the character builder.
 * Fields that are required on the final Character are optional here
 * because they're filled in progressively during the build flow.
 */
export type CharacterSheet = Omit<Partial<Character>, 'classes'> & {
  classes: CharacterClassInfo[]
}
