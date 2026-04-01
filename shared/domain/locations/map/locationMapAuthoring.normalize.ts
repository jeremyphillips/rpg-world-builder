import type {
  LocationMapBase,
  LocationMapCellAuthoringEntry,
  LocationMapEdgeAuthoringEntry,
  LocationMapPathAuthoringEntry,
  LocationMapRegionAuthoringEntry,
} from './locationMap.types';
import { normalizeRegionEntriesArray } from './locationMapRegionAuthoring.normalize';

/**
 * Runtime normalization for persisted/API map authoring fields.
 * Ensures `cellEntries`, `pathEntries`, `edgeEntries`, and `regionEntries` are arrays (never undefined).
 * Does not change authored meaning when arrays are already present.
 */
export function normalizeLocationMapAuthoringFields(input: {
  cellEntries?: unknown;
  pathEntries?: unknown;
  edgeEntries?: unknown;
  regionEntries?: unknown;
}): {
  cellEntries: LocationMapCellAuthoringEntry[];
  pathEntries: LocationMapPathAuthoringEntry[];
  edgeEntries: LocationMapEdgeAuthoringEntry[];
  regionEntries: LocationMapRegionAuthoringEntry[];
} {
  return {
    cellEntries: Array.isArray(input.cellEntries)
      ? (input.cellEntries as LocationMapCellAuthoringEntry[])
      : [],
    pathEntries: Array.isArray(input.pathEntries)
      ? (input.pathEntries as LocationMapPathAuthoringEntry[])
      : [],
    edgeEntries: Array.isArray(input.edgeEntries)
      ? (input.edgeEntries as LocationMapEdgeAuthoringEntry[])
      : [],
    regionEntries: normalizeRegionEntriesArray(input.regionEntries),
  };
}

/**
 * Apply {@link normalizeLocationMapAuthoringFields} to a map loaded from persistence or the API.
 */
export function normalizeLocationMapBaseAuthoring(map: LocationMapBase): LocationMapBase {
  const a = normalizeLocationMapAuthoringFields(map);
  return { ...map, ...a };
}
