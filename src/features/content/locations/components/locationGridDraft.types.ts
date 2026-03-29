import type { LocationMapCellObjectEntry } from '@/shared/domain/locations';

/** Same shape as persisted map cell objects. */
export type LocationCellObjectDraft = LocationMapCellObjectEntry;

export type LocationGridDraftState = {
  selectedCellId: string | null;
  excludedCellIds: string[];
  /** At most one linked campaign location id per cell. */
  linkedLocationByCellId: Record<string, string | undefined>;
  /** Simple objects placed on each cell (authoring draft). */
  objectsByCellId: Record<string, LocationCellObjectDraft[]>;
  /** When set, the cell edit modal is open for this cell id. */
  cellModalCellId: string | null;
};

export const INITIAL_LOCATION_GRID_DRAFT: LocationGridDraftState = {
  selectedCellId: null,
  excludedCellIds: [],
  linkedLocationByCellId: {},
  objectsByCellId: {},
  cellModalCellId: null,
};
