export type LocationGridDraftState = {
  selectedCellId: string | null;
  excludedCellIds: string[];
};

export const INITIAL_LOCATION_GRID_DRAFT: LocationGridDraftState = {
  selectedCellId: null,
  excludedCellIds: [],
};
