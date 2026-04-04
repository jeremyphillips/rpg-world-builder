/**
 * Location authoring uses `x,y`; combat square grids use `c-x-y`.
 * Shared so map render derivation and encounter build stay aligned.
 */
export function authorCellIdToCombatCellId(authorCellId: string): string {
  const t = authorCellId.trim();
  const m = /^(\d+),(\d+)$/.exec(t);
  if (m) return `c-${m[1]}-${m[2]}`;
  return t;
}

/** Inverse of {@link authorCellIdToCombatCellId} for `c-x-y` ids. */
export function combatCellIdToAuthorCellId(combatCellId: string): string | null {
  const m = /^c-(\d+)-(\d+)$/.exec(combatCellId.trim());
  if (!m) return null;
  return `${m[1]},${m[2]}`;
}
