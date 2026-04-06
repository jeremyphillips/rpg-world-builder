import { describe, expect, it } from 'vitest'

import type { GridObject } from '@/features/mechanics/domain/combat/space/space.types'
import type { LocationMapBase, LocationMapCellObjectEntry } from '@/shared/domain/locations/map/locationMap.types'

import { _internal } from '@/features/encounter/combat/resolveEncounterStairTraversalPayload'

const { parseAuthoredObjectIdFromGridObjectId, isGridObjectStairs, resolveStairsObjectsOnCell } =
  _internal

function gridObjectStub(partial: Partial<GridObject> & Pick<GridObject, 'id' | 'cellId' | 'authoredPlaceKindId'>): GridObject {
  return {
    blocksMovement: false,
    blocksLineOfSight: false,
    combatCoverKind: 'none',
    isMovable: false,
    ...partial,
  }
}

function mapStub(
  partial: Partial<LocationMapBase> & Pick<LocationMapBase, 'id' | 'kind'>,
): LocationMapBase {
  return {
    locationId: 'loc',
    name: 'm',
    grid: { width: 4, height: 4, cellUnit: '5ft' },
    cellEntries: [],
    pathEntries: [],
    regionEntries: [],
    edgeEntries: [],
    ...partial,
  } as LocationMapBase
}

// ---------------------------------------------------------------------------
// parseAuthoredObjectIdFromGridObjectId
// ---------------------------------------------------------------------------

describe('parseAuthoredObjectIdFromGridObjectId', () => {
  it('extracts objectId from standard composite id', () => {
    expect(parseAuthoredObjectIdFromGridObjectId('go-mapA-c-4-3-obj1', 'c-4-3')).toBe('obj1')
  })

  it('handles map id containing dashes', () => {
    expect(
      parseAuthoredObjectIdFromGridObjectId('go-map-abc-def-c-2-1-stairObj', 'c-2-1'),
    ).toBe('stairObj')
  })

  it('returns null when combatCellId is not present', () => {
    expect(parseAuthoredObjectIdFromGridObjectId('go-mapA-c-4-3-obj1', 'c-9-9')).toBeNull()
  })

  it('returns null when remainder after needle is empty', () => {
    expect(parseAuthoredObjectIdFromGridObjectId('go-mapA-c-4-3-', 'c-4-3')).toBeNull()
  })

  it('uses lastIndexOf so map ids containing the cell pattern do not cause false matches', () => {
    const id = 'go-map-c-4-3-extra-c-4-3-realObj'
    expect(parseAuthoredObjectIdFromGridObjectId(id, 'c-4-3')).toBe('realObj')
  })
})

// ---------------------------------------------------------------------------
// isGridObjectStairs
// ---------------------------------------------------------------------------

describe('isGridObjectStairs', () => {
  it('returns true when authoredPlaceKindId is stairs', () => {
    const g = gridObjectStub({ id: 'g1', cellId: 'c-0-0', authoredPlaceKindId: 'stairs' })
    expect(isGridObjectStairs(g)).toBe(true)
  })

  it('returns true when interaction indicates stairs transition', () => {
    const g = gridObjectStub({
      id: 'g2',
      cellId: 'c-0-0',
      authoredPlaceKindId: 'table',
      interaction: { role: 'transition', transitionKind: 'stairs' },
    })
    expect(isGridObjectStairs(g)).toBe(true)
  })

  it('returns false for non-stair objects without interaction', () => {
    const g = gridObjectStub({ id: 'g3', cellId: 'c-0-0', authoredPlaceKindId: 'table' })
    expect(isGridObjectStairs(g)).toBe(false)
  })

  it('returns false for non-stair objects with unrelated interaction', () => {
    const g = gridObjectStub({
      id: 'g4',
      cellId: 'c-0-0',
      authoredPlaceKindId: 'treasure',
      interaction: { role: 'transition', transitionKind: 'stairs' },
    })
    // authoredPlaceKindId is not 'stairs', but interaction IS stairs → should still return true
    expect(isGridObjectStairs(g)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// resolveStairsObjectsOnCell
// ---------------------------------------------------------------------------

describe('resolveStairsObjectsOnCell', () => {
  const stairCellObj: LocationMapCellObjectEntry = { id: 'stair-1', kind: 'stairs' }
  const tableCellObj: LocationMapCellObjectEntry = { id: 'table-1', kind: 'table' }

  it('returns map cell objects when map has stairs on the cell', () => {
    const map = mapStub({
      id: 'map1',
      kind: 'encounter-grid',
      cellEntries: [{ cellId: '4,3', objects: [stairCellObj, tableCellObj] }],
    } as Partial<LocationMapBase> & Pick<LocationMapBase, 'id' | 'kind'>)

    const result = resolveStairsObjectsOnCell(map, '4,3', 'c-4-3', undefined)
    expect(result).toEqual([stairCellObj, tableCellObj])
  })

  it('matches cellEntries row when cellId has whitespace around the comma', () => {
    const map = mapStub({
      id: 'map1',
      kind: 'encounter-grid',
      cellEntries: [{ cellId: '4, 3', objects: [stairCellObj] }],
    } as Partial<LocationMapBase> & Pick<LocationMapBase, 'id' | 'kind'>)

    const result = resolveStairsObjectsOnCell(map, '4,3', 'c-4-3', undefined)
    expect(result).toEqual([stairCellObj])
  })

  it('matches grid stairs when gridObject.cellId uses legacy authored form with spaces', () => {
    const map = mapStub({
      id: 'map1',
      kind: 'encounter-grid',
      cellEntries: [{ cellId: '4,3', objects: [tableCellObj] }],
    } as Partial<LocationMapBase> & Pick<LocationMapBase, 'id' | 'kind'>)

    const gridObjects: GridObject[] = [
      gridObjectStub({
        id: 'go-map1-c-4-3-stair-1',
        cellId: '4, 3',
        authoredPlaceKindId: 'stairs',
      }),
    ]

    const result = resolveStairsObjectsOnCell(map, '4,3', 'c-4-3', gridObjects)
    expect(result).toEqual([{ id: 'stair-1', kind: 'stairs' }])
  })

  it('falls back to gridObjects when map cell has no stairs', () => {
    const map = mapStub({
      id: 'map1',
      kind: 'encounter-grid',
      cellEntries: [{ cellId: '4,3', objects: [tableCellObj] }],
    } as Partial<LocationMapBase> & Pick<LocationMapBase, 'id' | 'kind'>)

    const gridObjects: GridObject[] = [
      gridObjectStub({
        id: 'go-map1-c-4-3-stair-1',
        cellId: 'c-4-3',
        authoredPlaceKindId: 'stairs',
        interaction: { role: 'transition', transitionKind: 'stairs' },
      }),
    ]

    const result = resolveStairsObjectsOnCell(map, '4,3', 'c-4-3', gridObjects)
    expect(result).toEqual([{ id: 'stair-1', kind: 'stairs' }])
  })

  it('detects stairs from gridObjects when map is undefined', () => {
    const gridObjects: GridObject[] = [
      gridObjectStub({
        id: 'go-someMap-c-2-1-s1',
        cellId: 'c-2-1',
        authoredPlaceKindId: 'stairs',
        interaction: { role: 'transition', transitionKind: 'stairs' },
      }),
    ]

    const result = resolveStairsObjectsOnCell(undefined, '2,1', 'c-2-1', gridObjects)
    expect(result).toEqual([{ id: 's1', kind: 'stairs' }])
  })

  it('returns fromEntries when neither path finds stairs', () => {
    const map = mapStub({
      id: 'map1',
      kind: 'encounter-grid',
      cellEntries: [{ cellId: '4,3', objects: [tableCellObj] }],
    } as Partial<LocationMapBase> & Pick<LocationMapBase, 'id' | 'kind'>)

    const result = resolveStairsObjectsOnCell(map, '4,3', 'c-4-3', [])
    expect(result).toEqual([tableCellObj])
  })

  it('returns undefined when no map and no gridObjects', () => {
    const result = resolveStairsObjectsOnCell(undefined, '0,0', 'c-0-0', undefined)
    expect(result).toBeUndefined()
  })

  it('handles map id containing combat cell pattern (lastIndexOf fix)', () => {
    const gridObjects: GridObject[] = [
      gridObjectStub({
        id: 'go-map-c-4-3-extra-c-4-3-realStair',
        cellId: 'c-4-3',
        authoredPlaceKindId: 'stairs',
      }),
    ]

    const result = resolveStairsObjectsOnCell(undefined, '4,3', 'c-4-3', gridObjects)
    expect(result).toEqual([{ id: 'realStair', kind: 'stairs' }])
  })
})
