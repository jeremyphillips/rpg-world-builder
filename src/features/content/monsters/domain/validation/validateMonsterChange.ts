/**
 * Monster change validator.
 *
 * TODO: Add validation logic. No restrictions at the moment.
 * Future extensions:
 * - Encounter validation (monsters in encounters)
 * - NPC validation
 */
import type { ChangeValidationResult } from '@/features/content/shared/domain/validation/validateCharacterReferenceChange';

export type MonsterValidationMode = 'delete' | 'disallow';

/**
 * Validates whether a monster can be deleted or disabled.
 *
 * TODO: Add validation logic. Currently allows all changes.
 */
export async function validateMonsterChange(_params: {
  campaignId: string;
  monsterId: string;
  mode: MonsterValidationMode;
}): Promise<ChangeValidationResult> {
  return { allowed: true };
}
