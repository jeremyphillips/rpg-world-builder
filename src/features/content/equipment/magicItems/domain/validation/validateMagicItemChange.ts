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

export type MagicItemValidationMode = 'delete' | 'disallow';

type CharacterWithMagicItems = Pick<
  CharacterDoc,
  '_id' | 'name' | 'equipment'
>;

/**
 * Validates whether a magic item can be deleted or disabled.
 *
 * Checks characters in the campaign. A character "owns" a magic item if
 * the id is in the character query inventory (magic items).
 *
 * TODO: extend to also check NPC usage once NPC magic item support exists
 */
export async function validateMagicItemChange(params: {
  campaignId: string;
  magicItemId: string;
  mode: MagicItemValidationMode;
  includeNpcs?: boolean;
}): Promise<ChangeValidationResult> {
  const { campaignId, magicItemId, mode, includeNpcs } = params;

  return validateCharacterReferenceChange<CharacterWithMagicItems>({
    campaignId,
    mode,
    includeNpcs,
    contentType: 'magic item',
    matcher: (c) =>
      ownsItem(buildCharacterQueryContext(c as CharacterQuerySource), 'magicItems', magicItemId),
  });
}
