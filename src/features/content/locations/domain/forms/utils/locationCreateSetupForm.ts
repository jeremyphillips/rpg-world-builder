import type { GridSizePreset } from '@/shared/domain/grid/gridPresets';
import { GRID_SIZE_PRESETS } from '@/shared/domain/grid/gridPresets';
import {
  getDefaultGeometryForScale,
  normalizeGridCellUnitForScale,
  type LocationScaleId,
} from '@/shared/domain/locations';

import type { Location } from '@/features/content/locations/domain/types';
import { LOCATION_FORM_DEFAULTS } from '../config/locationForm.config';
import type { LocationFormValues } from '../types/locationForm.types';
import { sanitizeLocationFormValues } from './locationDependentFieldsPolicy';

export type LocationCreateSetupDraft = {
  name: string;
  scale: string;
  parentId: string;
  category: string;
  gridCellUnit: string;
  gridPresetKey: GridSizePreset;
};

export function buildLocationFormValuesFromSetup(
  draft: LocationCreateSetupDraft,
  locations: Location[],
): LocationFormValues {
  const scale = draft.scale as LocationScaleId;
  const preset = GRID_SIZE_PRESETS[draft.gridPresetKey];
  const base: LocationFormValues = {
    ...LOCATION_FORM_DEFAULTS,
    name: draft.name.trim(),
    scale: draft.scale,
    parentId: draft.parentId.trim(),
    category: draft.category.trim(),
    gridPreset: draft.gridPresetKey,
    gridColumns: String(preset.columns),
    gridRows: String(preset.rows),
    gridCellUnit: normalizeGridCellUnitForScale(draft.gridCellUnit, draft.scale),
    gridGeometry: getDefaultGeometryForScale(scale),
  };

  const patch = sanitizeLocationFormValues(base, {
    scale: draft.scale,
    locations,
  });

  return { ...base, ...patch };
}
