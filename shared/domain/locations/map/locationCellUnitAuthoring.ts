import { LOCATION_CELL_UNIT_IDS, type LocationCellUnitId } from './locationMap.constants';

/**
 * Authoring-time resolution: **one cell edge** length in **feet** for the current map `grid.cellUnit`.
 * Used with {@link resolvePlacedObjectFootprintLayoutPx}. Encounter tactical uses a fixed
 * **5 ft/cell** scale (`locationMapCombat.constants.ts`); `cellUnitToCombatCellFeet` only validates
 * which authored `grid.cellUnit` values may convert — see `placed-objects-flow.md` (parity section).
 *
 * **Unsupported** `cellUnit` values (unknown strings, numeric legacy, `mile`-scale detail) return `unsupported`
 * so callers can fall back to fixed icon sizing instead of silent wrong scaling.
 */
export type AuthoringCellSpanResolution =
  | { kind: 'ok'; feetPerCell: number }
  | { kind: 'unsupported'; reason: string };

const FEET_PER_CELL_BY_ID: Record<LocationCellUnitId, number> = {
  /** 5280 ft — large-area maps; furniture footprints may be visually tiny vs cell (explicitly degraded UX). */
  mile: 5280,
  'half-mile': 2640,
  'quarter-mile': 1320,
  /** Approximate city block (authoring convention; adjust if product defines otherwise). */
  block: 330,
  '100ft': 100,
  '25ft': 25,
  '5ft': 5,
};

function normalizeCellUnitKey(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase();
}

/**
 * Maps persisted `LocationMap.grid.cellUnit` to **feet per cell** for **editor / layout** math.
 */
export function resolveAuthoringCellUnitFeetPerCell(cellUnit: unknown): AuthoringCellSpanResolution {
  const key = normalizeCellUnitKey(cellUnit);
  if (key === '') {
    return { kind: 'unsupported', reason: 'empty_cell_unit' };
  }
  if ((LOCATION_CELL_UNIT_IDS as readonly string[]).includes(key)) {
    return { kind: 'ok', feetPerCell: FEET_PER_CELL_BY_ID[key as LocationCellUnitId] };
  }
  const n = Number(cellUnit);
  if (Number.isFinite(n) && n > 0) {
    return { kind: 'unsupported', reason: 'numeric_cell_unit_not_mapped' };
  }
  return { kind: 'unsupported', reason: 'unknown_cell_unit' };
}
