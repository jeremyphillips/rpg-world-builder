import { useEffect, useRef } from 'react';
import type { UseFormSetValue } from 'react-hook-form';

import type { LocationFormValues } from '@/features/content/locations/domain/forms/types/locationForm.types';

/**
 * Optional: default new campaign's first location to world when none exist yet.
 */
export function useLocationFormDefaultWorldScale(
  campaignId: string | null | undefined,
  locationsLoading: boolean,
  campaignHasWorldLocation: boolean,
  locationCount: number,
  setValue: UseFormSetValue<LocationFormValues>,
  enabled = true,
) {
  const applied = useRef(false);
  useEffect(() => {
    if (!enabled || !campaignId || locationsLoading || applied.current) return;
    if (locationCount === 0 && !campaignHasWorldLocation) {
      setValue('scale', 'world', { shouldDirty: false, shouldValidate: false });
      applied.current = true;
    }
  }, [campaignId, locationsLoading, campaignHasWorldLocation, locationCount, setValue, enabled]);
}
