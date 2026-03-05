import type { AbilityId } from '@/features/mechanics/domain/core/character/abilities.types'
import type { SKILL_PROFICIENCIES_RAW } from '@/features/mechanics/domain/core/rules/skillProficiencies.data'

export type SkillProficiencyId = (typeof SKILL_PROFICIENCIES_RAW)[number]['id']

export interface SkillProficiency {
  id: SkillProficiencyId
  name: string
  ability: AbilityId
  suggestedClasses: string[]
  examples: string[]
  tags: string[]
  description: string
}