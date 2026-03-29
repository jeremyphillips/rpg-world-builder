/**
 * Creates or updates the default LocationMap from location form bootstrap fields.
 */
import { isCellUnitAllowedForScale, mapKindForLocationScale } from '@/shared/domain/locations';
import type { LocationScaleId } from '@/shared/domain/locations';
import type { LocationFormValues } from '@/features/content/locations/domain/forms/types/locationForm.types';
import {
  createLocationMap,
  listLocationMaps,
  updateLocationMap,
} from '@/features/content/locations/domain/repo/locationMapRepo';
import type { LocationMapCellAuthoringEntry } from '@/shared/domain/locations';
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
  options?: {
    excludedCellIds?: string[];
    cellEntries?: LocationMapCellAuthoringEntry[];
  },
): Promise<void> {
  const err = validateGridBootstrap(values);
  if (err) throw new Error(err);

  const cols = Number(values.gridColumns);
  const rows = Number(values.gridRows);
  const cellUnit = String(values.gridCellUnit).trim();
  if (!isCellUnitAllowedForScale(cellUnit, scale)) {
    const kind = mapKindForLocationScale(scale);
    throw new Error(`Cell unit must be allowed for scale "${scale}" (map kind "${kind}")`);
  }

  const maps = await listLocationMaps(campaignId, locationId);
  const defaultMap = maps.find((m) => m.isDefault) ?? maps[0];

  const grid = { width: cols, height: rows, cellUnit };
  const excludedCellIds = pruneExcludedCellIdsForGrid(
    options?.excludedCellIds ?? [],
    cols,
    rows,
  );
  const layout = { excludedCellIds };
  const cellEntries = options?.cellEntries ?? [];

  if (defaultMap) {
    await updateLocationMap(campaignId, locationId, defaultMap.id, {
      grid,
      layout,
      isDefault: true,
      cellEntries,
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
    cellEntries,
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
