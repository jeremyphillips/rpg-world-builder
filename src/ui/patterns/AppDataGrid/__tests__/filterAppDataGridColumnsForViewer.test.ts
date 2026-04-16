import { describe, expect, it } from 'vitest';

import type { AppDataGridColumn } from '../types';
import { filterAppDataGridColumnsForViewer } from '../filterAppDataGridColumnsForViewer';

type Row = { id: string };

const columnsNoVisibility: AppDataGridColumn<Row>[] = [
  { field: 'a', headerName: 'A' },
  { field: 'c', headerName: 'C' },
];

const columnsWithAdminOnly: AppDataGridColumn<Row>[] = [
  ...columnsNoVisibility,
  { field: 'b', headerName: 'B', visibility: { platformAdminOnly: true } },
];

describe('filterAppDataGridColumnsForViewer', () => {
  it('keeps all columns when no visibility flags', () => {
    const viewer = { campaignRole: null, isOwner: false, isPlatformAdmin: false, characterIds: [] };
    expect(filterAppDataGridColumnsForViewer(columnsNoVisibility, viewer)).toHaveLength(2);
  });

  it('hides platformAdminOnly when viewer is not platform admin', () => {
    const viewer = { campaignRole: null, isOwner: false, isPlatformAdmin: false, characterIds: [] };
    expect(filterAppDataGridColumnsForViewer(columnsWithAdminOnly, viewer).map((c) => c.field)).toEqual([
      'a',
      'c',
    ]);
  });

  it('shows platformAdminOnly when viewer is platform admin', () => {
    const viewer = { campaignRole: null, isOwner: false, isPlatformAdmin: true, characterIds: [] };
    expect(filterAppDataGridColumnsForViewer(columnsWithAdminOnly, viewer)).toHaveLength(3);
  });

  it('hides platformAdminOnly when viewer is undefined', () => {
    expect(filterAppDataGridColumnsForViewer(columnsWithAdminOnly, undefined).map((c) => c.field)).toEqual([
      'a',
      'c',
    ]);
  });
});
