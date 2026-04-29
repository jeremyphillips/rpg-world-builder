/**
 * Race change validator.
 *
 * Used to block destructive changes (delete or disable) when
 * the race is referenced by active campaign entities.
 *
 * Future extensions:
 * - NPC validation
 * - monster race validation
 * - campaign encounter validation
 */
import type { CharacterDoc } from '@/features/character/domain/types';
import {
  buildCharacterQueryContext,
  type CharacterQuerySource,
} from '@/features/character/domain/query';
import {
  validateCharacterReferenceChange,
  type ChangeValidationResult,
} from '@/features/content/shared/domain/validation/validateCharacterReferenceChange';

export type RaceValidationMode = 'delete' | 'disallow';

export type { ChangeValidationResult } from '@/features/content/shared/domain/validation/validateCharacterReferenceChange';

type CharacterWithRace = Pick<CharacterDoc, '_id' | 'name' | 'race'>;

/**
 * Validates whether a race can be deleted or disabled.
 *
 * Checks characters in the campaign. NPC validation will be added later.
 *
 * TODO: extend to also check NPC usage once NPC race support exists
 */
export async function validateRaceChange(params: {
  campaignId: string;
  raceId: string;
  mode: RaceValidationMode;
  includeNpcs?: boolean;
}): Promise<ChangeValidationResult> {
  const { campaignId, raceId, mode, includeNpcs } = params;

  return validateCharacterReferenceChange<CharacterWithRace>({
    campaignId,
    mode,
    includeNpcs,
    contentType: 'race',
    matcher: (c) =>
      buildCharacterQueryContext(c as CharacterQuerySource).identity.raceId === raceId,
  });
}
