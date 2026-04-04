import type { LocationFormValues } from '@/features/content/locations/domain';
import { validateGridBootstrap } from '@/features/content/locations/domain';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';

/**
 * Same logical gates as {@link useLocationEditSaveActions} `handleCampaignSubmit` before work begins.
 * Returns a human-readable reason when save cannot proceed, or `null` when the campaign workspace is saveable.
 */
export function getCampaignWorkspaceSaveBlockReason(
  loc: LocationContentItem | null,
  activeFloorId: string | null,
  values: LocationFormValues,
): string | null {
  if (!loc) return null;
  const isBuilding = loc.source === 'campaign' && loc.scale === 'building';
  if (isBuilding && !activeFloorId) {
    return 'Add a floor before saving.';
  }
  return validateGridBootstrap(values);
}
