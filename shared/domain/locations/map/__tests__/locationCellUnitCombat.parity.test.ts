// @vitest-environment node
/** Encounter tactical scale is 5 ft/cell only; supported `grid.cellUnit` values are validated, not mapped to 10 ft. */
import { describe, expect, it } from 'vitest';

import {
  ENCOUNTER_MAP_CELL_UNITS_SUPPORTED,
  cellUnitToCombatCellFeet,
} from '../locationCellUnitCombat';
import { ENCOUNTER_TACTICAL_CELL_FEET } from '../locationMapCombat.constants';
import { resolveAuthoringCellUnitFeetPerCell } from '../locationCellUnitAuthoring';

describe('cellUnitToCombatCellFeet', () => {
  it('returns tactical 5 ft for supported encounter map units', () => {
    expect(cellUnitToCombatCellFeet('5ft')).toBe(ENCOUNTER_TACTICAL_CELL_FEET);
    expect(cellUnitToCombatCellFeet('25ft')).toBe(ENCOUNTER_TACTICAL_CELL_FEET);
  });

  it('does not map unsupported units to 10 ft (legacy branch removed)', () => {
    expect(() => cellUnitToCombatCellFeet('100ft')).toThrow(/not supported/);
  });

  it('throws on empty cell unit', () => {
    expect(() => cellUnitToCombatCellFeet('')).toThrow(/requires grid.cellUnit/);
    expect(() => cellUnitToCombatCellFeet(undefined)).toThrow(/requires grid.cellUnit/);
  });
});

describe('authoring feet vs encounter tactical (documented divergence)', () => {
  it('5ft: authoring and tactical both 5 ft per conceptual cell', () => {
    expect(resolveAuthoringCellUnitFeetPerCell('5ft')).toEqual({ kind: 'ok', feetPerCell: 5 });
    expect(cellUnitToCombatCellFeet('5ft')).toBe(5);
  });

  it('25ft: authoring uses 25 ft/editor cell; encounter tactical still 5 ft/cell', () => {
    expect(resolveAuthoringCellUnitFeetPerCell('25ft')).toEqual({ kind: 'ok', feetPerCell: 25 });
    expect(cellUnitToCombatCellFeet('25ft')).toBe(ENCOUNTER_TACTICAL_CELL_FEET);
  });

  it('100ft: authoring resolves; encounter conversion rejects', () => {
    expect(resolveAuthoringCellUnitFeetPerCell('100ft')).toEqual({ kind: 'ok', feetPerCell: 100 });
    expect(() => cellUnitToCombatCellFeet('100ft')).toThrow(/not supported/);
  });
});

describe('ENCOUNTER_MAP_CELL_UNITS_SUPPORTED', () => {
  it('lists encounter-grid cell units that normalize to tactical 5 ft', () => {
    expect(ENCOUNTER_MAP_CELL_UNITS_SUPPORTED).toEqual(['5ft', '25ft']);
  });
});
