/**
 * Skill proficiency change validator.
 *
 * Used to block destructive changes (delete or disable) when
 * the skill proficiency is referenced by active campaign entities.
 *
 * If any active character owns the proficiency id, return allowed: false.
 *
 * Future extensions:
 * - NPC validation
 */
import type { CharacterDoc } from '@/features/character/domain/types';
import {
  validateCharacterReferenceChange,
  type ChangeValidationResult,
} from '@/features/content/shared/domain/validation/validateCharacterReferenceChange';

export type SkillProficiencyValidationMode = 'delete' | 'disallow';

type CharacterWithProficiencies = Pick<
  CharacterDoc,
  '_id' | 'name' | 'proficiencies'
>;

/**
 * Validates whether a skill proficiency can be deleted or disabled.
 *
 * Checks characters in the campaign. If any active character owns the
 * proficiency id (has it in proficiencies.skills), returns allowed: false.
 */
export async function validateSkillProficiencyChange(params: {
  campaignId: string;
  skillProficiencyId: string;
  mode: SkillProficiencyValidationMode;
  includeNpcs?: boolean;
}): Promise<ChangeValidationResult> {
  const { campaignId, skillProficiencyId, mode, includeNpcs } = params;

  return validateCharacterReferenceChange<CharacterWithProficiencies>({
    campaignId,
    mode,
    includeNpcs,
    contentType: 'skill proficiency',
    matcher: (c) =>
      c.proficiencies?.skills?.includes(skillProficiencyId) ?? false,
  });
}
