import { describe, expect, it } from 'vitest'

import { resolveLocationPlacedObjectKindRuntimeDefaults } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.runtime'
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
    expect(o.combatCoverKind).toBe(expected.combatCoverKind)
    expect(o.isMovable).toBe(expected.isMovable)
  })

  it('includes interaction metadata for stairs (transition surface)', () => {
    const o = buildGridObjectFromAuthoredPlacedObject({
      id: 'go-stairs',
      cellId: 'c-1-1',
      authoredPlaceKindId: 'stairs',
    })
    expect(o.interaction).toEqual({ role: 'transition', transitionKind: 'stairs' })
    expect(o.blocksMovement).toBe(false)
    expect(o.blocksLineOfSight).toBe(false)
  })
})
