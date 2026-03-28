import type { AbilityId } from '@/features/mechanics/domain/character'
import type { SKILL_PROFICIENCIES_RAW } from '@/features/mechanics/domain/rulesets/system/skillProficiencies'
import type { ContentItem } from '@/features/content/shared/domain/types/content.types'

export type SkillProficiencyId = (typeof SKILL_PROFICIENCIES_RAW)[number]['id']

/** Extend when a new skill explicitly maps to a first-class combat action affordance. */
export const SKILL_PROFICIENCY_COMBAT_UI_ACTION_IDS = ['hide'] as const

export type SkillProficiencyCombatUiActionId = (typeof SKILL_PROFICIENCY_COMBAT_UI_ACTION_IDS)[number]

/**
 * Opt-in: which combat action affordance this skill maps to (e.g. Stealth → Hide).
 * TODO(encounter-ui): Derive presentation (action vs bonus action, targeting, etc.) from encounter/action rules — not from this field alone.
 */
export type SkillProficiencyCombatUi = {
  actionId: SkillProficiencyCombatUiActionId
}

export type SkillProficiencyFields = {
  ability: AbilityId
  suggestedClasses: string[]
  examples: string[]
  tags: string[]
  description: string
  combatUi?: SkillProficiencyCombatUi
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
