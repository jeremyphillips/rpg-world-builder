/** Location authoring uses `x,y`; combat square grids use `c-x-y`. */
export function authorCellIdToCombatCellId(authorCellId: string): string {
  const t = authorCellId.trim()
  const m = /^(\d+),(\d+)$/.exec(t)
  if (m) return `c-${m[1]}-${m[2]}`
  return t
}
