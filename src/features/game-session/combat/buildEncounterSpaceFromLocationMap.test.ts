import { describe, expect, it } from 'vitest'

import { resolveLocationPlacedObjectKindRuntimeDefaults } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.runtime'

import { authorCellIdToCombatCellId, buildEncounterSpaceFromLocationMap } from './buildEncounterSpaceFromLocationMap'

describe('authorCellIdToCombatCellId', () => {
  it('maps x,y ids to combat c-x-y', () => {
    expect(authorCellIdToCombatCellId('0,0')).toBe('c-0-0')
    expect(authorCellIdToCombatCellId('3,2')).toBe('c-3-2')
    expect(authorCellIdToCombatCellId('11, 0')).toBe('c-11-0')
  })
})

describe('buildEncounterSpaceFromLocationMap', () => {
  it('accepts 25ft cell unit and uses 5 ft tactical scale only', () => {
    const space = buildEncounterSpaceFromLocationMap({
      mapHostLocationId: 'floor-loc-1',
      map: {
        id: 'map-25',
        locationId: 'loc',
        name: 'Wide',
        kind: 'encounter-grid',
        grid: { width: 2, height: 2, cellUnit: '25ft' },
        layout: {},
        edgeEntries: [],
        cellEntries: [],
        pathEntries: [],
        regionEntries: [],
      },
    })
    expect(space.scale).toEqual({ kind: 'grid', cellFeet: 5 })
  })

  it('throws when grid.cellUnit is not supported for encounter conversion', () => {
    expect(() =>
      buildEncounterSpaceFromLocationMap({
        mapHostLocationId: 'floor-loc-1',
        map: {
          id: 'map-bad',
          locationId: 'loc',
          name: 'X',
          kind: 'encounter-grid',
          grid: { width: 2, height: 2, cellUnit: '100ft' },
          layout: {},
          edgeEntries: [],
          cellEntries: [],
          pathEntries: [],
          regionEntries: [],
        },
      }),
    ).toThrow(/not supported/)
  })

  it('applies excluded cells as blocking and maps edge walls', () => {
    const space = buildEncounterSpaceFromLocationMap({
      mapHostLocationId: 'floor-loc-1',
      map: {
        id: 'map-1',
        locationId: 'loc',
        name: 'Hall',
        kind: 'encounter-grid',
        grid: { width: 2, height: 2, cellUnit: '5ft' },
        layout: { excludedCellIds: ['1,1'] },
        edgeEntries: [{ edgeId: 'between:0,0|1,0', kind: 'wall' }],
        cellEntries: [],
        pathEntries: [],
        regionEntries: [],
      },
    })

    expect(space.locationId).toBe('floor-loc-1')
    expect(space.cells.find((c) => c.id === 'c-1-1')?.kind).toBe('blocking')
    expect(space.cells.find((c) => c.id === 'c-0-0')?.kind).toBe('open')
    expect(space.edges?.length).toBe(1)
    expect(space.edges?.[0]?.fromCellId).toBe('c-0-0')
    expect(space.edges?.[0]?.toCellId).toBe('c-1-0')
    expect(space.authoringPresentation?.edgeEntries).toHaveLength(1)
    expect(space.authoringPresentation?.edgeEntries[0]?.edgeId).toBe('between:0,0|1,0')
  })

  it('hydrates authored cell objects into gridObjects and applies transitional cell blocking when blocksMovement', () => {
    const space = buildEncounterSpaceFromLocationMap({
      mapHostLocationId: 'floor-loc-1',
      map: {
        id: 'map-obj',
        locationId: 'loc',
        name: 'Room',
        kind: 'encounter-grid',
        grid: { width: 3, height: 3, cellUnit: '5ft' },
        layout: {},
        edgeEntries: [],
        cellEntries: [
          {
            cellId: '0,0',
            objects: [{ id: 'a1', kind: 'treasure' }],
          },
          {
            cellId: '1,0',
            objects: [{ id: 't1', kind: 'table', authoredPlaceKindId: 'table' }],
          },
        ],
        pathEntries: [],
        regionEntries: [],
      },
    })

    expect(space.gridObjects?.length).toBe(2)
    const treasure = space.gridObjects?.find((o) => o.authoredPlaceKindId === 'treasure')
    const table = space.gridObjects?.find((o) => o.authoredPlaceKindId === 'table')
    expect(treasure?.cellId).toBe('c-0-0')
    expect(table?.cellId).toBe('c-1-0')

    const treasureRt = resolveLocationPlacedObjectKindRuntimeDefaults('treasure')
    expect(space.cells.find((c) => c.id === 'c-0-0')?.kind).toBe(
      treasureRt.blocksMovement ? 'blocking' : 'open',
    )

    const tableRt = resolveLocationPlacedObjectKindRuntimeDefaults('table')
    expect(space.cells.find((c) => c.id === 'c-1-0')?.kind).toBe(
      tableRt.blocksMovement ? 'blocking' : 'open',
    )

    expect(space.authoringPresentation?.authoredObjectRenderItems).toHaveLength(2)
    expect(space.authoringPresentation?.authoredObjectRenderItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'a1', authorCellId: '0,0', combatCellId: 'c-0-0', kind: 'treasure' }),
        expect.objectContaining({ id: 't1', authorCellId: '1,0', combatCellId: 'c-1-0', kind: 'table' }),
      ]),
    )
  })

  it('door edge defaults to blocking movement and sight (closed)', () => {
    const space = buildEncounterSpaceFromLocationMap({
      mapHostLocationId: 'floor-loc-1',
      map: {
        id: 'map-door',
        locationId: 'loc',
        name: 'Hall',
        kind: 'encounter-grid',
        grid: { width: 2, height: 2, cellUnit: '5ft' },
        layout: {},
        edgeEntries: [
          {
            edgeId: 'between:0,0|1,0',
            kind: 'door',
            authoredPlaceKindId: 'door',
            variantId: 'single_wood',
          },
        ],
        cellEntries: [],
        pathEntries: [],
        regionEntries: [],
      },
    })

    const doorEdge = space.edges?.find((e) => e.fromCellId === 'c-0-0' && e.toCellId === 'c-1-0')
    expect(doorEdge?.blocksMovement).toBe(true)
    expect(doorEdge?.blocksSight).toBe(true)
    expect(doorEdge?.mapEdgeId).toBe('between:0,0|1,0')
    expect(doorEdge?.doorState?.openState).toBe('closed')
  })

  it('open door edge does not block movement or sight', () => {
    const space = buildEncounterSpaceFromLocationMap({
      mapHostLocationId: 'floor-loc-1',
      map: {
        id: 'map-door-open',
        locationId: 'loc',
        name: 'Hall',
        kind: 'encounter-grid',
        grid: { width: 2, height: 2, cellUnit: '5ft' },
        layout: {},
        edgeEntries: [
          {
            edgeId: 'between:0,0|1,0',
            kind: 'door',
            authoredPlaceKindId: 'door',
            variantId: 'single_wood',
            doorState: { openState: 'open', lockState: 'locked' },
          },
        ],
        cellEntries: [],
        pathEntries: [],
        regionEntries: [],
      },
    })

    const doorEdge = space.edges?.find((e) => e.fromCellId === 'c-0-0' && e.toCellId === 'c-1-0')
    expect(doorEdge?.blocksMovement).toBe(false)
    expect(doorEdge?.blocksSight).toBe(false)
    expect(doorEdge?.mapEdgeId).toBe('between:0,0|1,0')
    expect(doorEdge?.doorState?.openState).toBe('open')
    expect(doorEdge?.doorState?.lockState).toBe('locked')
  })
})
