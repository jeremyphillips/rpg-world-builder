/**
 * Creates or updates the default LocationMap from location form bootstrap fields.
 */
import { isCellUnitAllowedForScale, getDefaultMapKindForScale, normalizeGridGeometryForScale } from '@/shared/domain/locations';
import type { LocationScaleId } from '@/shared/domain/locations';
import type { GridGeometryId } from '@/shared/domain/grid/gridGeometry';
import type { LocationFormValues } from '@/features/content/locations/domain/forms/types/locationForm.types';
import {
  createLocationMap,
  listLocationMaps,
  updateLocationMap,
} from '@/features/content/locations/domain/repo/locationMapRepo';
import type {
  LocationMapCellAuthoringEntry,
  LocationMapEdgeAuthoringEntry,
  LocationMapPathAuthoringEntry,
  LocationMapRegionAuthoringEntry,
} from '@/shared/domain/locations';
import { normalizeLocationMapAuthoringFields } from '@/shared/domain/locations';
import { pruneExcludedCellIdsForGrid } from '@/features/content/locations/domain/authoring/map/gridLayoutDraft';

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
    pathEntries?: LocationMapPathAuthoringEntry[];
    edgeEntries?: LocationMapEdgeAuthoringEntry[];
    regionEntries?: LocationMapRegionAuthoringEntry[];
  },
): Promise<void> {
  const err = validateGridBootstrap(values);
  if (err) throw new Error(err);

  const cols = Number(values.gridColumns);
  const rows = Number(values.gridRows);
  const cellUnit = String(values.gridCellUnit).trim();
  const geometry: GridGeometryId = normalizeGridGeometryForScale(
    values.gridGeometry ?? '',
    scale,
  );
  const mapKind = getDefaultMapKindForScale(scale);

  if (!isCellUnitAllowedForScale(cellUnit, scale)) {
    throw new Error(`Cell unit must be allowed for scale "${scale}" (map kind "${mapKind}")`);
  }

  const maps = await listLocationMaps(campaignId, locationId);
  const defaultMap = maps.find((m) => m.isDefault) ?? maps[0];

  const grid = { width: cols, height: rows, cellUnit, geometry };
  const excludedCellIds = pruneExcludedCellIdsForGrid(
    options?.excludedCellIds ?? [],
    cols,
    rows,
  );
  const layout = { excludedCellIds };
  const authoring = normalizeLocationMapAuthoringFields({
    cellEntries: options?.cellEntries,
    pathEntries: options?.pathEntries,
    edgeEntries: options?.edgeEntries,
    regionEntries: options?.regionEntries,
  });

  if (defaultMap) {
    await updateLocationMap(campaignId, locationId, defaultMap.id, {
      grid,
      layout,
      isDefault: true,
      ...authoring,
    });
    return;
  }

  await createLocationMap(campaignId, locationId, {
    name: `${locationName} map`,
    kind: mapKind,
    grid,
    layout,
    isDefault: true,
    cells: [],
    ...authoring,
  });
}

export function pickMapGridFormValues(
  values: LocationFormValues,
): Pick<LocationFormValues, 'gridGeometry' | 'gridPreset' | 'gridColumns' | 'gridRows' | 'gridCellUnit'> {
  return {
    gridGeometry: values.gridGeometry,
    gridPreset: values.gridPreset,
    gridColumns: values.gridColumns,
    gridRows: values.gridRows,
    gridCellUnit: values.gridCellUnit,
  };
}
