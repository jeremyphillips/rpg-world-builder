/**
 * Coarse **combat** feet-per-cell when deriving {@link EncounterSpace} from a location map’s
 * `grid.cellUnit`. Mechanics only supports **5** or **10** ft cells today — this is **not** the same
 * function as {@link resolveAuthoringCellUnitFeetPerCell} (authoring layout / placed-object resolver
 * when editing the map). See `docs/reference/locations/placed-objects-flow.md` (workspace vs encounter parity).
 */
export function cellUnitToCombatCellFeet(cellUnit: unknown): 5 | 10 {
  const s = String(cellUnit ?? '')
    .toLowerCase()
    .trim();
  if (s.includes('25') || s === '25ft') return 10;
  return 5;
}
