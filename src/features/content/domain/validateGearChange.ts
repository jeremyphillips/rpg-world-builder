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
import { apiFetch } from '@/app/api';
import type { BlockingEntity } from '@/features/content/components';
import type { CharacterDoc } from '@/features/character/domain/types';
import type { ChangeValidationResult } from './validateRaceChange';

export type GearValidationMode = 'delete' | 'disallow';

type CharacterWithGear = Pick<CharacterDoc, '_id' | 'name' | 'equipment'>;

function buildGearBlockedMessage(mode: GearValidationMode, count: number): string {
  const noun = count === 1 ? 'character' : 'characters';

  if (mode === 'delete') {
    return `This gear is currently owned by ${count} ${noun}. Remove the gear from those ${noun} before deleting.`;
  }

  return `This gear is currently owned by ${count} ${noun}. Remove the gear from those ${noun} before disabling it for the campaign.`;
}

/**
 * Validates whether gear can be deleted or disabled.
 *
 * Checks characters in the campaign. A character "owns" gear if
 * it appears in their equipment.gear array.
 *
 * TODO: extend to also check NPC usage once NPC gear support exists
 */
export async function validateGearChange(params: {
  campaignId: string;
  gearId: string;
  mode: GearValidationMode;
  includeNpcs?: boolean;
}): Promise<ChangeValidationResult> {
  const { campaignId, gearId, mode } = params;

  const data = await apiFetch<{ characters?: CharacterWithGear[] }>(
    `/api/campaigns/${campaignId}/party?status=approved`,
  );

  const characters = data.characters ?? [];
  const using = characters.filter(
    (c) => c.equipment?.gear?.includes(gearId) ?? false,
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
    message: buildGearBlockedMessage(mode, using.length),
    blockingEntities,
  };
}
