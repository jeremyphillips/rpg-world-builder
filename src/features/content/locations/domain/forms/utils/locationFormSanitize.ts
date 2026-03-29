/**
 * Centralized cleanup when scale (or grid authorship) implies stricter field values.
 */
import type { LocationFormValues } from '@/features/content/locations/domain/forms/types/locationForm.types';
import { getAllowedCellUnitOptionsForScale } from '@/features/content/locations/domain/forms/utils/locationFormUiRules';

export function getLocationFormPatchForScaleChange(
  values: LocationFormValues,
  nextScale: string,
): Partial<LocationFormValues> {
  const patch: Partial<LocationFormValues> = {};
  if (nextScale === 'world') {
    patch.category = '';
    patch.parentId = '';
  }
  const allowed = getAllowedCellUnitOptionsForScale(nextScale);
  const u = String(values.gridCellUnit ?? '').trim();
  if (u && !allowed.some((o) => o.value === u)) {
    patch.gridCellUnit = allowed[0]?.value ?? '';
  }
  return patch;
}
