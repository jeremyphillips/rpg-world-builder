/**
 * Gear change validator.
 *
 * Used to block destructive changes (delete or disable) when
 * the gear is owned by characters in the campaign.
 *
 * Future extensions:
 * - NPC validation
 * - monster gear validation
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

export type GearValidationMode = 'delete' | 'disallow';

type CharacterWithGear = Pick<CharacterDoc, '_id' | 'name' | 'equipment'>;

/**
 * Validates whether gear can be deleted or disabled.
 *
 * Checks characters in the campaign. A character "owns" gear if
 * the gear id is in the character query inventory (gear).
 *
 * TODO: extend to also check NPC usage once NPC gear support exists
 */
export async function validateGearChange(params: {
  campaignId: string;
  gearId: string;
  mode: GearValidationMode;
  includeNpcs?: boolean;
}): Promise<ChangeValidationResult> {
  const { campaignId, gearId, mode, includeNpcs } = params;

  return validateCharacterReferenceChange<CharacterWithGear>({
    campaignId,
    mode,
    includeNpcs,
    contentType: 'gear',
    matcher: (c) =>
      ownsItem(buildCharacterQueryContext(c as CharacterQuerySource), 'gear', gearId),
  });
}
