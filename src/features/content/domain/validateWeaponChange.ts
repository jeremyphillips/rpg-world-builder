/**
 * Weapon change validator.
 *
 * Used to block destructive changes (delete or disable) when
 * the weapon is owned by characters in the campaign.
 *
 * Future extensions:
 * - NPC validation
 * - monster weapon validation
 */
import { apiFetch } from '@/app/api';
import type { BlockingEntity } from '@/features/content/components';
import type { CharacterDoc } from '@/features/character/domain/types';
import type { ChangeValidationResult } from './validateRaceChange';

export type WeaponValidationMode = 'delete' | 'disallow';

type CharacterWithWeapons = Pick<CharacterDoc, '_id' | 'name' | 'equipment'>;

function buildWeaponBlockedMessage(mode: WeaponValidationMode, count: number): string {
  const noun = count === 1 ? 'character' : 'characters';

  if (mode === 'delete') {
    return `This weapon is currently owned by ${count} ${noun}. Remove the weapon from those ${noun} before deleting.`;
  }

  return `This weapon is currently owned by ${count} ${noun}. Remove the weapon from those ${noun} before disabling it for the campaign.`;
}

/**
 * Validates whether a weapon can be deleted or disabled.
 *
 * Checks characters in the campaign. A character "owns" a weapon if
 * it appears in their equipment.weapons array.
 *
 * TODO: extend to also check NPC usage once NPC weapon support exists
 */
export async function validateWeaponChange(params: {
  campaignId: string;
  weaponId: string;
  mode: WeaponValidationMode;
  includeNpcs?: boolean;
}): Promise<ChangeValidationResult> {
  const { campaignId, weaponId, mode } = params;

  const data = await apiFetch<{ characters?: CharacterWithWeapons[] }>(
    `/api/campaigns/${campaignId}/party?status=approved`,
  );

  const characters = data.characters ?? [];
  const using = characters.filter(
    (c) => c.equipment?.weapons?.includes(weaponId) ?? false,
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
    message: buildWeaponBlockedMessage(mode, using.length),
    blockingEntities,
  };
}
