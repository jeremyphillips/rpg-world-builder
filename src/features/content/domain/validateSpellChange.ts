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
import { apiFetch } from '@/app/api';
import type { BlockingEntity } from '@/features/content/components';
import type { CharacterDoc } from '@/features/character/domain/types';
import type { ChangeValidationResult } from './validateRaceChange';

export type SpellValidationMode = 'delete' | 'disallow';

type CharacterWithSpells = Pick<CharacterDoc, '_id' | 'name' | 'spells'>;

function buildSpellBlockedMessage(mode: SpellValidationMode, count: number): string {
  const noun = count === 1 ? 'character' : 'characters';

  if (mode === 'delete') {
    return `This spell is currently known by ${count} ${noun}. Remove the spell from those ${noun} before deleting.`;
  }

  return `This spell is currently known by ${count} ${noun}. Remove the spell from those ${noun} before disabling it for the campaign.`;
}

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
  const { campaignId, spellId, mode } = params;

  const data = await apiFetch<{ characters?: CharacterWithSpells[] }>(
    `/api/campaigns/${campaignId}/party?status=approved`,
  );

  const characters = data.characters ?? [];
  const using = characters.filter(
    (c) => c.spells?.includes(spellId) ?? false,
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
    message: buildSpellBlockedMessage(mode, using.length),
    blockingEntities,
  };
}
