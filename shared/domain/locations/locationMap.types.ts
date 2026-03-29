import { LOCATION_CELL_UNIT_IDS, LOCATION_MAP_KIND_IDS } from './locationMap.constants';

export type LocationMapKindId = (typeof LOCATION_MAP_KIND_IDS)[number];

export type LocationCellUnitId = (typeof LOCATION_CELL_UNIT_IDS)[number];

export type LocationMapGrid = {
  width: number;
  height: number;
  cellUnit: LocationCellUnitId | string | number;
};

export type LocationMapCell = {
  cellId: string;
  x: number;
  y: number;
  terrain?: string;
  label?: string;
};

/** Map fields shared by client and API (no campaign scope). */
export type LocationMapBase = {
  id: string;
  locationId: string;
  name: string;
  kind: LocationMapKindId;
  grid: LocationMapGrid;
  isDefault?: boolean;
  cells?: LocationMapCell[];
};
