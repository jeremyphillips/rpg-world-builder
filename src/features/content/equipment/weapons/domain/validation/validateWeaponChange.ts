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
import type { CharacterDoc } from '@/features/character/domain/types';
import {
  buildCharacterQueryContext,
  ownsItem,
  type CharacterQuerySource,
} from '@/features/character/domain/query';
import {
  validateCharacterReferenceChange,
  type ChangeValidationResult,
} from '@/features/content/shared/domain/validation/validateCharacterReferenceChange';

export type WeaponValidationMode = 'delete' | 'disallow';

type CharacterWithWeapons = Pick<CharacterDoc, '_id' | 'name' | 'equipment'>;

/**
 * Validates whether a weapon can be deleted or disabled.
 *
 * Checks characters in the campaign. A character "owns" a weapon if
 * the weapon id is in the character query inventory (weapons).
 *
 * TODO: extend to also check NPC usage once NPC weapon support exists
 */
export async function validateWeaponChange(params: {
  campaignId: string;
  weaponId: string;
  mode: WeaponValidationMode;
  includeNpcs?: boolean;
}): Promise<ChangeValidationResult> {
  const { campaignId, weaponId, mode, includeNpcs } = params;

  return validateCharacterReferenceChange<CharacterWithWeapons>({
    campaignId,
    mode,
    includeNpcs,
    contentType: 'weapon',
    matcher: (c) =>
      ownsItem(buildCharacterQueryContext(c as CharacterQuerySource), 'weapons', weaponId),
  });
}
