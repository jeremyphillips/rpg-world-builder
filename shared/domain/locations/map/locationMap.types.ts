import {
  LOCATION_MAP_KIND_IDS,
  LOCATION_MAP_OBJECT_KIND_IDS,
} from './locationMap.constants';
import type { LocationCellUnitId } from './locationMap.constants';
import type { LocationMapCellFillKindId } from './locationMapCellFill.constants';
import type { LocationMapRegionColorKey } from './locationMapRegion.constants';
import type { LocationMapEdgeKindId } from './locationMapEdgeFeature.constants';
import type { LocationMapPathKindId } from './locationMapPathFeature.constants';
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
  /**
   * Palette / `LocationPlacedObjectKindId` when the editor persists it (encounter `GridObject` bridge).
   * Legacy maps omit this; encounter build may infer a lossy default from `kind` instead.
   */
  authoredPlaceKindId?: string;
};

export type LocationMapCellAuthoringEntry = {
  cellId: string;
  linkedLocationId?: string;
  objects?: LocationMapCellObjectEntry[];
  /** Whole-cell terrain / surface fill (authored map content). */
  cellFillKind?: LocationMapCellFillKindId;
  /** Membership in an authored map region (overlay; not terrain). */
  regionId?: string;
};

/** One authored named region (overlay); cells reference {@link LocationMapCellAuthoringEntry.regionId}. */
export type LocationMapRegionAuthoringEntry = {
  id: string;
  colorKey: LocationMapRegionColorKey;
  name: string;
  description?: string;
};

/**
 * One authored path chain (road or river). `cellIds` is ordered along the chain;
 * consecutive cells must be grid-adjacent.
 */
export type LocationMapPathAuthoringEntry = {
  id: string;
  kind: LocationMapPathKindId;
  cellIds: string[];
};

/**
 * One authored feature on a shared cell boundary. `edgeId` is the canonical
 * undirected key (see `makeUndirectedSquareEdgeKey` in grid edge helpers).
 */
export type LocationMapEdgeAuthoringEntry = {
  edgeId: string;
  kind: LocationMapEdgeKindId;
};

/** Sparse map-level authored content split by primitive. */
export type LocationMapAuthoringContent = {
  cellEntries: LocationMapCellAuthoringEntry[];
  pathEntries: LocationMapPathAuthoringEntry[];
  edgeEntries: LocationMapEdgeAuthoringEntry[];
  /** Authored region entities (cell membership via cellEntries.regionId). */
  regionEntries: LocationMapRegionAuthoringEntry[];
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
  /** Map-level path chains (roads, rivers). Normalized to `[]` at API boundaries when omitted. */
  pathEntries: LocationMapPathAuthoringEntry[];
  /** Map-level edges on shared boundaries. Normalized to `[]` at API boundaries when omitted. */
  edgeEntries: LocationMapEdgeAuthoringEntry[];
  /** Authored regions (overlay). Normalized to `[]` at API boundaries when omitted. */
  regionEntries: LocationMapRegionAuthoringEntry[];
};
