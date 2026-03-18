import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import type { AppDataGridColumn } from '@/ui/patterns';
import { AppTooltip } from '@/ui/primitives';
import { abilityIdToAbbrev } from '@/features/mechanics/domain/character';
import type { ClassListRow } from './classList.types';

function subclassTooltipText(options: { id: string; name: string }[]): string {
  const count = options.length;
  if (count === 0) return '';
  const names = options.map((o) => o.name);
  const first3 = names.slice(0, 3);
  const remaining = names.length - 3;
  return `Subclasses: ${first3.join(', ')}${remaining > 0 ? ' +' + remaining : ''}`;
}

function formatSpellcasting(value: unknown): string {
  return value === 'none' || !value ? '—' : String(value);
}

function formatPrimaryAbilities(ids: string[]): string {
  if (!ids.length) return '—';
  return ids.map(abilityIdToAbbrev).join(', ');
}

function renderSubclassCount(row: ClassListRow): ReactNode {
  const options = row.definitions?.options ?? [];
  const count = options.length;

  if (count === 0) return '—';

  return (
    <AppTooltip title={subclassTooltipText(options)}>
      <Box component="span">{String(count)}</Box>
    </AppTooltip>
  );
}

export function buildClassCustomColumns(): AppDataGridColumn<ClassListRow>[] {
  return [
    {
      field: 'subclasses',
      headerName: 'Subclasses',
      width: 80,
      accessor: (row) => row.definitions?.options ?? [],
      renderCell: (params) => renderSubclassCount(params.row),
    },
    {
      field: 'hitDie',
      headerName: 'Hit Die',
      width: 90,
      accessor: (row) => row.progression?.hitDie,
      valueFormatter: (v) => (v != null ? `d${v}` : '—'),
    },
    {
      field: 'spellcasting',
      headerName: 'Spellcasting',
      width: 120,
      accessor: (row) => row.progression?.spellcasting ?? 'none',
      valueFormatter: formatSpellcasting,
    },
    {
      field: 'primaryAbilities',
      headerName: 'Primary Abilities',
      width: 140,
      accessor: (row) => row.generation?.primaryAbilities ?? [],
      valueFormatter: (v) => formatPrimaryAbilities((v as string[]) ?? []),
    },
  ];
}
