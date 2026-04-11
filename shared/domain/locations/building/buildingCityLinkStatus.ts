import type { LocationBaseFields } from '../locationEntity.types';

type BuildingForCityLink = Pick<LocationBaseFields, 'id' | 'scale' | 'parentId'>;

/**
 * Compact linkage state for city ↔ building UX (workspace + link picker).
 * Room for refinement when `cityPlacementRef` / richer map scans land.
 */
export type BuildingCityLinkStatusId =
  | 'ready'
  | 'needsPlacement'
  | 'linkedHere'
  | 'linkedElsewhere'
  | 'conflict';

export type BuildingCityLinkStatus = {
  status: BuildingCityLinkStatusId;
  /** Short label for lists / option secondary text */
  label: string;
  /** Longer hint for tooltips or helper lines */
  message?: string;
  /** Lower sorts earlier (picker ordering). */
  sortPriority: number;
  selectable: boolean;
  /** City workspace: include in warning aggregation */
  warning?: boolean;
};

const SORT = {
  needsPlacement: 0,
  ready: 1,
  linkedHere: 2,
  linkedElsewhere: 3,
  conflict: 4,
} as const;

export type DeriveBuildingCityLinkStatusForWorkspaceInput = {
  cityHostLocationId: string;
  building: BuildingForCityLink;
  /** Building ids appearing as `linkedLocationId` on any cell of this city host's maps */
  linkedOnThisCityHost: Set<string>;
  /** Building ids linked on any campaign map cell */
  linkedAnywhereInCampaign: Set<string>;
};

/** Right-rail / summary: buildings whose parent is this city */
export function deriveBuildingCityLinkStatusForWorkspace(
  input: DeriveBuildingCityLinkStatusForWorkspaceInput,
): BuildingCityLinkStatus {
  const { cityHostLocationId, building, linkedOnThisCityHost, linkedAnywhereInCampaign } = input;
  const id = building.id;
  const parentIsCity = building.parentId === cityHostLocationId;
  const onThisCity = linkedOnThisCityHost.has(id);
  const somewhere = linkedAnywhereInCampaign.has(id);

  if (!parentIsCity && onThisCity) {
    return {
      status: 'conflict',
      label: 'Mismatch',
      message: 'This building is placed on the city map but its parent is not set to this city.',
      sortPriority: SORT.conflict,
      selectable: false,
      warning: true,
    };
  }

  if (parentIsCity && somewhere && !onThisCity) {
    return {
      status: 'conflict',
      label: 'Mismatch',
      message: 'This building is linked on another map, which conflicts with the one-placement rule.',
      sortPriority: SORT.conflict,
      selectable: false,
      warning: true,
    };
  }

  if (parentIsCity && !somewhere) {
    return {
      status: 'needsPlacement',
      label: 'Needs placement',
      message: 'Place this building on the city map to finish linking.',
      sortPriority: SORT.needsPlacement,
      selectable: true,
      warning: true,
    };
  }

  if (parentIsCity && onThisCity) {
    return {
      status: 'linkedHere',
      label: 'Placed on map',
      sortPriority: SORT.linkedHere,
      selectable: true,
      warning: false,
    };
  }

  return {
    status: 'ready',
    label: '—',
    sortPriority: SORT.ready,
    selectable: true,
    warning: false,
  };
}

export type DeriveBuildingCityLinkStatusForPickerInput = {
  cityHostLocationId: string;
  building: BuildingForCityLink;
  /** True if another map cell already links this building (excluding current cell exclusion handled upstream) */
  reservedForAnotherCell: boolean;
  linkedOnThisCityHost: Set<string>;
  linkedAnywhereInCampaign: Set<string>;
  isCurrentCellSelection: boolean;
};

/** Building link picker on city/site map */
export function deriveBuildingCityLinkStatusForPicker(
  input: DeriveBuildingCityLinkStatusForPickerInput,
): BuildingCityLinkStatus {
  const {
    cityHostLocationId,
    building,
    reservedForAnotherCell,
    linkedOnThisCityHost,
    linkedAnywhereInCampaign,
    isCurrentCellSelection,
  } = input;

  const id = building.id;
  const parentIsCity = building.parentId === cityHostLocationId;
  const onThisCity = linkedOnThisCityHost.has(id);
  const somewhere = linkedAnywhereInCampaign.has(id);

  if (isCurrentCellSelection) {
    return {
      status: 'linkedHere',
      label: 'Linked here',
      sortPriority: SORT.linkedHere,
      selectable: true,
      warning: false,
    };
  }

  if (reservedForAnotherCell) {
    return {
      status: 'linkedElsewhere',
      label: 'Already linked on another cell',
      message: 'Choose a different building or clear the link on the other cell first.',
      sortPriority: SORT.linkedElsewhere,
      selectable: false,
      warning: false,
    };
  }

  if (!parentIsCity && onThisCity) {
    return {
      status: 'conflict',
      label: 'Placement mismatch',
      message: 'Parent is not this city, but this building appears on this city map.',
      sortPriority: SORT.conflict,
      selectable: false,
      warning: true,
    };
  }

  if (parentIsCity && !somewhere) {
    return {
      status: 'needsPlacement',
      label: 'Needs placement',
      message: 'Select to place this building on the map and finish linking.',
      sortPriority: SORT.needsPlacement,
      selectable: true,
      warning: false,
    };
  }

  if (parentIsCity && somewhere && !onThisCity) {
    return {
      status: 'conflict',
      label: 'Linked elsewhere',
      message: 'This building is already placed on another campaign map.',
      sortPriority: SORT.conflict,
      selectable: false,
      warning: true,
    };
  }

  return {
    status: 'ready',
    label: 'Available',
    sortPriority: SORT.ready,
    selectable: true,
    warning: false,
  };
}

export function sortBuildingPickerOptionsByLinkStatus<T extends { value: string }>(
  options: T[],
  statusByBuildingId: Map<string, BuildingCityLinkStatus>,
): T[] {
  return [...options].sort((a, b) => {
    const sa = statusByBuildingId.get(a.value)?.sortPriority ?? 99;
    const sb = statusByBuildingId.get(b.value)?.sortPriority ?? 99;
    if (sa !== sb) return sa - sb;
    return a.value.localeCompare(b.value);
  });
}
