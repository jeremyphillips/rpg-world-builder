// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  pathEntriesToCenterlinePoints,
  pathEntryToCenterlinePoints,
} from '../locationMapPathCenterline.helpers';

describe('pathEntryToCenterlinePoints', () => {
  const centerFn = (cellId: string) => {
    const [x, y] = cellId.split(',').map(Number);
    return { cx: x * 10, cy: y * 10 };
  };

  it('maps cell ids to points', () => {
    const pts = pathEntryToCenterlinePoints(
      { id: 'a', kind: 'road', cellIds: ['0,0', '1,0'] },
      centerFn,
    );
    expect(pts).toEqual([
      { cx: 0, cy: 0 },
      { cx: 10, cy: 0 },
    ]);
  });
});

describe('pathEntriesToCenterlinePoints', () => {
  const centerFn = (cellId: string) => {
    const [x, y] = cellId.split(',').map(Number);
    return { cx: x * 10, cy: y * 10 };
  };

  it('drops chains with fewer than two points', () => {
    expect(
      pathEntriesToCenterlinePoints(
        [{ id: 'a', kind: 'road', cellIds: ['0,0'] }],
        centerFn,
      ),
    ).toEqual([]);
  });

  it('returns one row per valid chain', () => {
    const rows = pathEntriesToCenterlinePoints(
      [{ id: 'a', kind: 'river', cellIds: ['0,0', '0,1'] }],
      centerFn,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe('river');
    expect(rows[0].points).toHaveLength(2);
  });
});
