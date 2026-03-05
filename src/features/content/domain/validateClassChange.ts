/**
 * Class change validator.
 *
 * Used to block destructive changes (delete or disable) when
 * the class is referenced by active campaign entities.
 *
 * Accounts for multiclass: a character uses a class if any of
 * their classes has that classId.
 *
 * Future extensions:
 * - NPC validation
 * - campaign encounter validation
 */
import { apiFetch } from '@/app/api';
import type { BlockingEntity } from '@/features/content/components';
import type { CharacterDoc } from '@/features/character/domain/types';
import type { ChangeValidationResult } from './validateRaceChange';

export type ClassValidationMode = 'delete' | 'disallow';

type CharacterWithClasses = Pick<CharacterDoc, '_id' | 'name' | 'classes'>;

function buildClassBlockedMessage(mode: ClassValidationMode, count: number): string {
  const noun = count === 1 ? 'character' : 'characters';

  if (mode === 'delete') {
    return `This class is currently used by ${count} ${noun}. Remove the class from those ${noun} before deleting.`;
  }

  return `This class is currently used by ${count} ${noun}. Change the class on those ${noun} before disabling it for the campaign.`;
}

/**
 * Validates whether a class can be deleted or disabled.
 *
 * Checks characters in the campaign. Accounts for multiclass:
 * a character uses the class if any of their classes has that classId.
 *
 * TODO: extend to also check NPC usage once NPC class support exists
 */
export async function validateClassChange(params: {
  campaignId: string;
  classId: string;
  mode: ClassValidationMode;
  includeNpcs?: boolean;
}): Promise<ChangeValidationResult> {
  const { campaignId, classId, mode } = params;

  const data = await apiFetch<{ characters?: CharacterWithClasses[] }>(
    `/api/campaigns/${campaignId}/party?status=approved`,
  );

  const characters = data.characters ?? [];
  const using = characters.filter(
    (c) => c.classes?.some((cls) => cls.classId === classId) ?? false,
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
    message: buildClassBlockedMessage(mode, using.length),
    blockingEntities,
  };
}
