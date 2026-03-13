import type { AppDataGridFilter } from '@/ui/patterns';
import type { MonsterListRow } from './monsterList.types';
import { MONSTER_SIZE_CATEGORIES } from './monsterList.options';

export function buildMonsterCustomFilters(): AppDataGridFilter<MonsterListRow>[] {
  return [
    {
      id: 'sizeCategory',
      label: 'Size Category',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        ...MONSTER_SIZE_CATEGORIES.map((c) => ({ label: c.label, value: c.value })),
      ],
      accessor: (row) => row.sizeCategory ?? '',
      defaultValue: 'all',
    },
  ];
}
