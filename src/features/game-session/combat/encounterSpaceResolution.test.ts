import { describe, expect, it } from 'vitest'

import type { LocationMapBase } from '@/shared/domain/locations/map/locationMap.types'

import {
  buildFallbackEncounterSpaceContainingCell,
  getFirstFloorLocationIdForBuilding,
  pickEncounterGridMap,
  pickEncounterGridMapForSpace,
  resolveSimulatorMapHostLocationId,
} from './encounterSpaceResolution'

function mapStub(partial: Partial<LocationMapBase> & Pick<LocationMapBase, 'id' | 'kind'>): LocationMapBase {
  return {
    locationId: 'loc',
    name: 'm',
    grid: { width: 4, height: 4, cellUnit: '5ft' },
    cellEntries: [],
    pathEntries: [],
    regionEntries: [],
    ...partial,
  } as LocationMapBase
}

describe('pickEncounterGridMap', () => {
  it('returns null when no encounter-grid maps', () => {
    expect(pickEncounterGridMap([mapStub({ id: 'a', kind: 'world-grid' })])).toBeNull()
  })

  it('prefers isDefault over first list order', () => {
    const a = mapStub({ id: 'a', kind: 'encounter-grid', isDefault: false })
    const b = mapStub({ id: 'b', kind: 'encounter-grid', isDefault: true })
    expect(pickEncounterGridMap([a, b])?.id).toBe('b')
  })

  it('falls back to first encounter-grid map', () => {
    const a = mapStub({ id: 'x', kind: 'encounter-grid' })
    const b = mapStub({ id: 'y', kind: 'encounter-grid' })
    expect(pickEncounterGridMap([a, b])?.id).toBe('x')
  })
})

describe('buildFallbackEncounterSpaceContainingCell', () => {
  it('expands grid to include large combat cell coordinates', () => {
    const space = buildFallbackEncounterSpaceContainingCell({
      id: 'fb',
      name: 'Dest',
      locationId: 'floor-1',
      combatCellId: 'c-12-14',
    })
    expect(space.width).toBe(13)
    expect(space.height).toBe(15)
    expect(space.cells.some((c) => c.id === 'c-12-14')).toBe(true)
  })
})

describe('pickEncounterGridMapForSpace', () => {
  it('prefers the encounter-grid map whose id matches the tactical space id', () => {
    const first = mapStub({ id: 'map-a', kind: 'encounter-grid', isDefault: true })
    const second = mapStub({ id: 'map-b', kind: 'encounter-grid', isDefault: false })
    expect(pickEncounterGridMapForSpace([first, second], 'map-b')?.id).toBe('map-b')
  })

  it('falls back to default/first when space id does not match any map', () => {
    const def = mapStub({ id: 'default-map', kind: 'encounter-grid', isDefault: true })
    const other = mapStub({ id: 'other', kind: 'encounter-grid', isDefault: false })
    expect(pickEncounterGridMapForSpace([other, def], 'unknown-space')?.id).toBe('default-map')
  })
})

describe('resolveSimulatorMapHostLocationId', () => {
  it('returns first floor of selected building', () => {
    const mapHost = resolveSimulatorMapHostLocationId({
      locations: [
        { id: 'b1', scale: 'building', name: 'B', parentId: 'c' } as never,
        { id: 'f1', scale: 'floor', name: 'F1', parentId: 'b1', sortOrder: 2 } as never,
        { id: 'f0', scale: 'floor', name: 'F0', parentId: 'b1', sortOrder: 1 } as never,
      ],
      buildingLocationIds: ['b1'],
    })
    expect(mapHost).toBe('f0')
  })

  it('returns null without a building', () => {
    expect(
      resolveSimulatorMapHostLocationId({
        locations: [{ id: 'b1', scale: 'building', name: 'B' } as never],
        buildingLocationIds: [],
      }),
    ).toBeNull()
  })
})

describe('getFirstFloorLocationIdForBuilding', () => {
  it('orders floors by sortOrder then name', () => {
    const id = getFirstFloorLocationIdForBuilding('b1', [
      { id: 'z', scale: 'floor', name: 'Z', parentId: 'b1', sortOrder: 1 } as never,
      { id: 'a', scale: 'floor', name: 'A', parentId: 'b1', sortOrder: 1 } as never,
    ])
    expect(id).toBe('a')
  })
})
