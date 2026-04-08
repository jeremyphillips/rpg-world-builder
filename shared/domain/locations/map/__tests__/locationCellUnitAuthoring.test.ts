// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { resolveAuthoringCellUnitFeetPerCell } from '../locationCellUnitAuthoring';

describe('resolveAuthoringCellUnitFeetPerCell', () => {
  it('maps known cell unit ids to feet per cell', () => {
    expect(resolveAuthoringCellUnitFeetPerCell('5ft')).toEqual({ kind: 'ok', feetPerCell: 5 });
    expect(resolveAuthoringCellUnitFeetPerCell('25ft')).toEqual({ kind: 'ok', feetPerCell: 25 });
    expect(resolveAuthoringCellUnitFeetPerCell('mile')).toEqual({ kind: 'ok', feetPerCell: 5280 });
  });

  it('is case-insensitive for string labels', () => {
    expect(resolveAuthoringCellUnitFeetPerCell('5FT')).toEqual({ kind: 'ok', feetPerCell: 5 });
  });

  it('returns unsupported for unknown or numeric legacy cell units', () => {
    expect(resolveAuthoringCellUnitFeetPerCell('')).toMatchObject({ kind: 'unsupported' });
    expect(resolveAuthoringCellUnitFeetPerCell('nope')).toMatchObject({ kind: 'unsupported' });
    expect(resolveAuthoringCellUnitFeetPerCell(30)).toMatchObject({ kind: 'unsupported' });
  });
});
