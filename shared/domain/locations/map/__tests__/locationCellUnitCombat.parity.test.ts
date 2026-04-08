// @vitest-environment node
/**
 * Documents authoring vs combat feet-per-cell for the same `grid.cellUnit` string.
 * {@link resolveAuthoringCellUnitFeetPerCell} and {@link cellUnitToCombatCellFeet} are different products;
 * mismatches are expected for some units until product aligns them.
 */
import { describe, expect, it } from 'vitest';

import { cellUnitToCombatCellFeet } from '../locationCellUnitCombat';
import { resolveAuthoringCellUnitFeetPerCell } from '../locationCellUnitAuthoring';

describe('cellUnitToCombatCellFeet vs resolveAuthoringCellUnitFeetPerCell (parity matrix)', () => {
  it('5ft: both use 5 ft per cell', () => {
    expect(resolveAuthoringCellUnitFeetPerCell('5ft')).toEqual({ kind: 'ok', feetPerCell: 5 });
    expect(cellUnitToCombatCellFeet('5ft')).toBe(5);
  });

  it('25ft: authoring is 25 ft/cell, combat space uses 10 ft (coarse tactical scale)', () => {
    expect(resolveAuthoringCellUnitFeetPerCell('25ft')).toEqual({ kind: 'ok', feetPerCell: 25 });
    expect(cellUnitToCombatCellFeet('25ft')).toBe(10);
  });

  it('100ft: authoring 100 ft/cell; combat defaults to 5 ft (no 25 substring)', () => {
    expect(resolveAuthoringCellUnitFeetPerCell('100ft')).toEqual({ kind: 'ok', feetPerCell: 100 });
    expect(cellUnitToCombatCellFeet('100ft')).toBe(5);
  });
});
