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
import { apiFetch } from '@/app/api';
import type { BlockingEntity } from '@/features/content/components';
import type { CharacterDoc } from '@/features/character/domain/types';

export type RaceValidationMode = 'delete' | 'disallow';

export type ChangeValidationResult =
  | { allowed: true }
  | {
      allowed: false;
      reason?: 'IN_USE';
      message: string;
      blockingEntities?: BlockingEntity[];
    };

type CharacterWithRace = Pick<CharacterDoc, '_id' | 'name' | 'race'>;

function buildRaceBlockedMessage(mode: RaceValidationMode, count: number): string {
  const noun = count === 1 ? 'character' : 'characters';

  if (mode === 'delete') {
    return `This race is currently used by ${count} ${noun}. Remove the race from those ${noun} before deleting.`;
  }

  return `This race is currently used by ${count} ${noun}. Change the race on those ${noun} before disabling it for the campaign.`;
}

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
  const { campaignId, raceId, mode } = params;

  const data = await apiFetch<{ characters?: CharacterWithRace[] }>(
    `/api/campaigns/${campaignId}/party?status=approved`,
  );

  const characters = data.characters ?? [];
  const using = characters.filter((c) => c.race === raceId);

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
    message: buildRaceBlockedMessage(mode, using.length),
    blockingEntities,
  };
}
