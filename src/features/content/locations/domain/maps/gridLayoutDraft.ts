import { parseGridCellId } from '@/shared/domain/grid/gridCellIds'

/**
 * Drops excluded cell ids that fall outside the grid or are invalid.
 */
export function pruneExcludedCellIdsForGrid(
  excludedCellIds: string[],
  columns: number,
  rows: number,
): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const id of excludedCellIds) {
    const parsed = parseGridCellId(id)
    if (!parsed) continue
    const { x, y } = parsed
    if (x < 0 || y < 0 || x >= columns || y >= rows) continue
    if (seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out.sort()
}

/**
 * Drops entries whose cell id is outside the grid or invalid.
 */
export function pruneCellKeyedRecordForGrid<T>(
  record: Record<string, T>,
  columns: number,
  rows: number,
): Record<string, T> {
  const out: Record<string, T> = {}
  for (const [k, v] of Object.entries(record)) {
    const parsed = parseGridCellId(k)
    if (!parsed) continue
    const { x, y } = parsed
    if (x < 0 || y < 0 || x >= columns || y >= rows) continue
    out[k] = v
  }
  return out
}
