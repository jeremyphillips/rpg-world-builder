import { useEffect, useRef } from 'react';
import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form';

import type { LocationFormValues } from '@/features/content/locations/domain/forms/types/locationForm.types';
import { getLocationFormPatchForScaleChange } from '@/features/content/locations/domain/forms/utils/locationFormSanitize';

/**
 * Clears category/parent when switching to world; fixes grid cell unit when scale changes allowed units.
 */
export function useLocationFormScaleEffects(
  scale: string,
  getValues: UseFormGetValues<LocationFormValues>,
  setValue: UseFormSetValue<LocationFormValues>,
) {
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const patch = getLocationFormPatchForScaleChange(getValues(), scale);
    for (const [key, val] of Object.entries(patch)) {
      setValue(key as keyof LocationFormValues, val as never, { shouldDirty: true });
    }
  }, [scale, getValues, setValue]);
}
