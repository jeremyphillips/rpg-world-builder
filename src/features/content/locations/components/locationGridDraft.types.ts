import type {
  LocationMapCellFillKindId,
  LocationMapCellObjectEntry,
  LocationMapEdgeAuthoringEntry,
  LocationMapPathAuthoringEntry,
  LocationMapRegionAuthoringEntry,
} from '@/shared/domain/locations';

import type { LocationMapSelection } from './workspace/rightRail/locationEditorRail.types';

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
  /** Whole-cell terrain / surface fill (sparse). */
  cellFillByCellId: Record<string, LocationMapCellFillKindId | undefined>;
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
