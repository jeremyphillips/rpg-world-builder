import type { AbilityId } from '@/features/mechanics/domain/core/character/abilities.types'
import type { SKILL_PROFICIENCIES_RAW } from '@/features/mechanics/domain/core/rules/skillProficiencies.data'
import type { ContentItem } from '@/features/content/shared/domain/types/content.types'

export type SkillProficiencyId = (typeof SKILL_PROFICIENCIES_RAW)[number]['id']

export type SkillProficiencyFields = {
  ability: AbilityId
  suggestedClasses: string[]
  examples: string[]
  tags: string[]
  description: string
}

export type SkillProficiencySummary = ContentItem & SkillProficiencyFields

export type SkillProficiencyInput = Partial<SkillProficiencyFields> & {
  name: string
  description?: string
  ability: AbilityId
  suggestedClasses?: string[]
  examples?: string[]
  tags?: string[]
  accessPolicy?: ContentItem['accessPolicy']
}

export type SkillProficiency = ContentItem & SkillProficiencyFields
