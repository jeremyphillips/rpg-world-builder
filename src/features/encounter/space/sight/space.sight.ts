import { getCellAt, getCellById } from '../space.helpers'
import type { EncounterSpace } from '../space.types'

/**
 * Single resolver for “does this cell block line of sight?” — use this everywhere (targeting, UI, future weapons).
 * Opaque = `blocksSight === true`. Missing/undefined is treated as not blocking.
 */
export function cellBlocksSight(space: EncounterSpace, cellId: string): boolean {
  const cell = getCellById(space, cellId)
  if (!cell) return true
  return cell.blocksSight === true
}

/**
 * Amanatides & Woo–style grid traversal: every **unit square** cell the segment between
 * `(x0,y0)` and `(x1,y1)` **cell centers** intersects. Cell indices use the same integer
 * coordinates as {@link EncounterCell.x} / `y` (centers at `(x+0.5, y+0.5)`).
 *
 * Tie-breaking on simultaneous boundary crossings steps diagonally so corner cases include
 * both grid steps (standard DDA behavior).
 */
export function gridCellsAlongSupercoverLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Array<{ x: number; y: number }> {
  if (x0 === x1 && y0 === y1) return [{ x: x0, y: y0 }]

  const ox = x0 + 0.5
  const oy = y0 + 0.5
  const dx = x1 - x0
  const dy = y1 - y0
  const dist = Math.hypot(dx, dy)
  const dirX = dx / dist
  const dirY = dy / dist

  const stepX = dirX > 0 ? 1 : dirX < 0 ? -1 : 0
  const stepY = dirY > 0 ? 1 : dirY < 0 ? -1 : 0

  const tDeltaX = stepX !== 0 ? 1 / Math.abs(dirX) : Infinity
  const tDeltaY = stepY !== 0 ? 1 / Math.abs(dirY) : Infinity

  let x = Math.floor(ox)
  let y = Math.floor(oy)

  let tMaxX: number
  if (dirX > 0) tMaxX = (x + 1 - ox) / dirX
  else if (dirX < 0) tMaxX = (x - ox) / dirX
  else tMaxX = Infinity

  let tMaxY: number
  if (dirY > 0) tMaxY = (y + 1 - oy) / dirY
  else if (dirY < 0) tMaxY = (y - oy) / dirY
  else tMaxY = Infinity

  const cells: Array<{ x: number; y: number }> = []
  const seen = new Set<string>()
  const add = (cx: number, cy: number) => {
    const k = `${cx},${cy}`
    if (!seen.has(k)) {
      seen.add(k)
      cells.push({ x: cx, y: cy })
    }
  }

  add(x, y)
  let guard = 0
  while ((x !== x1 || y !== y1) && guard++ < 10000) {
    if (tMaxX < tMaxY) {
      x += stepX
      tMaxX += tDeltaX
    } else if (tMaxX > tMaxY) {
      y += stepY
      tMaxY += tDeltaY
    } else {
      x += stepX
      y += stepY
      tMaxX += tDeltaX
      tMaxY += tDeltaY
    }
    add(x, y)
  }

  return cells
}

/** Ordered cell ids from `fromCellId` to `toCellId` along the supercover line (for tests / debug). */
export function traceLineOfSightCells(
  space: EncounterSpace,
  fromCellId: string,
  toCellId: string,
): string[] {
  const from = getCellById(space, fromCellId)
  const to = getCellById(space, toCellId)
  if (!from || !to) return []

  const coords = gridCellsAlongSupercoverLine(from.x, from.y, to.x, to.y)
  const ids: string[] = []
  for (const { x, y } of coords) {
    const cell = getCellAt(space, x, y)
    if (cell) ids.push(cell.id)
  }
  return ids
}

/**
 * Binary line of sight on the square grid: clear iff no **intermediate** cell on the supercover
 * segment has `blocksSight`. Source and target cells do not block their own endpoints.
 */
export function hasLineOfSight(
  space: EncounterSpace,
  fromCellId: string,
  toCellId: string,
): boolean {
  const from = getCellById(space, fromCellId)
  const to = getCellById(space, toCellId)
  if (!from || !to) return false
  if (fromCellId === toCellId) return true

  const path = gridCellsAlongSupercoverLine(from.x, from.y, to.x, to.y)
  if (path.length < 2) return true

  for (let i = 1; i < path.length - 1; i++) {
    const cell = getCellAt(space, path[i].x, path[i].y)
    if (!cell) return false
    if (cellBlocksSight(space, cell.id)) return false
  }
  return true
}
