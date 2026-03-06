/**
 * Shared validator for character-reference / in-use checks.
 *
 * Used by content-specific validators (race, class, gear, etc.) to block
 * destructive changes when content is referenced by campaign characters.
 */
import { fetchApprovedPartyCharacters } from '@/features/character/domain/queries/fetchApprovedPartyCharacters';
import { buildBlockedMessage } from './validationMessage';

export type CharacterReferenceMode = 'delete' | 'disallow';

export type CharacterReferenceLike = {
  _id: string;
  name?: string | null;
};

export type CharacterReferenceMatcher<TCharacter> = (
  character: TCharacter,
) => boolean;

/** Structurally compatible with BlockingEntity from content/components */
type BlockingEntityLike = { id: string; label: string; to?: string };

export type ChangeValidationResult =
  | { allowed: true }
  | {
      allowed: false;
      reason?: 'IN_USE';
      message: string;
      blockingEntities?: BlockingEntityLike[];
    };

/**
 * Validates whether a content item can be deleted or disabled based on
 * character references.
 *
 * Fetches approved party characters, filters by matcher, and returns
 * blocked result when any character references the content.
 *
 * TODO: extend fetch to include NPC references when includeNpcs support is implemented.
 * For now, includeNpcs is ignored in behavior but kept in the signature for forward compatibility.
 */
export async function validateCharacterReferenceChange<
  TCharacter extends CharacterReferenceLike,
>(params: {
  campaignId: string;
  mode: CharacterReferenceMode;
  contentType: string;
  matcher: CharacterReferenceMatcher<TCharacter>;
  includeNpcs?: boolean;
}): Promise<ChangeValidationResult> {
  const { campaignId, mode, contentType, matcher } = params;

  const characters = await fetchApprovedPartyCharacters<TCharacter>(
    campaignId,
  );
  const using = characters.filter(matcher);

  if (using.length === 0) {
    return { allowed: true };
  }

  const blockingEntities: BlockingEntityLike[] = using.map((c) => ({
    id: c._id,
    label: c.name ?? 'Unnamed character',
    to: `/characters/${c._id}`,
  }));

  return {
    allowed: false,
    reason: 'IN_USE',
    message: buildBlockedMessage({
      contentType,
      mode,
      blockingEntities,
    }),
    blockingEntities,
  };
}
