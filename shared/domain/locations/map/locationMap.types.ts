import {
  LOCATION_CELL_UNIT_IDS,
  LOCATION_MAP_KIND_IDS,
  LOCATION_MAP_OBJECT_KIND_IDS,
} from './locationMap.constants';
import type { GridGeometryId } from '../../grid/gridGeometry';

export type LocationMapKindId = (typeof LOCATION_MAP_KIND_IDS)[number];

export type LocationMapObjectKindId = (typeof LOCATION_MAP_OBJECT_KIND_IDS)[number];

export type LocationCellUnitId = (typeof LOCATION_CELL_UNIT_IDS)[number];

/**
 * Rectangular bounding grid for a map. Width/height are column/row counts.
 * Irregular footprints are expressed via `LocationMapLayout`, not by changing this shape.
 */
export type LocationMapGrid = {
  width: number;
  height: number;
  cellUnit: LocationCellUnitId | string | number;
  /** Grid geometry; omitted on legacy maps defaults to 'square'. */
  geometry?: GridGeometryId;
};

/** Optional authoring layout layered on the bounding grid (e.g. excluded cells). */
export type LocationMapLayout = {
  excludedCellIds?: string[];
};

export type LocationMapCell = {
  cellId: string;
  x: number;
  y: number;
  terrain?: string;
  label?: string;
};

/** Authoring payload for a single grid cell (map-owned; persisted on LocationMap). */
export type LocationMapCellObjectEntry = {
  id: string;
  kind: LocationMapObjectKindId;
  label?: string;
};

export type LocationMapCellAuthoringEntry = {
  cellId: string;
  linkedLocationId?: string;
  objects?: LocationMapCellObjectEntry[];
};

/** Map fields shared by client and API (no campaign scope). */
export type LocationMapBase = {
  id: string;
  locationId: string;
  name: string;
  kind: LocationMapKindId;
  grid: LocationMapGrid;
  layout?: LocationMapLayout;
  isDefault?: boolean;
  cells?: LocationMapCell[];
  /** Sparse cell authoring: links + simple objects (optional). */
  cellEntries?: LocationMapCellAuthoringEntry[];
};
