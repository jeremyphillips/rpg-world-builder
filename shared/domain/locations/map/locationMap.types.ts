import {
  LOCATION_MAP_KIND_IDS,
  LOCATION_MAP_OBJECT_KIND_IDS,
} from './locationMap.constants';
import type { LocationCellUnitId } from './locationMap.constants';
import type { LocationMapCellFillKindId } from './locationMapCellFill.constants';
import type { LocationMapEdgeFeatureKindId } from './locationMapEdgeFeature.constants';
import type { LocationMapPathFeatureKindId } from './locationMapPathFeature.constants';
import type { GridGeometryId } from '../../grid/gridGeometry';

export type { LocationCellUnitId };

export type LocationMapKindId = (typeof LOCATION_MAP_KIND_IDS)[number];

export type LocationMapObjectKindId = (typeof LOCATION_MAP_OBJECT_KIND_IDS)[number];

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
  /** Whole-cell terrain / surface fill (authored map content). */
  cellFillKind?: LocationMapCellFillKindId;
};

/**
 * Linear path segment between two adjacent cells (map-level authoring).
 * Endpoints are normalized lexicographically for stable identity.
 */
export type LocationMapPathSegment = {
  id: string;
  kind: LocationMapPathFeatureKindId;
  startCellId: string;
  endCellId: string;
};

/**
 * Feature attached to a cell boundary (e.g. wall on shared edge).
 * `edgeId` format: see `encodeSquareCellEdgeId` in shared grid helpers.
 */
export type LocationMapEdgeFeatureEntry = {
  id: string;
  kind: LocationMapEdgeFeatureKindId;
  edgeId: string;
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
  /** Map-level path segments (roads, rivers). */
  pathSegments?: LocationMapPathSegment[];
  /** Map-level edge features (walls, doors on boundaries). */
  edgeFeatures?: LocationMapEdgeFeatureEntry[];
};
