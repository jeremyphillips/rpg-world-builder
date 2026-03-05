/**
 * Form types for Skill Proficiency Create/Edit.
 * References SkillProficiency — extends/omits for form shape.
 */
import type { SkillProficiency, SkillProficiencyId } from '@/features/content/domain/types'
import type { AbilityId } from '@/features/mechanics/domain/core/character/abilities.types'

/** Form values shape — string for json fields (examples, tags, suggestedClasses). */
export type SkillProficiencyFormValues = Pick<SkillProficiency, 'name' | 'description'> & {
  ability: AbilityId | '';
  /** JSON string for FormJsonField. */
  suggestedClasses: string;
  /** JSON string for FormJsonField. */
  examples: string;
  /** JSON string for FormJsonField. */
  tags: string;
}

/** Input for create/update — id optional for create. */
export type SkillProficiencyInput = Omit<SkillProficiency, 'id'> & {
  id?: SkillProficiencyId;
}
