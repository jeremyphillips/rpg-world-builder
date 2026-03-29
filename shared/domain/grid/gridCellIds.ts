/**
 * Stable cell identity for rectangular grids (origin top-left, x grows right, y grows down).
 */

export type GridPoint = {
  x: number;
  y: number;
};

/** Convention: "x,y" with integer coordinates (e.g. "0,0", "3,2"). */
export function makeGridCellId(x: number, y: number): string {
  return `${x},${y}`;
}

export function parseGridCellId(cellId: string): GridPoint | null {
  const m = /^(-?\d+),(-?\d+)$/.exec(cellId.trim());
  if (!m) return null;
  return { x: Number(m[1]), y: Number(m[2]) };
}
