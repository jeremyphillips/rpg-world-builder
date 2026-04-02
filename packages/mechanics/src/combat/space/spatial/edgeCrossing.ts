import type { EncounterEdge, EncounterSpace } from '../space.types'
import { getCellAt, getCellById } from '../space.helpers'

/**
 * Undirected lookup: returns the edge record between two adjacent cells, if any.
 * Missing edge means an open boundary (not blocking) for segment checks.
 */
export function findEncounterEdgeBetween(
  space: EncounterSpace,
  cellIdA: string,
  cellIdB: string,
): EncounterEdge | undefined {
  return (space.edges ?? []).find(
    (e) =>
      (e.fromCellId === cellIdA && e.toCellId === cellIdB) ||
      (e.fromCellId === cellIdB && e.toCellId === cellIdA),
  )
}

function edgeBlocksSight(e: EncounterEdge | undefined): boolean {
  return e?.blocksSight === true
}

function edgeBlocksMovement(e: EncounterEdge | undefined): boolean {
  return e?.blocksMovement === true
}

/**
 * True when line-of-sight along one grid step (orthogonal or diagonal) is blocked by edges.
 * Diagonal steps use the strict corner rule: blocked if either orthogonal edge from the source
 * toward the diagonal blocks sight.
 */
export function segmentSightBlocked(
  space: EncounterSpace,
  fromCellId: string,
  toCellId: string,
): boolean {
  const a = getCellById(space, fromCellId)
  const b = getCellById(space, toCellId)
  if (!a || !b) return true
  const dx = Math.abs(a.x - b.x)
  const dy = Math.abs(a.y - b.y)
  if (dx === 0 && dy === 0) return false
  if (dx > 1 || dy > 1 || dx + dy > 2) return true

  if (dx + dy === 1) {
    const e = findEncounterEdgeBetween(space, fromCellId, toCellId)
    return edgeBlocksSight(e)
  }

  const orth1 = getCellAt(space, b.x, a.y)
  const orth2 = getCellAt(space, a.x, b.y)
  if (!orth1 || !orth2) return true
  return (
    segmentSightBlocked(space, fromCellId, orth1.id) ||
    segmentSightBlocked(space, fromCellId, orth2.id)
  )
}

/**
 * True when movement along one grid step is blocked by edges (parallel policy to {@link segmentSightBlocked}).
 */
export function segmentMovementBlocked(
  space: EncounterSpace,
  fromCellId: string,
  toCellId: string,
): boolean {
  const a = getCellById(space, fromCellId)
  const b = getCellById(space, toCellId)
  if (!a || !b) return true
  const dx = Math.abs(a.x - b.x)
  const dy = Math.abs(a.y - b.y)
  if (dx === 0 && dy === 0) return false
  if (dx > 1 || dy > 1 || dx + dy > 2) return true

  if (dx + dy === 1) {
    const e = findEncounterEdgeBetween(space, fromCellId, toCellId)
    return edgeBlocksMovement(e)
  }

  const orth1 = getCellAt(space, b.x, a.y)
  const orth2 = getCellAt(space, a.x, b.y)
  if (!orth1 || !orth2) return true
  return (
    segmentMovementBlocked(space, fromCellId, orth1.id) ||
    segmentMovementBlocked(space, fromCellId, orth2.id)
  )
}
