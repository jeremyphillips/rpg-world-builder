import type {
  LocationMapCellFillSelection,
  LocationMapCellObjectEntry,
  LocationMapEdgeAuthoringEntry,
  LocationMapPathAuthoringEntry,
  LocationMapRegionAuthoringEntry,
} from '@/shared/domain/locations';

import type { LocationMapSelection } from '@/features/content/locations/components/workspace/rightRail/types';

/** Same shape as persisted map cell objects. */
export type LocationCellObjectDraft = LocationMapCellObjectEntry;

export type LocationGridDraftState = {
  /** Map inspector selection (not persisted); orthogonal to {@link selectedCellId} for cell chrome. */
  mapSelection: LocationMapSelection;
  selectedCellId: string | null;
  excludedCellIds: string[];
  /** At most one linked campaign location id per cell. */
  linkedLocationByCellId: Record<string, string | undefined>;
  /** Simple objects placed on each cell (authoring draft). */
  objectsByCellId: Record<string, LocationCellObjectDraft[]>;
  /** Whole-cell terrain / surface fill (sparse) — family + variant from cell-fill registry. */
  cellFillByCellId: Record<string, LocationMapCellFillSelection | undefined>;
  /** Map-level path chains (persisted on LocationMap). */
  pathEntries: LocationMapPathAuthoringEntry[];
  /** Map-level edge features on boundaries (persisted on LocationMap). */
  edgeEntries: LocationMapEdgeAuthoringEntry[];
  /** Authored regions (overlay); cells reference ids via {@link regionIdByCellId}. */
  regionEntries: LocationMapRegionAuthoringEntry[];
  /** Sparse cell → region membership (persisted via cellEntries.regionId). */
  regionIdByCellId: Record<string, string | undefined>;
};

export const INITIAL_LOCATION_GRID_DRAFT: LocationGridDraftState = {
  mapSelection: { type: 'none' },
  selectedCellId: null,
  excludedCellIds: [],
  linkedLocationByCellId: {},
  objectsByCellId: {},
  cellFillByCellId: {},
  pathEntries: [],
  edgeEntries: [],
  regionEntries: [],
  regionIdByCellId: {},
};
