import { describe, expect, it } from 'vitest';

import type { AppDataGridFilter } from '../types';
import { getActiveFilterBadgeSegments } from '../filters/filterBadges';

type Row = { id: string };

const baseMulti: AppDataGridFilter<Row> = {
  id: 'classes',
  label: 'Classes',
  type: 'multiSelect',
  options: [
    { value: 'w', label: 'Wizard' },
    { value: 'f', label: 'Fighter' },
  ],
  accessor: () => [],
};

describe('getActiveFilterBadgeSegments', () => {
  it('multiSelect: one segment per selected value with removeValue', () => {
    const segs = getActiveFilterBadgeSegments(baseMulti, ['w', 'f']);
    expect(segs).toEqual([
      { label: 'Wizard', removeValue: 'w' },
      { label: 'Fighter', removeValue: 'f' },
    ]);
  });

  it('multiSelect: formatActiveBadgeValue string[] zips removeValue with selected order', () => {
    const f: AppDataGridFilter<Row> = {
      ...baseMulti,
      formatActiveBadgeValue: () => ['A', 'B'],
    };
    const segs = getActiveFilterBadgeSegments(f, ['w', 'f']);
    expect(segs).toEqual([
      { label: 'A', removeValue: 'w' },
      { label: 'B', removeValue: 'f' },
    ]);
  });

  it('select: single segment, no removeValue', () => {
    const f: AppDataGridFilter<Row> = {
      id: 'lvl',
      label: 'Level',
      type: 'select',
      options: [
        { value: '', label: 'All' },
        { value: '1', label: '1st' },
      ],
      accessor: () => '1',
    };
    expect(getActiveFilterBadgeSegments(f, '1')).toEqual([{ label: '1st' }]);
  });

  it('range: formatActiveBadgeValue controls badge text', () => {
    const f: AppDataGridFilter<Row> = {
      id: 'cr',
      label: 'CR',
      type: 'range',
      steps: [0.25, 1, 5],
      accessor: () => 1,
      defaultValue: { min: 0.25, max: 5 },
      formatStepValue: (n) => String(n),
      formatActiveBadgeValue: () => 'CR: 1/4–1',
    };
    expect(getActiveFilterBadgeSegments(f, { min: 1, max: 1 })).toEqual([
      { label: 'CR: 1/4–1' },
    ]);
  });

  it('range: fallback segment uses formatStepValue when no chip formatter', () => {
    const f: AppDataGridFilter<Row> = {
      id: 'lvl',
      label: 'Level',
      type: 'range',
      steps: [1, 2, 3],
      accessor: () => 2,
      defaultValue: { min: 1, max: 3 },
      formatStepValue: (n) => `L${n}`,
    };
    expect(getActiveFilterBadgeSegments(f, { min: 1, max: 2 })).toEqual([
      { label: 'L1–L2' },
    ]);
  });
});
