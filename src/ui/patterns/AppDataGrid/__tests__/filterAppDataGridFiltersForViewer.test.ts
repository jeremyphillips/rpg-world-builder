import { describe, expect, it } from 'vitest';

import type { AppDataGridFilter } from '../types';
import { filterAppDataGridFiltersForViewer } from '../filterAppDataGridFiltersForViewer';

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

describe('filterAppDataGridFiltersForViewer', () => {
  it('keeps all filters when no visibility flags', () => {
    const viewer = { campaignRole: null, isOwner: false, isPlatformAdmin: false, characterIds: [] };
    expect(filterAppDataGridFiltersForViewer(filtersNoVisibility, viewer)).toHaveLength(2);
  });

  it('hides platformAdminOnly when viewer is not platform admin', () => {
    const viewer = { campaignRole: null, isOwner: false, isPlatformAdmin: false, characterIds: [] };
    expect(filterAppDataGridFiltersForViewer(filtersWithAdminOnly, viewer).map((f) => f.id)).toEqual([
      'a',
      'c',
    ]);
  });

  it('shows platformAdminOnly when viewer is platform admin', () => {
    const viewer = { campaignRole: null, isOwner: false, isPlatformAdmin: true, characterIds: [] };
    expect(filterAppDataGridFiltersForViewer(filtersWithAdminOnly, viewer)).toHaveLength(3);
  });

  it('hides platformAdminOnly when viewer is undefined', () => {
    expect(filterAppDataGridFiltersForViewer(filtersWithAdminOnly, undefined).map((f) => f.id)).toEqual([
      'a',
      'c',
    ]);
  });
});
