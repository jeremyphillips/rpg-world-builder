import type { AppDataGridFilter } from '@/ui/patterns';
import type { MonsterListRow } from './monsterList.types';
import {
  MONSTER_SIZE_CATEGORY_OPTIONS,
  MONSTER_TYPE_OPTIONS,
} from '@/features/content/monsters/domain/vocab/monster.vocab';

import { formatChallengeRatingDisplay } from './challengeRatingDisplay';

export function buildMonsterCustomFilters(params: {
  crSteps: number[];
}): AppDataGridFilter<MonsterListRow>[] {
  const { crSteps } = params;
  const base: AppDataGridFilter<MonsterListRow>[] = [
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
    },
  ];

  if (crSteps.length === 0) {
    return base;
  }

  const minCr = crSteps[0]!;
  const maxCr = crSteps[crSteps.length - 1]!;

  return [
    ...base,
    {
      id: 'challengeRating',
      label: 'CR',
      type: 'range',
      steps: crSteps,
      accessor: (row) => row.lore.challengeRating,
      defaultValue: { min: minCr, max: maxCr },
      formatStepValue: formatChallengeRatingDisplay,
      formatActiveChipValue: ({ value }) => {
        const v = value as { min: number; max: number };
        return `CR: ${formatChallengeRatingDisplay(v.min)}\u2013${formatChallengeRatingDisplay(v.max)}`;
      },
    },
  ];
}
