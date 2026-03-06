/**
 * Magic item change validator.
 *
 * Used to block destructive changes (delete or disable) when
 * the magic item is owned by characters in the campaign.
 *
 * Future extensions:
 * - NPC validation
 * - monster magic item validation
 */
import { apiFetch } from '@/app/api';
import type { BlockingEntity } from '@/features/content/components';
import type { CharacterDoc } from '@/features/character/domain/types';
import type { ChangeValidationResult } from './validateRaceChange';

export type MagicItemValidationMode = 'delete' | 'disallow';

type CharacterWithMagicItems = Pick<CharacterDoc, '_id' | 'name' | 'equipment'>;

function buildMagicItemBlockedMessage(
  mode: MagicItemValidationMode,
  count: number,
): string {
  const noun = count === 1 ? 'character' : 'characters';

  if (mode === 'delete') {
    return `This magic item is currently owned by ${count} ${noun}. Remove the magic item from those ${noun} before deleting.`;
  }

  return `This magic item is currently owned by ${count} ${noun}. Remove the magic item from those ${noun} before disabling it for the campaign.`;
}

/**
 * Validates whether a magic item can be deleted or disabled.
 *
 * Checks characters in the campaign. A character "owns" a magic item if
 * it appears in their equipment.magicItems array.
 *
 * TODO: extend to also check NPC usage once NPC magic item support exists
 */
export async function validateMagicItemChange(params: {
  campaignId: string;
  magicItemId: string;
  mode: MagicItemValidationMode;
  includeNpcs?: boolean;
}): Promise<ChangeValidationResult> {
  const { campaignId, magicItemId, mode } = params;

  const data = await apiFetch<{ characters?: CharacterWithMagicItems[] }>(
    `/api/campaigns/${campaignId}/party?status=approved`,
  );

  const characters = data.characters ?? [];
  const using = characters.filter(
    (c) => c.equipment?.magicItems?.includes(magicItemId) ?? false,
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
    message: buildMagicItemBlockedMessage(mode, using.length),
    blockingEntities,
  };
}
