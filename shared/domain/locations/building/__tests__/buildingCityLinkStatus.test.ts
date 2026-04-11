import { describe, expect, it } from 'vitest';

import {
  deriveBuildingCityLinkStatusForPicker,
  deriveBuildingCityLinkStatusForWorkspace,
  sortBuildingPickerOptionsByLinkStatus,
  type BuildingCityLinkStatus,
} from '../buildingCityLinkStatus';

const baseBuilding = (id: string, parentId: string) => ({
  id,
  name: id,
  scale: 'building' as const,
  parentId,
});

describe('deriveBuildingCityLinkStatusForWorkspace', () => {
  it('needs placement when parent is city but not linked on host maps', () => {
    const s = deriveBuildingCityLinkStatusForWorkspace({
      cityHostLocationId: 'city1',
      building: baseBuilding('b1', 'city1'),
      linkedOnThisCityHost: new Set(),
      linkedAnywhereInCampaign: new Set(),
    });
    expect(s.status).toBe('needsPlacement');
    expect(s.warning).toBe(true);
  });

  it('linked here when parent matches and placement exists on city maps', () => {
    const s = deriveBuildingCityLinkStatusForWorkspace({
      cityHostLocationId: 'city1',
      building: baseBuilding('b1', 'city1'),
      linkedOnThisCityHost: new Set(['b1']),
      linkedAnywhereInCampaign: new Set(['b1']),
    });
    expect(s.status).toBe('linkedHere');
  });

  it('conflict when placement on city but parent wrong', () => {
    const s = deriveBuildingCityLinkStatusForWorkspace({
      cityHostLocationId: 'city1',
      building: baseBuilding('b1', 'other'),
      linkedOnThisCityHost: new Set(['b1']),
      linkedAnywhereInCampaign: new Set(['b1']),
    });
    expect(s.status).toBe('conflict');
  });
});

describe('deriveBuildingCityLinkStatusForPicker', () => {
  it('needs placement when parent is city and building not linked anywhere', () => {
    const s = deriveBuildingCityLinkStatusForPicker({
      cityHostLocationId: 'city1',
      building: baseBuilding('b1', 'city1'),
      reservedForAnotherCell: false,
      linkedOnThisCityHost: new Set(),
      linkedAnywhereInCampaign: new Set(),
      isCurrentCellSelection: false,
    });
    expect(s.status).toBe('needsPlacement');
    expect(s.selectable).toBe(true);
  });

  it('linked elsewhere when reserved on another cell', () => {
    const s = deriveBuildingCityLinkStatusForPicker({
      cityHostLocationId: 'city1',
      building: baseBuilding('b1', 'city1'),
      reservedForAnotherCell: true,
      linkedOnThisCityHost: new Set(['b1']),
      linkedAnywhereInCampaign: new Set(['b1']),
      isCurrentCellSelection: false,
    });
    expect(s.status).toBe('linkedElsewhere');
    expect(s.selectable).toBe(false);
  });
});

describe('sortBuildingPickerOptionsByLinkStatus', () => {
  it('orders needs placement before higher sort priorities', () => {
    const byId = new Map<string, BuildingCityLinkStatus>([
      ['a', { status: 'ready', label: '', sortPriority: 1, selectable: true }],
      ['b', { status: 'needsPlacement', label: '', sortPriority: 0, selectable: true }],
    ]);
    const sorted = sortBuildingPickerOptionsByLinkStatus([{ value: 'a' }, { value: 'b' }], byId);
    expect(sorted.map((o) => o.value)).toEqual(['b', 'a']);
  });
});
