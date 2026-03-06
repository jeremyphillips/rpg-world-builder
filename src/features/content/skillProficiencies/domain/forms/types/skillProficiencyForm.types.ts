/**
 * Form types for Skill Proficiency Create/Edit.
 * References SkillProficiency — extends/omits for form shape.
 */
import type { SkillProficiency, SkillProficiencyInput as DomainSkillProficiencyInput } from '@/features/content/shared/domain/types';
import type { AbilityId } from '@/features/mechanics/domain/core/character/abilities.types';

/** Form values shape — string for json fields (examples, tags, suggestedClasses). */
export type SkillProficiencyFormValues = Pick<SkillProficiency, 'name' | 'description'> & {
  ability: AbilityId | '';
  /** JSON string for FormJsonField. */
  suggestedClasses: string;
  /** JSON string for FormJsonField. */
  examples: string;
  /** JSON string for FormJsonField. */
  tags: string;
  accessPolicy?: SkillProficiency['accessPolicy'];
}

/** Input for create/update — re-export domain type for form mappers. */
export type SkillProficiencyInput = DomainSkillProficiencyInput;
