import type {
  LocationMapCellFillKindId,
  LocationMapCellObjectEntry,
  LocationMapEdgeFeatureEntry,
  LocationMapPathSegment,
} from '@/shared/domain/locations';

/** Same shape as persisted map cell objects. */
export type LocationCellObjectDraft = LocationMapCellObjectEntry;

export type LocationGridDraftState = {
  selectedCellId: string | null;
  excludedCellIds: string[];
  /** At most one linked campaign location id per cell. */
  linkedLocationByCellId: Record<string, string | undefined>;
  /** Simple objects placed on each cell (authoring draft). */
  objectsByCellId: Record<string, LocationCellObjectDraft[]>;
  /** Whole-cell terrain / surface fill (sparse). */
  cellFillByCellId: Record<string, LocationMapCellFillKindId | undefined>;
  /** Map-level path segments (persisted on LocationMap). */
  pathSegments: LocationMapPathSegment[];
  /** Map-level edge features (persisted on LocationMap). */
  edgeFeatures: LocationMapEdgeFeatureEntry[];
};

export const INITIAL_LOCATION_GRID_DRAFT: LocationGridDraftState = {
  selectedCellId: null,
  excludedCellIds: [],
  linkedLocationByCellId: {},
  objectsByCellId: {},
  cellFillByCellId: {},
  pathSegments: [],
  edgeFeatures: [],
};
