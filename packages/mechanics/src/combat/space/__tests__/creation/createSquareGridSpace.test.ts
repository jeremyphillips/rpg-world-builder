import { describe, expect, it } from 'vitest'
import { createSquareGridSpace } from '../../creation/createSquareGridSpace'

describe('createSquareGridSpace', () => {
  it('generates the correct number of cells', () => {
    const space = createSquareGridSpace({ id: 'g1', name: 'Test', columns: 4, rows: 3 })
    expect(space.cells).toHaveLength(12)
  })

  it('sets mode and scale for a 5-ft grid', () => {
    const space = createSquareGridSpace({ id: 'g1', name: 'Test', columns: 4, rows: 3 })
    expect(space.mode).toBe('square-grid')
    expect(space.scale).toEqual({ kind: 'grid', cellFeet: 5 })
  })

  it('stores width and height from columns and rows', () => {
    const space = createSquareGridSpace({ id: 'g1', name: 'Test', columns: 8, rows: 6 })
    expect(space.width).toBe(8)
    expect(space.height).toBe(6)
  })

  it('assigns deterministic cell IDs with x,y coordinates', () => {
    const space = createSquareGridSpace({ id: 'g1', name: 'Test', columns: 3, rows: 2 })
    const ids = space.cells.map((c) => c.id)
    expect(ids).toEqual([
      'c-0-0', 'c-1-0', 'c-2-0',
      'c-0-1', 'c-1-1', 'c-2-1',
    ])

    const topLeft = space.cells[0]
    expect(topLeft.x).toBe(0)
    expect(topLeft.y).toBe(0)

    const bottomRight = space.cells[5]
    expect(bottomRight.x).toBe(2)
    expect(bottomRight.y).toBe(1)
  })

  it('defaults all cells to open with standard movement properties', () => {
    const space = createSquareGridSpace({ id: 'g1', name: 'Test', columns: 2, rows: 2 })
    for (const cell of space.cells) {
      expect(cell.kind).toBe('open')
      expect(cell.movementCost).toBe(1)
      expect(cell.blocksMovement).toBe(false)
      expect(cell.blocksSight).toBe(false)
      expect(cell.blocksProjectiles).toBe(false)
    }
  })

  it('attaches optional locationId', () => {
    const space = createSquareGridSpace({ id: 'g1', name: 'Test', columns: 2, rows: 2, locationId: 'loc-1' })
    expect(space.locationId).toBe('loc-1')
  })
})
