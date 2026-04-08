import type { Material } from '@/features/content/equipment/armor/domain/vocab'


// ---------------------------------------------------------------------------
// Proficiencies
// ---------------------------------------------------------------------------

export type ClassProficiencyBase = {
  type: 'choice' | 'fixed'
  level: number
}

export interface ClassProficiencySkillSelection extends ClassProficiencyBase {
  choose: number
  /** Omitted when options are derived from suggestedClasses in system catalog */
  from?: string[]
}

export interface ClassProficiencyWeapon extends ClassProficiencyBase {
  categories?: string[]
  items?: string[]
}

export interface ClassProficiencyArmor extends ClassProficiencyBase {
  categories?: string[]
  items?: string[]
  disallowedMaterials?: Material[]
}

export type ToolProficiencyItem =
  | 'thieves-tools'
  | 'disguise-kit'
  | 'forgery-kit'
  | 'herbalism-kit'
  | 'smiths-tools'
  | 'tinkers-tools'
  | 'vehicle-tool'

export interface ClassProficiencyTools extends ClassProficiencyBase {
  items?: ToolProficiencyItem[]
}

export interface ClassProficiencies {
  skills: ClassProficiencySkillSelection
  weapons: ClassProficiencyWeapon
  armor: ClassProficiencyArmor
  tools?: ClassProficiencyTools
}
