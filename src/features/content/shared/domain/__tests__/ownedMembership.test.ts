import { describe, expect, it } from 'vitest';

import { filterRows } from '@/ui/patterns/AppDataGrid/core/appDataGridFiltering';

import { rowOwnedSegment, showPcOwnedNameIcon } from '../ownedMembership';
import { createOwnedMembershipFilter } from '../ownedMembershipFilter';

describe('rowOwnedSegment', () => {
  it('returns owned when id is in set', () => {
    expect(rowOwnedSegment('a', new Set(['a', 'b']))).toBe('owned');
  });

  it('returns notOwned when id is missing', () => {
    expect(rowOwnedSegment('c', new Set(['a', 'b']))).toBe('notOwned');
  });
});

describe('showPcOwnedNameIcon', () => {
  const pcViewer = { campaignRole: 'pc' as const, isOwner: false, isPlatformAdmin: false, characterIds: ['x'] };
  const dmViewer = { campaignRole: 'dm' as const, isOwner: false, isPlatformAdmin: false, characterIds: [] };

  it('is true for PC viewer when row is owned', () => {
    expect(
      showPcOwnedNameIcon({
        viewerContext: pcViewer,
        ownedIds: new Set(['r1']),
        rowId: 'r1',
      }),
    ).toBe(true);
  });

  it('is false for DM viewer even when owned', () => {
    expect(
      showPcOwnedNameIcon({
        viewerContext: dmViewer,
        ownedIds: new Set(['r1']),
        rowId: 'r1',
      }),
    ).toBe(false);
  });

  it('is false when row not owned', () => {
    expect(
      showPcOwnedNameIcon({
        viewerContext: pcViewer,
        ownedIds: new Set(['r2']),
        rowId: 'r1',
      }),
    ).toBe(false);
  });
});

describe('createOwnedMembershipFilter + filterRows', () => {
  type Row = { id: string; name: string };

  const rows: Row[] = [
    { id: '1', name: 'A' },
    { id: '2', name: 'B' },
    { id: '3', name: 'C' },
  ];

  const columns = [{ field: 'name', headerName: 'Name' }] as const;

  const ownedIds = new Set(['1', '3']);
  const filter = createOwnedMembershipFilter<Row>(ownedIds);

  it('passes all rows when value is all', () => {
    const out = filterRows({
      rows,
      columns: columns as never,
      filters: [filter],
      filterValues: { owned: 'all' },
      searchable: false,
      search: '',
    });
    expect(out.map((r) => r.id)).toEqual(['1', '2', '3']);
  });

  it('keeps only owned rows', () => {
    const out = filterRows({
      rows,
      columns: columns as never,
      filters: [filter],
      filterValues: { owned: 'owned' },
      searchable: false,
      search: '',
    });
    expect(out.map((r) => r.id)).toEqual(['1', '3']);
  });

  it('keeps only not-owned rows', () => {
    const out = filterRows({
      rows,
      columns: columns as never,
      filters: [filter],
      filterValues: { owned: 'notOwned' },
      searchable: false,
      search: '',
    });
    expect(out.map((r) => r.id)).toEqual(['2']);
  });
});
