import type { ReactNode } from 'react';
import type { AppDataGridColumn } from '@/ui/patterns';
import type { LocationListRow } from './locationList.types';

function parentLabel(row: LocationListRow, idToName: Map<string, string>): string {
  if (!row.parentId) return '—';
  return idToName.get(row.parentId) ?? row.parentId;
}

export function buildLocationCustomColumns(
  idToName: Map<string, string>,
): AppDataGridColumn<LocationListRow>[] {
  return [
    {
      field: 'scale',
      headerName: 'Scale',
      width: 120,
      accessor: (row) => row.scale,
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 130,
      accessor: (row) => row.category ?? '',
      valueFormatter: (v) => (v ? String(v) : '—'),
    },
    {
      field: 'parent',
      headerName: 'Parent',
      width: 160,
      accessor: (row) => row.parentId ?? '',
      renderCell: (params): ReactNode => parentLabel(params.row, idToName),
    },
  ];
}
