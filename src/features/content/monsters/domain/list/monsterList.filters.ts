import type { AppDataGridFilter } from '@/ui/patterns';
import type { MonsterListRow } from './monsterList.types';
import {
  MONSTER_SIZE_CATEGORY_OPTIONS,
  MONSTER_TYPE_OPTIONS,
} from '@/features/content/monsters/domain/vocab/monster.vocab';

export function buildMonsterCustomFilters(): AppDataGridFilter<MonsterListRow>[] {
  return [
    {
      id: 'monsterType',
      label: 'Type',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        ...MONSTER_TYPE_OPTIONS.map((c) => ({ label: c.name, value: c.id })),
      ],
      accessor: (row) => row.type ?? '',
      defaultValue: 'all',
    },
    {
      id: 'sizeCategory',
      label: 'Size Category',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        ...MONSTER_SIZE_CATEGORY_OPTIONS.map((c) => ({ label: c.name, value: c.id })),
      ],
      accessor: (row) => row.sizeCategory ?? '',
      defaultValue: 'all',
    }
  ];
}
