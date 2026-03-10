import { systemCatalog } from '@/features/mechanics/domain/core/rules/systemCatalog'
import type { ClassProficiencySkillSelection, CharacterClass } from '@/features/content/classes/domain/types'
import type { CharacterClassInfo, CharacterProficiencies } from '@/features/character/domain/types'

export interface ProficiencySlotSummary {
  /** Total slots granted across all class skill proficiency groups. */
  totalSlots: number
  /** Number of skills the character has selected. */
  filled: number
  /** Slots still available for selection. */
  remaining: number
  /** True when every skill slot is filled. */
  allFilled: boolean
  /** True when the character has at least one selectable slot. */
  hasAvailableSlots: boolean
}

function getClassSkillChoices(
  classId: string | undefined,
  classesById: Record<string, CharacterClass>,
): ClassProficiencySkillSelection[] {
  if (!classId) return []
  const cls = classesById[classId]
  if (!cls?.proficiencies?.skills) return []
  const skill = cls.proficiencies.skills
  return skill.type === 'choice' ? [skill] : []
}

/**
 * Aggregate all skill choice entries for a character's class list.
 * Falls back to the full system catalog when no classesById is supplied.
 */
export function getAllSkillChoices(
  characterClasses: CharacterClassInfo[],
  classesById: Record<string, CharacterClass> = systemCatalog.classesById,
): ClassProficiencySkillSelection[] {
  return characterClasses.flatMap(c => getClassSkillChoices(c.classId, classesById))
}

/**
 * Calculate how many total skill slots the character has versus how many are filled.
 */
export function getProficiencySlotSummary(
  characterClasses: CharacterClassInfo[],
  proficiencies: CharacterProficiencies | undefined,
  classesById: Record<string, CharacterClass> = systemCatalog.classesById,
): ProficiencySlotSummary {
  const choices = getAllSkillChoices(characterClasses, classesById)
  const totalSlots = choices.reduce((sum, e) => sum + (e.choose ?? 0), 0)
  const filled = proficiencies?.skills?.length ?? 0
  const remaining = Math.max(0, totalSlots - filled)

  return {
    totalSlots,
    filled,
    remaining,
    allFilled: remaining === 0,
    hasAvailableSlots: totalSlots > 0,
  }
}
