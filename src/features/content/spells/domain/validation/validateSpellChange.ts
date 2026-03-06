/**
 * Spell change validator.
 *
 * Used to block destructive changes (delete or disable) when
 * the spell is owned by characters in the campaign.
 *
 * Future extensions:
 * - NPC validation
 * - monster spell validation
 */
import type { CharacterDoc } from '@/features/character/domain/types';
import {
  validateCharacterReferenceChange,
  type ChangeValidationResult,
} from '@/features/content/shared/domain/validation/validateCharacterReferenceChange';

export type SpellValidationMode = 'delete' | 'disallow';

type CharacterWithSpells = Pick<CharacterDoc, '_id' | 'name' | 'spells'>;

/**
 * Validates whether a spell can be deleted or disabled.
 *
 * Checks characters in the campaign. A character "owns" a spell if
 * it appears in their spells array.
 *
 * TODO: extend to also check NPC usage once NPC spell support exists
 */
export async function validateSpellChange(params: {
  campaignId: string;
  spellId: string;
  mode: SpellValidationMode;
  includeNpcs?: boolean;
}): Promise<ChangeValidationResult> {
  const { campaignId, spellId, mode, includeNpcs } = params;

  return validateCharacterReferenceChange<CharacterWithSpells>({
    campaignId,
    mode,
    includeNpcs,
    contentType: 'spell',
    matcher: (c) => c.spells?.includes(spellId) ?? false,
  });
}
