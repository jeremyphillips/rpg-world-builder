import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '../../creation/createSquareGridSpace'
import { generateInitialPlacements } from '../../placement/generateInitialPlacements'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter/state/types/combatant.types'
import { placeRandomGridObstacle } from '../../placement/placeRandomGridObstacle'

function makeCombatant(id: string, side: 'party' | 'enemies'): CombatantInstance {
  return {
    instanceId: id,
    side,
    source: { kind: 'monster', label: id, monsterId: 'm' },
    stats: {
      armorClass: 10,
      hitPoints: { current: 10, max: 10 },
      initiativeModifier: 0,
      dexterityScore: 10,
      speeds: { ground: 30 },
    },
    conditions: [],
    turnResources: { movementRemaining: 30, actionAvailable: true, bonusActionAvailable: true },
  } as unknown as CombatantInstance
}

describe('placeRandomGridObstacle', () => {
  it('adds one obstacle and marks cell blocking for outdoors (tree)', () => {
    const base = createSquareGridSpace({ id: 'g', name: 'G', columns: 4, rows: 4 })
    const rng = () => 0.99
    const next = placeRandomGridObstacle(base, 'outdoors', rng)

    expect(next.obstacles?.length).toBe(1)
    expect(next.obstacles?.[0]?.kind).toBe('tree')
    const cellId = next.obstacles![0]!.cellId
    const cell = next.cells.find((c) => c.id === cellId)
    expect(cell?.kind).toBe('blocking')
    expect(cell?.blocksMovement).toBe(true)
    expect(cell?.blocksSight).toBe(true)
  })

  it('uses pillar for indoors and mixed/other', () => {
    const base = createSquareGridSpace({ id: 'g', name: 'G', columns: 3, rows: 3 })
    const rng = () => 0
    expect(placeRandomGridObstacle(base, 'indoors', rng).obstacles?.[0]?.kind).toBe('pillar')
    expect(placeRandomGridObstacle(base, 'mixed', rng).obstacles?.[0]?.kind).toBe('pillar')
    expect(placeRandomGridObstacle(base, 'other', rng).obstacles?.[0]?.kind).toBe('pillar')
  })

  it('does not place initial combatants on the obstacle cell', () => {
    const base = createSquareGridSpace({ id: 'g', name: 'G', columns: 8, rows: 6 })
    const rng = () => 0.2
    const space = placeRandomGridObstacle(base, 'outdoors', rng)
    const obstacleCellId = space.obstacles![0]!.cellId

    const a = makeCombatant('ally-1', 'party')
    const e = makeCombatant('foe-1', 'enemies')
    const placements = generateInitialPlacements(space, [a, e])

    expect(placements.every((p) => p.cellId !== obstacleCellId)).toBe(true)
  })
})
