import { describe, expect, it } from 'vitest'

import { createSquareGridSpace } from '@/features/encounter/space'
import type { CombatantPosition, EncounterSpace } from '@/features/encounter/space'

import { addStateToCombatant, removeStateFromCombatant } from './condition-mutations'
import { dropConcentration } from './concentration-mutations'
import {
  findNearestUnoccupiedPassableCell,
  markerCausesBattlefieldAbsence,
} from './battlefield-return-placement'
import type { CombatantInstance, EncounterState } from './types'
import type { InitiativeRoll } from '../../resolution/resolvers/initiative-resolver'

function minimalCombatant(id: string, overrides: Partial<CombatantInstance> = {}): CombatantInstance {
  return {
    instanceId: id,
    side: 'party',
    source: { kind: 'pc', sourceId: id, label: id },
    stats: {
      armorClass: 15,
      maxHitPoints: 20,
      currentHitPoints: 20,
      initiativeModifier: 2,
      dexterityScore: 14,
    },
    attacks: [],
    actions: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
    ...overrides,
  }
}

function makeEncounter(
  combatants: CombatantInstance[],
  space: EncounterSpace,
  placements: CombatantPosition[],
): EncounterState {
  const initiative: InitiativeRoll[] = combatants.map((c) => ({
    combatantId: c.instanceId,
    label: c.source.label,
    roll: 10,
    modifier: c.stats.initiativeModifier,
    total: 10 + c.stats.initiativeModifier,
    dexterityScore: c.stats.dexterityScore,
  }))
  return {
    combatantsById: Object.fromEntries(combatants.map((c) => [c.instanceId, c])),
    partyCombatantIds: combatants.filter((c) => c.side === 'party').map((c) => c.instanceId),
    enemyCombatantIds: combatants.filter((c) => c.side === 'enemies').map((c) => c.instanceId),
    initiative,
    initiativeOrder: combatants.map((c) => c.instanceId),
    activeCombatantId: combatants[0]?.instanceId ?? null,
    turnIndex: 0,
    roundNumber: 1,
    started: true,
    log: [],
    space,
    placements,
  }
}

describe('markerCausesBattlefieldAbsence', () => {
  it('is true for banished and off-grid engine markers', () => {
    expect(markerCausesBattlefieldAbsence('banished')).toBe(true)
    expect(markerCausesBattlefieldAbsence('off-grid')).toBe(true)
  })

  it('is false for unrelated state labels', () => {
    expect(markerCausesBattlefieldAbsence('see-invisibility')).toBe(false)
  })
})

describe('findNearestUnoccupiedPassableCell', () => {
  it('returns a cell at Chebyshev distance 1 when origin is occupied', () => {
    const space = createSquareGridSpace({ id: 'g', name: 'g', columns: 3, rows: 3, cellFeet: 5 })
    const origin = space.cells.find((c) => c.x === 1 && c.y === 1)!
    const placements: CombatantPosition[] = [{ combatantId: 'blocker', cellId: origin.id }]
    const found = findNearestUnoccupiedPassableCell(space, placements, origin.id, 'returning')
    expect(found).toBeDefined()
    const foundCell = space.cells.find((c) => c.id === found)!
    expect(Math.max(Math.abs(foundCell.x - origin.x), Math.abs(foundCell.y - origin.y))).toBe(1)
  })
})

describe('banishment clears occupancy and restores on return', () => {
  it('removes placement when banished is applied and restores when removed', () => {
    const wiz = minimalCombatant('wiz')
    const foe = minimalCombatant('foe', { side: 'enemies' })
    const space = createSquareGridSpace({ id: 'g', name: 'g', columns: 4, rows: 4, cellFeet: 5 })
    const placements: CombatantPosition[] = [
      { combatantId: 'wiz', cellId: space.cells.find((c) => c.x === 0 && c.y === 0)!.id },
      { combatantId: 'foe', cellId: space.cells.find((c) => c.x === 2 && c.y === 0)!.id },
    ]

    let state = makeEncounter([wiz, foe], space, placements)

    const wizCellBefore = placements.find((p) => p.combatantId === 'wiz')!.cellId

    state = addStateToCombatant(state, 'wiz', 'banished', {})

    expect(state.placements?.some((p) => p.combatantId === 'wiz')).toBe(false)
    expect(state.combatantsById.wiz?.battlefieldReturnCellId).toBe(wizCellBefore)

    state = removeStateFromCombatant(state, 'wiz', 'banished')

    expect(state.placements?.find((p) => p.combatantId === 'wiz')?.cellId).toBe(wizCellBefore)
    expect(state.combatantsById.wiz?.battlefieldReturnCellId).toBeUndefined()
  })

  it('falls back to nearest free cell when original is occupied', () => {
    const wiz = minimalCombatant('wiz')
    const foe = minimalCombatant('foe', { side: 'enemies' })
    const space = createSquareGridSpace({ id: 'g', name: 'g', columns: 4, rows: 4, cellFeet: 5 })
    const c00 = space.cells.find((c) => c.x === 0 && c.y === 0)!
    const c10 = space.cells.find((c) => c.x === 1 && c.y === 0)!
    const placements: CombatantPosition[] = [
      { combatantId: 'wiz', cellId: c00.id },
      { combatantId: 'foe', cellId: c10.id },
    ]

    let state = makeEncounter([wiz, foe], space, placements)

    state = addStateToCombatant(state, 'wiz', 'banished', {})
    expect(state.placements?.some((p) => p.combatantId === 'wiz')).toBe(false)

    const blocker = minimalCombatant('blocker', { side: 'enemies' })
    state = {
      ...state,
      combatantsById: { ...state.combatantsById, blocker },
      initiative: [
        ...state.initiative,
        {
          combatantId: 'blocker',
          label: 'blocker',
          roll: 8,
          modifier: 0,
          total: 8,
        },
      ],
      initiativeOrder: [...state.initiativeOrder, 'blocker'],
      placements: [...(state.placements ?? []), { combatantId: 'blocker', cellId: c00.id }],
    }

    state = removeStateFromCombatant(state, 'wiz', 'banished')

    const wizPlacement = state.placements?.find((p) => p.combatantId === 'wiz')
    expect(wizPlacement).toBeDefined()
    expect(wizPlacement!.cellId).not.toBe(c00.id)
    const placed = space.cells.find((c) => c.id === wizPlacement!.cellId)!
    expect(Math.max(Math.abs(placed.x - c00.x), Math.abs(placed.y - c00.y))).toBe(1)
  })

  it('restores grid placement immediately when banished is stripped via dropConcentration (concentration ends)', () => {
    const space = createSquareGridSpace({ id: 'g', name: 'g', columns: 4, rows: 4, cellFeet: 5 })
    const c00 = space.cells.find((c) => c.x === 0 && c.y === 0)!
    const c11 = space.cells.find((c) => c.x === 1 && c.y === 1)!

    const caster = minimalCombatant('caster', {
      concentration: {
        spellId: 'banishment',
        spellLabel: 'Banishment',
        linkedMarkerIds: ['banished'],
        remainingTurns: 10,
        totalTurns: 10,
      },
    })
    const target = minimalCombatant('target', {
      side: 'enemies',
      states: [{ id: 'banished', label: 'banished' }],
      battlefieldReturnCellId: c00.id,
    })

    let state = makeEncounter([caster, target], space, [{ combatantId: 'caster', cellId: c11.id }])

    expect(state.placements?.some((p) => p.combatantId === 'target')).toBe(false)

    state = dropConcentration(state, 'caster')

    expect(state.combatantsById.target?.states.some((s) => s.label === 'banished')).toBe(false)
    expect(state.placements?.find((p) => p.combatantId === 'target')?.cellId).toBe(c00.id)
    expect(state.combatantsById.target?.battlefieldReturnCellId).toBeUndefined()
  })
})
