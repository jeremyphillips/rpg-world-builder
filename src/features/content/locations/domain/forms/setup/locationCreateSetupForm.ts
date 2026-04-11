import type { GridSizePreset } from '@/shared/domain/grid/gridPresets';
import { GRID_SIZE_PRESETS } from '@/shared/domain/grid/gridPresets';
import {
  getDefaultGeometryForScale,
  LOCATION_BUILDING_FORM_DEFAULT_GRID_SIZES,
  normalizeGridCellUnitForScale,
  type LocationBuildingFormClassId,
  type LocationScaleId,
} from '@/shared/domain/locations';

import type { Location } from '@/features/content/locations/domain/model/location';
import { LOCATION_FORM_DEFAULTS } from '../config/locationForm.config';
import type { LocationFormValues } from '../types/locationForm.types';
import { sanitizeLocationFormValues } from '../rules/locationFormSanitize';

export type LocationCreateSetupDraft = {
  name: string;
  scale: string;
  parentId: string;
  category: string;
  gridCellUnit: string;
  gridPresetKey: GridSizePreset;
  /** Building scale — maps to `buildingMeta` + first-floor grid via {@link LOCATION_BUILDING_FORM_DEFAULT_GRID_SIZES} */
  buildingPrimaryType?: string;
  buildingPrimarySubtype?: string;
  buildingFunctions?: string[];
  buildingIsPublicStorefront?: boolean;
  /** Structural form class — drives default interior grid columns/rows at 5′ cells. */
  buildingFormClassId?: LocationBuildingFormClassId;
};

export function buildLocationFormValuesFromSetup(
  draft: LocationCreateSetupDraft,
  locations: Location[],
): LocationFormValues {
  const scale = draft.scale as LocationScaleId;
  const isBuilding = scale === 'building';
  const formClass: LocationBuildingFormClassId = draft.buildingFormClassId ?? 'compact_medium';
  const gridPresetKey = isBuilding ? ('medium' as GridSizePreset) : draft.gridPresetKey;
  const preset = isBuilding
    ? LOCATION_BUILDING_FORM_DEFAULT_GRID_SIZES[formClass]
    : GRID_SIZE_PRESETS[gridPresetKey];
  const base: LocationFormValues = {
    ...LOCATION_FORM_DEFAULTS,
    name: draft.name.trim(),
    scale: draft.scale,
    parentId: draft.parentId.trim(),
    category: draft.category.trim(),
    gridPreset: gridPresetKey,
    gridColumns: String(preset.columns),
    gridRows: String(preset.rows),
    gridCellUnit: normalizeGridCellUnitForScale(draft.gridCellUnit, draft.scale),
    gridGeometry: getDefaultGeometryForScale(scale),
    ...(isBuilding
      ? {
          buildingPrimaryType: draft.buildingPrimaryType?.trim() ?? '',
          buildingPrimarySubtype: draft.buildingPrimarySubtype?.trim() ?? '',
          buildingFunctions: Array.isArray(draft.buildingFunctions) ? draft.buildingFunctions : [],
          buildingIsPublicStorefront: Boolean(draft.buildingIsPublicStorefront),
        }
      : {}),
  };

  const patch = sanitizeLocationFormValues(base, {
    scale: draft.scale,
    locations,
  });

  return { ...base, ...patch };
}
