// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  validateCellUnitForKind,
  validateGridDimensions,
  validateLocationMapCells,
  validateLocationMapInput,
} from '../../../../../shared/domain/locations';
import { LOCATION_MAP_GRID_MAX_WIDTH } from '../../../../../shared/domain/locations';

describe('locationMaps.validation', () => {
  it('rejects non-integer and oversized grid dimensions', () => {
    expect(validateGridDimensions(10.5, 10).some((e) => e.code === 'INVALID_GRID')).toBe(true);
    expect(validateGridDimensions(0, 10).length).toBeGreaterThan(0);
    expect(
      validateGridDimensions(LOCATION_MAP_GRID_MAX_WIDTH + 1, 10).some((e) => e.code === 'OUT_OF_RANGE'),
    ).toBe(true);
  });

  it('rejects invalid kind / cellUnit combinations', () => {
    const err = validateCellUnitForKind('world-grid', '5ft');
    expect(err.length).toBe(1);
    expect(err[0].code).toBe('INVALID_CELL_UNIT');
  });

  it('validates full map input for kind + unit', () => {
    const ok = validateLocationMapInput({
      name: 'M',
      kind: 'encounter-grid',
      grid: { width: 20, height: 20, cellUnit: '5ft' },
      cells: [],
    });
    expect(ok).toEqual([]);
  });

  it('rejects duplicate cellId and duplicate coordinates', () => {
    const dupId = validateLocationMapCells(
      [
        { cellId: 'a', x: 0, y: 0 },
        { cellId: 'a', x: 1, y: 1 },
      ],
      5,
      5,
    );
    expect(dupId.some((e) => e.code === 'DUPLICATE_CELL_ID')).toBe(true);

    const dupXY = validateLocationMapCells(
      [
        { cellId: 'a', x: 1, y: 1 },
        { cellId: 'b', x: 1, y: 1 },
      ],
      5,
      5,
    );
    expect(dupXY.some((e) => e.code === 'DUPLICATE_COORDINATES')).toBe(true);
  });

  it('rejects out-of-bounds cells', () => {
    const oob = validateLocationMapCells([{ cellId: 'a', x: 10, y: 0 }], 10, 10);
    expect(oob.some((e) => e.code === 'OUT_OF_BOUNDS')).toBe(true);
  });
});
