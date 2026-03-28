import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '../../creation/createSquareGridSpace'
import {
  cellBlocksSight,
  gridCellsAlongSupercoverLine,
  hasLineOfSight,
  traceLineOfSightCells,
} from '../../sight/space.sight'

describe('gridCellsAlongSupercoverLine', () => {
  it('returns a single cell when endpoints coincide', () => {
    expect(gridCellsAlongSupercoverLine(0, 0, 0, 0)).toEqual([{ x: 0, y: 0 }])
  })

  it('includes all cells on a horizontal segment', () => {
    expect(gridCellsAlongSupercoverLine(0, 0, 2, 0)).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ])
  })

  it('includes diagonal intermediates', () => {
    const line = gridCellsAlongSupercoverLine(0, 0, 2, 2)
    expect(line).toContainEqual({ x: 1, y: 1 })
    expect(line[0]).toEqual({ x: 0, y: 0 })
    expect(line[line.length - 1]).toEqual({ x: 2, y: 2 })
  })
})

describe('hasLineOfSight', () => {
  it('is true for adjacent cells with no blocker', () => {
    const space = createSquareGridSpace({ id: 'g', name: 'G', columns: 4, rows: 4 })
    expect(hasLineOfSight(space, 'c-0-0', 'c-1-0')).toBe(true)
  })

  it('is true when source equals target', () => {
    const space = createSquareGridSpace({ id: 'g', name: 'G', columns: 4, rows: 4 })
    expect(hasLineOfSight(space, 'c-1-1', 'c-1-1')).toBe(true)
  })

  it('is false when an intermediate cell blocks sight', () => {
    const space = createSquareGridSpace({ id: 'g', name: 'G', columns: 4, rows: 4 })
    const mid = space.cells.find((c) => c.x === 1 && c.y === 0)!
    const cells = space.cells.map((c) =>
      c.id === mid.id ? { ...c, kind: 'blocking' as const, blocksSight: true } : c,
    )
    const withBlock: typeof space = { ...space, cells }
    expect(cellBlocksSight(withBlock, 'c-1-0')).toBe(true)
    expect(hasLineOfSight(withBlock, 'c-0-0', 'c-2-0')).toBe(false)
  })

  it('ignores blocking on source and target cells only', () => {
    const space = createSquareGridSpace({ id: 'g', name: 'G', columns: 4, rows: 4 })
    const a = space.cells.find((c) => c.x === 0 && c.y === 0)!
    const b = space.cells.find((c) => c.x === 2 && c.y === 0)!
    const cells = space.cells.map((c) => {
      if (c.id === a.id || c.id === b.id) {
        return { ...c, kind: 'blocking' as const, blocksSight: true }
      }
      return c
    })
    const withEndsBlocked: typeof space = { ...space, cells }
    expect(hasLineOfSight(withEndsBlocked, 'c-0-0', 'c-2-0')).toBe(true)
  })

  it('traceLineOfSightCells matches cell ids on the grid', () => {
    const space = createSquareGridSpace({ id: 'g', name: 'G', columns: 3, rows: 3 })
    expect(traceLineOfSightCells(space, 'c-0-0', 'c-2-0')).toEqual(['c-0-0', 'c-1-0', 'c-2-0'])
  })
})
