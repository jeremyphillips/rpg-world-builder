import { describe, expect, it } from 'vitest'
import { createSquareGridSpace } from '../creation/createSquareGridSpace'
import {
  getCellAt,
  getCellById,
  getCellForCombatant,
  getOccupant,
  gridDistanceFt,
  isCellOccupied,
  isWithinRange,
} from '../space.helpers'
import type { CombatantPosition } from '../space.types'

const space = createSquareGridSpace({ id: 'g1', name: 'Test', columns: 8, rows: 6 })

describe('getCellAt', () => {
  it('returns the cell at the given coordinates', () => {
    const cell = getCellAt(space, 3, 2)
    expect(cell).toBeDefined()
    expect(cell!.id).toBe('c-3-2')
  })

  it('returns undefined for out-of-bounds coordinates', () => {
    expect(getCellAt(space, 10, 10)).toBeUndefined()
  })
})

describe('getCellById', () => {
  it('finds a cell by its id', () => {
    const cell = getCellById(space, 'c-0-0')
    expect(cell).toBeDefined()
    expect(cell!.x).toBe(0)
    expect(cell!.y).toBe(0)
  })

  it('returns undefined for a missing id', () => {
    expect(getCellById(space, 'c-99-99')).toBeUndefined()
  })
})

describe('occupancy helpers', () => {
  const placements: CombatantPosition[] = [
    { combatantId: 'a1', cellId: 'c-0-0' },
    { combatantId: 'e1', cellId: 'c-7-5' },
  ]

  it('getOccupant returns the combatant at a cell', () => {
    expect(getOccupant(placements, 'c-0-0')).toBe('a1')
    expect(getOccupant(placements, 'c-1-0')).toBeUndefined()
  })

  it('getCellForCombatant returns the cell a combatant occupies', () => {
    expect(getCellForCombatant(placements, 'a1')).toBe('c-0-0')
    expect(getCellForCombatant(placements, 'missing')).toBeUndefined()
  })

  it('isCellOccupied checks if a cell has an occupant', () => {
    expect(isCellOccupied(placements, 'c-0-0')).toBe(true)
    expect(isCellOccupied(placements, 'c-4-3')).toBe(false)
  })
})

describe('gridDistanceFt', () => {
  it('returns 0 for the same cell', () => {
    expect(gridDistanceFt(space, 'c-3-3', 'c-3-3')).toBe(0)
  })

  it('computes orthogonal distance', () => {
    expect(gridDistanceFt(space, 'c-0-0', 'c-3-0')).toBe(15)
    expect(gridDistanceFt(space, 'c-0-0', 'c-0-4')).toBe(20)
  })

  it('computes diagonal distance using Chebyshev metric', () => {
    expect(gridDistanceFt(space, 'c-0-0', 'c-2-2')).toBe(10)
    expect(gridDistanceFt(space, 'c-1-1', 'c-4-5')).toBe(20)
  })

  it('returns undefined for a missing cell', () => {
    expect(gridDistanceFt(space, 'c-0-0', 'c-99-99')).toBeUndefined()
  })

  it('uses 5 ft per cell for grid distance (tactical scale is 5 ft only)', () => {
    const bigGrid = createSquareGridSpace({ id: 'g2', name: 'Big', columns: 4, rows: 4 })
    expect(gridDistanceFt(bigGrid, 'c-0-0', 'c-2-0')).toBe(10)
  })
})

describe('isWithinRange', () => {
  const placements: CombatantPosition[] = [
    { combatantId: 'a1', cellId: 'c-0-0' },
    { combatantId: 'e1', cellId: 'c-1-1' },
    { combatantId: 'e2', cellId: 'c-6-5' },
  ]

  it('returns true when target is within range', () => {
    expect(isWithinRange(space, placements, 'a1', 'e1', 5)).toBe(true)
    expect(isWithinRange(space, placements, 'a1', 'e1', 10)).toBe(true)
  })

  it('returns false when target is out of range', () => {
    expect(isWithinRange(space, placements, 'a1', 'e2', 5)).toBe(false)
    expect(isWithinRange(space, placements, 'a1', 'e2', 25)).toBe(false)
  })

  it('returns true when a combatant is not placed (backwards-compatible)', () => {
    expect(isWithinRange(space, placements, 'a1', 'unplaced', 5)).toBe(true)
  })
})
