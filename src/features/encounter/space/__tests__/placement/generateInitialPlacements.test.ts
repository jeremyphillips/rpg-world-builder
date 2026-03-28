import { describe, expect, it } from 'vitest'
import { createSquareGridSpace } from '../../creation/createSquareGridSpace'
import { generateInitialPlacements } from '../../placement/generateInitialPlacements'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter/state'

function pc(id: string): CombatantInstance {
  return {
    instanceId: id,
    side: 'party',
    source: { kind: 'pc', sourceId: id, label: `PC ${id}` },
    stats: {
      armorClass: 14,
      maxHitPoints: 20,
      currentHitPoints: 20,
      initiativeModifier: 0,
      dexterityScore: 14,
    },
    attacks: [],
    actions: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
  }
}

function enemy(id: string): CombatantInstance {
  return {
    ...pc(id),
    instanceId: id,
    side: 'enemies',
    source: { kind: 'monster', sourceId: id, label: `Enemy ${id}` },
  }
}

describe('generateInitialPlacements', () => {
  const space = createSquareGridSpace({ id: 'g1', name: 'Test', columns: 8, rows: 6 })

  it('places all combatants', () => {
    const combatants = [pc('a1'), pc('a2'), enemy('e1'), enemy('e2')]
    const placements = generateInitialPlacements(space, combatants)
    expect(placements).toHaveLength(4)
  })

  it('places allies on the left and enemies on the right by default', () => {
    const combatants = [pc('a1'), enemy('e1')]
    const placements = generateInitialPlacements(space, combatants)

    const allyCell = placements.find((p) => p.combatantId === 'a1')!.cellId
    const enemyCell = placements.find((p) => p.combatantId === 'e1')!.cellId

    const allyX = Number(allyCell.split('-')[1])
    const enemyX = Number(enemyCell.split('-')[1])

    expect(allyX).toBeLessThanOrEqual(1)
    expect(enemyX).toBeGreaterThanOrEqual(6)
  })

  it('respects custom side options', () => {
    const combatants = [pc('a1'), enemy('e1')]
    const placements = generateInitialPlacements(space, combatants, {
      allySide: 'top',
      enemySide: 'bottom',
    })

    const allyCell = placements.find((p) => p.combatantId === 'a1')!.cellId
    const enemyCell = placements.find((p) => p.combatantId === 'e1')!.cellId

    const allyY = Number(allyCell.split('-')[2])
    const enemyY = Number(enemyCell.split('-')[2])

    expect(allyY).toBeLessThanOrEqual(1)
    expect(enemyY).toBeGreaterThanOrEqual(4)
  })

  it('does not place two combatants on the same cell', () => {
    const combatants = [
      pc('a1'), pc('a2'), pc('a3'), pc('a4'),
      enemy('e1'), enemy('e2'), enemy('e3'), enemy('e4'),
    ]
    const placements = generateInitialPlacements(space, combatants)
    const cellIds = placements.map((p) => p.cellId)
    expect(new Set(cellIds).size).toBe(cellIds.length)
  })

  it('spreads top/bottom placements across full grid width', () => {
    const allies = Array.from({ length: 6 }, (_, i) => pc(`a${i}`))
    const enemies = Array.from({ length: 6 }, (_, i) => enemy(`e${i}`))

    const placements = generateInitialPlacements(space, [...allies, ...enemies], {
      allySide: 'top',
      enemySide: 'bottom',
    })

    const allyXs = placements
      .filter((p) => p.combatantId.startsWith('a'))
      .map((p) => Number(p.cellId.split('-')[1]))

    expect(Math.max(...allyXs)).toBeGreaterThan(1)
  })

  it('handles more combatants than available side cells gracefully', () => {
    const small = createSquareGridSpace({ id: 'g2', name: 'Small', columns: 3, rows: 2 })
    const combatants = Array.from({ length: 8 }, (_, i) => pc(`a${i}`))
    const placements = generateInitialPlacements(small, combatants)
    expect(placements.length).toBeGreaterThan(0)
    expect(placements.length).toBeLessThanOrEqual(combatants.length)
  })

  it('returns empty when space has no cells', () => {
    const empty = createSquareGridSpace({ id: 'g3', name: 'Empty', columns: 0, rows: 0 })
    const placements = generateInitialPlacements(empty, [pc('a1')])
    expect(placements).toHaveLength(0)
  })
})
