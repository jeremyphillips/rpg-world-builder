import type { AbilityId } from '@/features/mechanics/domain/core/character/abilities.types'

export interface SkillProficiency {
  id: string
  name: string
  ability: AbilityId
  suggestedClasses: string[]
  examples: string[]
  tags: string[]
  description: string
}