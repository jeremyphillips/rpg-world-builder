import { describe, expect, it } from 'vitest'

import { resolveLocationPlacedObjectKindRuntimeDefaults } from '@/features/content/locations/domain/mapContent/locationPlacedObject.runtime'
import { buildGridObjectFromAuthoredPlacedObject } from '../../gridObject/gridObject.fromAuthored'

describe('buildGridObjectFromAuthoredPlacedObject', () => {
  it('sets authoredPlaceKindId and matches resolver output', () => {
    const o = buildGridObjectFromAuthoredPlacedObject({
      id: 'go-1',
      cellId: 'c-2-3',
      authoredPlaceKindId: 'table',
    })
    const expected = resolveLocationPlacedObjectKindRuntimeDefaults('table')
    expect(o.authoredPlaceKindId).toBe('table')
    expect(o.blocksMovement).toBe(expected.blocksMovement)
    expect(o.blocksLineOfSight).toBe(expected.blocksLineOfSight)
    expect(o.coverKind).toBe(expected.coverKind)
    expect(o.isMovable).toBe(expected.isMovable)
  })
})
