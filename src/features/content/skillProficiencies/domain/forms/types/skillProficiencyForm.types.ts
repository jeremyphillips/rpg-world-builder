/**
 * Form types for Skill Proficiency Create/Edit.
 * References SkillProficiency — extends/omits for form shape.
 */
import type { SkillProficiency, SkillProficiencyInput as DomainSkillProficiencyInput } from '@/features/content/skillProficiencies/domain/types';
import type { AbilityId } from '@/features/mechanics/domain/character';

/** Form values shape — string for json fields (examples, tags, suggestedClasses). */
export type SkillProficiencyFormValues = Pick<SkillProficiency, 'name' | 'description'> & {
  imageKey: string;
  ability: AbilityId | '';
  /** JSON string for AppFormJsonPreviewField. */
  suggestedClasses: string;
  /** JSON string for AppFormJsonPreviewField. */
  examples: string;
  /** JSON string for AppFormJsonPreviewField. */
  tags: string;
  accessPolicy?: SkillProficiency['accessPolicy'];
}

/** Input for create/update — re-export domain type for form mappers. */
export type SkillProficiencyInput = DomainSkillProficiencyInput;
