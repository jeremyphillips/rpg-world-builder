/**
 * Location change validator — used when toggling "allowed in campaign" or deleting.
 *
 * Server-side tree integrity (parent/scale) stays on the API; this layer is for
 * campaign-entity references when they exist.
 */
import type { ChangeValidationResult } from '@/features/content/shared/domain/validation/validateCharacterReferenceChange';

export type LocationValidationMode = 'delete' | 'disallow';

/**
 * First pass: no client-side reference graph for locations yet (characters do not
 * reference location ids). Returns allowed until NPC / scene references exist.
 */
export async function validateLocationChange(params: {
  campaignId: string;
  locationId: string;
  mode: LocationValidationMode;
}): Promise<ChangeValidationResult> {
  void params;
  return { allowed: true };
}
