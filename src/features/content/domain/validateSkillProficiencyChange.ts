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
import { apiFetch } from '@/app/api';
import type { BlockingEntity } from '@/features/content/components';
import type { CharacterDoc } from '@/features/character/domain/types';
import type { ChangeValidationResult } from './validateRaceChange';

export type SkillProficiencyValidationMode = 'delete' | 'disallow';

type CharacterWithProficiencies = Pick<
  CharacterDoc,
  '_id' | 'name' | 'proficiencies'
>;

function buildSkillProficiencyBlockedMessage(
  mode: SkillProficiencyValidationMode,
  count: number,
): string {
  const noun = count === 1 ? 'character' : 'characters';

  if (mode === 'delete') {
    return `This skill proficiency is currently used by ${count} ${noun}. Remove the proficiency from those ${noun} before deleting.`;
  }

  return `This skill proficiency is currently used by ${count} ${noun}. Remove the proficiency from those ${noun} before disabling it for the campaign.`;
}

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
}): Promise<ChangeValidationResult> {
  const { campaignId, skillProficiencyId, mode } = params;

  const data = await apiFetch<{ characters?: CharacterWithProficiencies[] }>(
    `/api/campaigns/${campaignId}/party?status=approved`,
  );

  const characters = data.characters ?? [];
  const using = characters.filter(
    (c) => c.proficiencies?.skills?.includes(skillProficiencyId) ?? false,
  );

  if (using.length === 0) {
    return { allowed: true };
  }

  const blockingEntities: BlockingEntity[] = using.map((c) => ({
    id: c._id,
    label: c.name ?? 'Unnamed character',
    to: `/characters/${c._id}`,
  }));

  return {
    allowed: false,
    reason: 'IN_USE',
    message: buildSkillProficiencyBlockedMessage(mode, using.length),
    blockingEntities,
  };
}
