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
import type { CharacterDoc } from '@/features/character/domain/types';
import {
  validateCharacterReferenceChange,
  type ChangeValidationResult,
} from '@/features/content/shared/domain/validation/validateCharacterReferenceChange';

export type ArmorValidationMode = 'delete' | 'disallow';

type CharacterWithArmor = Pick<CharacterDoc, '_id' | 'name' | 'equipment'>;

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
  const { campaignId, armorId, mode, includeNpcs } = params;

  return validateCharacterReferenceChange<CharacterWithArmor>({
    campaignId,
    mode,
    includeNpcs,
    contentType: 'armor',
    matcher: (c) => c.equipment?.armor?.includes(armorId) ?? false,
  });
}
