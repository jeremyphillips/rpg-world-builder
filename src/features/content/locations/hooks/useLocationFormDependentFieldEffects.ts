import { useEffect, useRef } from 'react';
import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form';

import type { Location } from '@/features/content/locations/domain/model/location';
import type { LocationFormValues } from '@/features/content/locations/domain/forms/types/locationForm.types';
import { sanitizeLocationFormValues } from '@/features/content/locations/domain/forms/rules/locationDependentFieldsPolicy';

/**
 * Keeps category, parent, grid cell unit, and building profile fields aligned with scale,
 * parent list, and Building Type (subtype invalidation).
 * Dirty only when the user changes scale (not when campaign locations load to fix stale parent,
 * nor when Building Type change auto-clears subtype).
 */
export function useLocationFormDependentFieldEffects(
  scale: string,
  locations: Location[] | undefined,
  excludeLocationId: string | undefined,
  getValues: UseFormGetValues<LocationFormValues>,
  setValue: UseFormSetValue<LocationFormValues>,
  enabled = true,
  buildingPrimaryType?: string,
) {
  const prevScaleRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
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
  }, [scale, locations, excludeLocationId, getValues, setValue, enabled, buildingPrimaryType]);
}
