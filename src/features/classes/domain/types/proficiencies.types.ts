import type { Material } from '@/features/content/domain/vocab'

// ---------------------------------------------------------------------------
// Proficiencies
// ---------------------------------------------------------------------------

export interface ClassProficiencySkillSelection {
  type: 'choice' | 'fixed'
  level: number
  choose: number
  from: string[]
}

export interface ClassProficiencyWeapon {
  type: 'fixed' | 'choice'
  level: number
  categories?: string[]
  items?: string[]
}

export interface ClassProficiencyArmor {
  type: 'fixed' | 'choice'
  level: number
  categories?: string[]
  items?: string[]
  disallowedMaterials?: Material[]
}

export interface ClassProficiencies {
  skills: ClassProficiencySkillSelection
  weapons: ClassProficiencyWeapon
  armor: ClassProficiencyArmor
}