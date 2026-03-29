/**
 * Re-exports dependent-field sanitization (single entry for older imports).
 */
export type { LocationFormSanitizeContext } from '@/features/content/locations/domain/forms/utils/locationDependentFieldsPolicy';
export {
  sanitizeLocationDraftForScale,
  sanitizeLocationFormValues,
} from '@/features/content/locations/domain/forms/utils/locationDependentFieldsPolicy';

import type { LocationFormValues } from '@/features/content/locations/domain/forms/types/locationForm.types';
import { sanitizeLocationDraftForScale } from '@/features/content/locations/domain/forms/utils/locationDependentFieldsPolicy';

/** @deprecated Prefer sanitizeLocationDraftForScale */
export function getLocationFormPatchForScaleChange(
  values: LocationFormValues,
  nextScale: string,
): Partial<LocationFormValues> {
  return sanitizeLocationDraftForScale(values, nextScale);
}
