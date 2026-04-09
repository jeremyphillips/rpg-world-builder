import { ENCOUNTER_TACTICAL_CELL_FEET } from './locationMapCombat.constants';

/**
 * `grid.cellUnit` values accepted when building encounter space from a location map.
 * Both normalize to {@link ENCOUNTER_TACTICAL_CELL_FEET} — authoring may use 25 ft per editor cell,
 * but tactical encounter mechanics use 5 ft per cell only.
 */
export const ENCOUNTER_MAP_CELL_UNITS_SUPPORTED = ['5ft', '25ft'] as const;

const SUPPORTED = new Set<string>(ENCOUNTER_MAP_CELL_UNITS_SUPPORTED);

/**
 * Validates `grid.cellUnit` for encounter conversion and returns the tactical feet-per-cell constant.
 * Encounter tactical scale is **5 ft per cell only** (no 10 ft branch).
 *
 * This is **not** `resolveAuthoringCellUnitFeetPerCell` — see `placed-objects-flow.md` (parity).
 */
export function cellUnitToCombatCellFeet(cellUnit: unknown): typeof ENCOUNTER_TACTICAL_CELL_FEET {
  const s = String(cellUnit ?? '')
    .toLowerCase()
    .trim();
  if (s === '') {
    throw new Error(
      'Encounter map conversion requires grid.cellUnit (e.g. 5ft or 25ft for encounter-grid maps).',
    );
  }
  if (!SUPPORTED.has(s)) {
    throw new Error(
      `Encounter tactical scale is ${ENCOUNTER_TACTICAL_CELL_FEET} ft/cell only; grid.cellUnit ${JSON.stringify(
        cellUnit,
      )} is not supported for encounter conversion. Use 5ft or 25ft (encounter-grid).`,
    );
  }
  return ENCOUNTER_TACTICAL_CELL_FEET;
}
