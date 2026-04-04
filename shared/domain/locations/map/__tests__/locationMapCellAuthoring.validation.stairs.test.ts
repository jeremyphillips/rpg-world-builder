// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { validateCellEntriesStructure } from '../locationMapCellAuthoring.validation';

describe('validateCellEntriesStructure (stairs)', () => {
  const w = 5;
  const h = 5;

  it('accepts stairs with stairEndpoint', () => {
    const errors = validateCellEntriesStructure(
      [
        {
          cellId: '0,0',
          objects: [
            {
              id: 'o1',
              kind: 'stairs',
              stairEndpoint: { direction: 'both', targetLocationId: 'floor-2' },
            },
          ],
        },
      ],
      w,
      h,
    );
    expect(errors).toEqual([]);
  });

  it('rejects stairEndpoint on non-stairs kind', () => {
    const errors = validateCellEntriesStructure(
      [
        {
          cellId: '0,0',
          objects: [{ id: 'o1', kind: 'table', stairEndpoint: { direction: 'both' } }],
        },
      ],
      w,
      h,
    );
    expect(errors.some((e) => e.path.includes('stairEndpoint'))).toBe(true);
  });

  it('rejects bad direction', () => {
    const errors = validateCellEntriesStructure(
      [
        {
          cellId: '0,0',
          objects: [{ id: 'o1', kind: 'stairs', stairEndpoint: { direction: 'sideways' } }],
        },
      ],
      w,
      h,
    );
    expect(errors.some((e) => e.path.endsWith('.direction'))).toBe(true);
  });
});
