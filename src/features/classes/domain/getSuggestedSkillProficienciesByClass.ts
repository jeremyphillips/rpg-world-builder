import type { SkillProficiency } from '@/features/content/shared/domain/types'

/**
 * Filters all skill proficiencies by suggestedClasses.
 * Returns proficiencies whose suggestedClasses includes the given classId.
 */
export const getSuggestedSkillProficienciesByClass = (
  skillProficiencies: readonly SkillProficiency[],
  classId: string,
): readonly SkillProficiency[] =>
  skillProficiencies.filter((p) => p.suggestedClasses.includes(classId))
