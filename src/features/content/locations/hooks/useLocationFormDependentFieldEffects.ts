import { useEffect, useRef } from 'react';
import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form';

import type { Location } from '@/features/content/locations/domain/types';
import type { LocationFormValues } from '@/features/content/locations/domain/forms/types/locationForm.types';
import { sanitizeLocationFormValues } from '@/features/content/locations/domain/forms/utils/locationDependentFieldsPolicy';

/**
 * Keeps category, parent, and grid cell unit aligned with scale and campaign parent list.
 * Dirty only when the user changes scale (not when campaign locations load to fix stale parent).
 */
export function useLocationFormDependentFieldEffects(
  scale: string,
  locations: Location[] | undefined,
  excludeLocationId: string | undefined,
  getValues: UseFormGetValues<LocationFormValues>,
  setValue: UseFormSetValue<LocationFormValues>,
) {
  const prevScaleRef = useRef<string | null>(null);

  useEffect(() => {
    const values = getValues();
    const patch = sanitizeLocationFormValues(values, {
      scale,
      locations,
      excludeLocationId,
    });
    if (Object.keys(patch).length === 0) {
      prevScaleRef.current = scale;
      return;
    }

    const scaleChanged = prevScaleRef.current !== null && prevScaleRef.current !== scale;
    prevScaleRef.current = scale;

    for (const [key, val] of Object.entries(patch)) {
      setValue(key as keyof LocationFormValues, val as never, { shouldDirty: scaleChanged });
    }
  }, [scale, locations, excludeLocationId, getValues, setValue]);
}
