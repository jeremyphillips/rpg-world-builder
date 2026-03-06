/**
 * Armor change validator.
 *
 * Used to block destructive changes (delete or disable) when
 * the armor is owned by characters in the campaign.
 *
 * Future extensions:
 * - NPC validation
 * - monster armor validation
 */
import { apiFetch } from '@/app/api';
import type { BlockingEntity } from '@/features/content/components';
import type { CharacterDoc } from '@/features/character/domain/types';
import type { ChangeValidationResult } from './validateRaceChange';

export type ArmorValidationMode = 'delete' | 'disallow';

type CharacterWithArmor = Pick<CharacterDoc, '_id' | 'name' | 'equipment'>;

function buildArmorBlockedMessage(mode: ArmorValidationMode, count: number): string {
  const noun = count === 1 ? 'character' : 'characters';

  if (mode === 'delete') {
    return `This armor is currently owned by ${count} ${noun}. Remove the armor from those ${noun} before deleting.`;
  }

  return `This armor is currently owned by ${count} ${noun}. Remove the armor from those ${noun} before disabling it for the campaign.`;
}

/**
 * Validates whether armor can be deleted or disabled.
 *
 * Checks characters in the campaign. A character "owns" armor if
 * it appears in their equipment.armor array.
 *
 * TODO: extend to also check NPC usage once NPC armor support exists
 */
export async function validateArmorChange(params: {
  campaignId: string;
  armorId: string;
  mode: ArmorValidationMode;
  includeNpcs?: boolean;
}): Promise<ChangeValidationResult> {
  const { campaignId, armorId, mode } = params;

  const data = await apiFetch<{ characters?: CharacterWithArmor[] }>(
    `/api/campaigns/${campaignId}/party?status=approved`,
  );

  const characters = data.characters ?? [];
  const using = characters.filter(
    (c) => c.equipment?.armor?.includes(armorId) ?? false,
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
    message: buildArmorBlockedMessage(mode, using.length),
    blockingEntities,
  };
}
