import { describe, expect, it } from 'vitest'

import type { EncounterState } from '@/features/mechanics/domain/encounter/state/types'
import { applyGridSpawnReplacementFromTarget } from '../applyGridSpawnReplacement'
import { createSquareGridSpace } from '../createSquareGridSpace'
import { getOccupant } from '../space.helpers'

function minimalState(
  placements: EncounterState['placements'],
  space: EncounterState['space'],
): EncounterState {
  return {
    combatantsById: {},
    partyCombatantIds: [],
    enemyCombatantIds: [],
    initiative: [],
    initiativeOrder: [],
    activeCombatantId: null,
    turnIndex: 0,
    roundNumber: 1,
    started: true,
    log: [],
    space,
    placements,
  }
}

describe('applyGridSpawnReplacementFromTarget', () => {
  it('moves grid occupancy from source to first spawn; source no longer occupies', () => {
    const space = createSquareGridSpace({ id: 'g', name: 'g', columns: 5, rows: 5 })
    const placements = [
      { combatantId: 'source', cellId: 'c-2-2' },
      { combatantId: 'other', cellId: 'c-0-0' },
    ]
    const state = minimalState(placements, space)

    const next = applyGridSpawnReplacementFromTarget(state, 'source', ['spawn-a'])

    expect(next.placements!.some((p) => p.combatantId === 'source')).toBe(false)
    expect(getOccupant(next.placements!, 'c-2-2')).toBe('spawn-a')
    expect(getOccupant(next.placements!, 'c-0-0')).toBe('other')
  })

  it('places a second spawn on a nearest empty cell, not stacked on anchor', () => {
    const space = createSquareGridSpace({ id: 'g', name: 'g', columns: 5, rows: 5 })
    const placements = [{ combatantId: 'source', cellId: 'c-2-2' }]
    const state = minimalState(placements, space)

    const next = applyGridSpawnReplacementFromTarget(state, 'source', ['spawn-a', 'spawn-b'])

    const byId = Object.fromEntries(next.placements!.map((p) => [p.combatantId, p.cellId]))
    expect(byId['spawn-a']).toBe('c-2-2')
    expect(byId['spawn-b']).toBeDefined()
    expect(byId['spawn-b']).not.toBe('c-2-2')

    const cells = new Set(next.placements!.map((p) => p.cellId))
    expect(cells.size).toBe(next.placements!.length)
  })

  it('honors inheritGridCellFromTarget-style replacement with generic ids (no zombie coupling)', () => {
    const space = createSquareGridSpace({ id: 'g', name: 'g', columns: 3, rows: 3 })
    const state = minimalState([{ combatantId: 'alpha', cellId: 'c-1-1' }], space)
    const next = applyGridSpawnReplacementFromTarget(state, 'alpha', ['beta'])
    expect(getOccupant(next.placements!, 'c-1-1')).toBe('beta')
  })
})
