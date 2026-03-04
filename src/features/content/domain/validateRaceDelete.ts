import { apiFetch } from '@/app/api';
import type { DeleteValidationResult, BlockingEntity } from '@/features/content/components';
import type { CharacterDoc } from '@/features/character/domain/types';

type CharacterWithRace = Pick<CharacterDoc, '_id' | 'name' | 'race'>

/**
 * Checks whether a campaign race can be safely deleted by verifying
 * no characters in the campaign currently reference it.
 */
export async function validateRaceDelete(
  campaignId: string,
  raceId: string,
): Promise<DeleteValidationResult> {
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

  const count = using.length;
  const noun = count === 1 ? 'character' : 'characters';

  return {
    allowed: false,
    reason: 'IN_USE',
    message: `This race is currently used by ${count} ${noun}. Remove the race from those characters before deleting.`,
    blockingEntities,
  };
}
