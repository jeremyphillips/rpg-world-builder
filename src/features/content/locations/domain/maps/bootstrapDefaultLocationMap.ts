/**
 * Creates or updates the default LocationMap from location form bootstrap fields.
 */
import {
  CELL_UNITS_BY_KIND,
  mapKindForLocationScale,
} from '@/shared/domain/locations';
import type { LocationScaleId } from '@/shared/domain/locations';
import type { LocationFormValues } from '@/features/content/locations/domain/forms/types/locationForm.types';
import {
  createLocationMap,
  listLocationMaps,
  updateLocationMap,
} from '@/features/content/locations/domain/repo/locationMapRepo';
import { pruneExcludedCellIdsForGrid } from '@/features/content/locations/domain/maps/gridLayoutDraft';

export function validateGridBootstrap(values: LocationFormValues): string | null {
  const cols = Number(values.gridColumns);
  const rows = Number(values.gridRows);
  if (!Number.isInteger(cols) || cols < 1) {
    return 'Grid columns must be a positive integer';
  }
  if (!Number.isInteger(rows) || rows < 1) {
    return 'Grid rows must be a positive integer';
  }
  const unit = String(values.gridCellUnit ?? '').trim();
  if (!unit) {
    return 'Cell unit is required when creating a grid';
  }
  return null;
}

export async function bootstrapDefaultLocationMap(
  campaignId: string,
  locationId: string,
  locationName: string,
  scale: LocationScaleId,
  values: LocationFormValues,
  gridLayout?: { excludedCellIds?: string[] },
): Promise<void> {
  const err = validateGridBootstrap(values);
  if (err) throw new Error(err);

  const cols = Number(values.gridColumns);
  const rows = Number(values.gridRows);
  const cellUnit = String(values.gridCellUnit).trim();
  const kind = mapKindForLocationScale(scale);
  const allowed = CELL_UNITS_BY_KIND[kind];
  if (!(allowed as readonly string[]).includes(cellUnit)) {
    throw new Error(`Cell unit must be one of: ${allowed.join(', ')} for this location scale`);
  }

  const maps = await listLocationMaps(campaignId, locationId);
  const defaultMap = maps.find((m) => m.isDefault) ?? maps[0];

  const grid = { width: cols, height: rows, cellUnit };
  const excludedCellIds = pruneExcludedCellIdsForGrid(
    gridLayout?.excludedCellIds ?? [],
    cols,
    rows,
  );
  const layout = { excludedCellIds };

  if (defaultMap) {
    await updateLocationMap(campaignId, locationId, defaultMap.id, {
      grid,
      layout,
      isDefault: true,
    });
    return;
  }

  await createLocationMap(campaignId, locationId, {
    name: `${locationName} map`,
    kind,
    grid,
    layout,
    isDefault: true,
    cells: [],
  });
}

export function pickMapGridFormValues(
  values: LocationFormValues,
): Pick<LocationFormValues, 'gridPreset' | 'gridColumns' | 'gridRows' | 'gridCellUnit'> {
  return {
    gridPreset: values.gridPreset,
    gridColumns: values.gridColumns,
    gridRows: values.gridRows,
    gridCellUnit: values.gridCellUnit,
  };
}
