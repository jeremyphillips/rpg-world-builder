import { describe, expect, it } from 'vitest';

import { isAppDataGridVisibleToViewer } from '../viewer/visibilityForViewer';
import type { AppDataGridFilter } from '../types';
import { filterAppDataGridFiltersByVisibility } from '../viewer/filtersForViewer';

type Row = { id: string };

const filtersNoVisibility: AppDataGridFilter<Row>[] = [
  {
    id: 'a',
    label: 'A',
    type: 'select',
    options: [{ value: 'x', label: 'X' }],
    accessor: () => '',
  },
  {
    id: 'c',
    label: 'C',
    type: 'select',
    options: [{ value: 'z', label: 'Z' }],
    accessor: () => '',
  },
];

const filtersWithAdminOnly: AppDataGridFilter<Row>[] = [
  ...filtersNoVisibility,
  {
    id: 'b',
    label: 'B',
    type: 'select',
    options: [{ value: 'y', label: 'Y' }],
    accessor: () => '',
    visibility: { platformAdminOnly: true },
  },
];

describe('filterAppDataGridFiltersByVisibility', () => {
  it('keeps all filters when no visibility flags', () => {
    const viewer = { campaignRole: null, isOwner: false, isPlatformAdmin: false, characterIds: [] };
    expect(filterAppDataGridFiltersByVisibility(filtersNoVisibility, viewer)).toHaveLength(2);
  });

  it('hides platformAdminOnly when viewer is not platform admin', () => {
    const viewer = { campaignRole: null, isOwner: false, isPlatformAdmin: false, characterIds: [] };
    expect(filterAppDataGridFiltersByVisibility(filtersWithAdminOnly, viewer).map((f) => f.id)).toEqual([
      'a',
      'c',
    ]);
  });

  it('shows platformAdminOnly when viewer is platform admin', () => {
    const viewer = { campaignRole: null, isOwner: false, isPlatformAdmin: true, characterIds: [] };
    expect(filterAppDataGridFiltersByVisibility(filtersWithAdminOnly, viewer)).toHaveLength(3);
  });

  it('hides platformAdminOnly when viewer is undefined', () => {
    expect(filterAppDataGridFiltersByVisibility(filtersWithAdminOnly, undefined).map((f) => f.id)).toEqual([
      'a',
      'c',
    ]);
  });
});

const pcOnlyFilter: AppDataGridFilter<{ id: string }> = {
  id: 'owned',
  label: 'Owned',
  type: 'select',
  defaultValue: 'all',
  options: [
    { value: 'all', label: 'All' },
    { value: 'owned', label: 'Owned' },
  ],
  accessor: () => 'owned',
  visibility: { pcViewerOnly: true },
};

describe('filter pcViewerOnly visibility', () => {
  const pcViewer = { campaignRole: 'pc' as const, isOwner: false, isPlatformAdmin: false, characterIds: ['c1'] };
  const dmViewer = { campaignRole: 'dm' as const, isOwner: false, isPlatformAdmin: false, characterIds: [] };

  it('isAppDataGridVisibleToViewer: hides pcViewerOnly for DMs', () => {
    expect(isAppDataGridVisibleToViewer({ pcViewerOnly: true }, dmViewer)).toBe(false);
  });

  it('isAppDataGridVisibleToViewer: shows pcViewerOnly for non-managers', () => {
    expect(isAppDataGridVisibleToViewer({ pcViewerOnly: true }, pcViewer)).toBe(true);
  });

  it('isAppDataGridVisibleToViewer: hides pcViewerOnly when viewer undefined', () => {
    expect(isAppDataGridVisibleToViewer({ pcViewerOnly: true }, undefined)).toBe(false);
  });

  it('filterAppDataGridFiltersByVisibility keeps pc-only filter for PCs', () => {
    expect(
      filterAppDataGridFiltersByVisibility(
        [...filtersNoVisibility, pcOnlyFilter],
        pcViewer,
      ).map((f) => f.id),
    ).toContain('owned');
  });

  it('filterAppDataGridFiltersByVisibility drops pc-only filter for DMs', () => {
    expect(
      filterAppDataGridFiltersByVisibility(
        [...filtersNoVisibility, pcOnlyFilter],
        dmViewer,
      ).map((f) => f.id),
    ).not.toContain('owned');
  });
});

const dmOnlyFilter: AppDataGridFilter<{ id: string }> = {
  id: 'dmOwnedByCharacter',
  label: 'Owned by character',
  type: 'select',
  defaultValue: 'all',
  options: [
    { value: 'all', label: 'All' },
    { value: 'c1', label: 'PC' },
  ],
  accessor: () => 'all',
  visibility: { dmViewerOnly: true },
};

describe('filter dmViewerOnly visibility', () => {
  const pcViewer = { campaignRole: 'pc' as const, isOwner: false, isPlatformAdmin: false, characterIds: ['c1'] };
  const dmViewer = { campaignRole: 'dm' as const, isOwner: false, isPlatformAdmin: false, characterIds: [] };

  it('isAppDataGridVisibleToViewer: shows dmViewerOnly for DMs', () => {
    expect(isAppDataGridVisibleToViewer({ dmViewerOnly: true }, dmViewer)).toBe(true);
  });

  it('isAppDataGridVisibleToViewer: hides dmViewerOnly for non-managers', () => {
    expect(isAppDataGridVisibleToViewer({ dmViewerOnly: true }, pcViewer)).toBe(false);
  });

  it('isAppDataGridVisibleToViewer: hides dmViewerOnly when viewer undefined', () => {
    expect(isAppDataGridVisibleToViewer({ dmViewerOnly: true }, undefined)).toBe(false);
  });

  it('filterAppDataGridFiltersByVisibility keeps dm-only filter for DMs', () => {
    expect(
      filterAppDataGridFiltersByVisibility([...filtersNoVisibility, dmOnlyFilter], dmViewer).map((f) => f.id),
    ).toContain('dmOwnedByCharacter');
  });

  it('filterAppDataGridFiltersByVisibility drops dm-only filter for PCs', () => {
    expect(
      filterAppDataGridFiltersByVisibility([...filtersNoVisibility, dmOnlyFilter], pcViewer).map((f) => f.id),
    ).not.toContain('dmOwnedByCharacter');
  });
});
