import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '../../creation/createSquareGridSpace'
import { hasLineOfSight } from '../../sight/space.sight'
import {
  cellsReachableWithinMovementBudget,
  minMovementCostFtToCell,
  movementStepLegal,
} from '../../spatial/movementReachability'

describe('movementReachability', () => {
  it('finds a route around a blocking cell when a straight supercover line would be blocked', () => {
    const space = createSquareGridSpace({ id: 'g', name: 'G', columns: 3, rows: 3 })
    const mid = space.cells.find((c) => c.x === 1 && c.y === 0)!
    const withBlock = {
      ...space,
      cells: space.cells.map((c) =>
        c.id === mid.id ? { ...c, kind: 'blocking' as const, blocksSight: true, blocksMovement: true } : c,
      ),
    }
    // LoS still uses the ray through the middle cell — blocked.
    expect(hasLineOfSight(withBlock, 'c-0-0', 'c-2-0')).toBe(false)
    // Movement detours (e.g. c-0-0 → c-1-1 → c-2-0) — 2 diagonals × 5ft; not the blocked straight ray.
    expect(minMovementCostFtToCell(withBlock, 'c-0-0', 'c-2-0', [], 'mover')).toBe(10)
    expect(cellsReachableWithinMovementBudget(withBlock, 'c-0-0', 10, [], 'mover').has('c-2-0')).toBe(
      true,
    )
  })

  it('movementStepLegal applies diagonal corner rule via segmentMovementBlocked', () => {
    const space = createSquareGridSpace({ id: 'g', name: 'G', columns: 4, rows: 4 })
    const withEdge = {
      ...space,
      edges: [{ fromCellId: 'c-0-0', toCellId: 'c-1-0', blocksMovement: true }],
    }
    expect(movementStepLegal(withEdge, 'c-0-0', 'c-1-1')).toBe(false)
    expect(movementStepLegal(withEdge, 'c-0-0', 'c-0-1')).toBe(true)
  })

  it('is false when no path exists (fully enclosed)', () => {
    const space = createSquareGridSpace({ id: 'g', name: 'G', columns: 3, rows: 3 })
    const blocked = space.cells.map((c) =>
      c.id === 'c-1-1'
        ? c
        : { ...c, kind: 'blocking' as const, blocksMovement: true },
    )
    const walled = { ...space, cells: blocked }
    expect(minMovementCostFtToCell(walled, 'c-1-1', 'c-0-0', [], 'm')).toBeUndefined()
  })
})
