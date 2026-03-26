import { describe, expect, it } from 'vitest'

import type { CombatantInstance } from './types/combatant.types'
import {
  canTargetAsDeadCreature,
  hasIntactRemainsForRevival,
  hasRemainsOnGrid,
  isDeadCombatant,
  isDefeatedCombatant,
} from './combatant-participation'

function minimalCombatant(overrides: Partial<CombatantInstance>): CombatantInstance {
  return {
    instanceId: 'x',
    side: 'party',
    source: { kind: 'pc', sourceId: 'p', label: 'P' },
    stats: {
      armorClass: 10,
      maxHitPoints: 10,
      currentHitPoints: 10,
      initiativeModifier: 0,
    },
    attacks: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
    ...overrides,
  }
}

describe('combatant participation / death / dead-creature targeting', () => {
  it('defeated but no death record: synthetic/test state; production lethal path sets diedAtRound', () => {
    const c = minimalCombatant({
      stats: {
        armorClass: 10,
        maxHitPoints: 10,
        currentHitPoints: 0,
        initiativeModifier: 0,
      },
    })
    expect(isDefeatedCombatant(c)).toBe(true)
    expect(isDeadCombatant(c)).toBe(false)
    expect(canTargetAsDeadCreature(c)).toBe(true)
  })

  it('defeated and dust remains: dead record, not a dead-creature target', () => {
    const c = minimalCombatant({
      stats: {
        armorClass: 10,
        maxHitPoints: 10,
        currentHitPoints: 0,
        initiativeModifier: 0,
      },
      remains: 'dust',
      diedAtRound: 2,
    })
    expect(isDefeatedCombatant(c)).toBe(true)
    expect(isDeadCombatant(c)).toBe(true)
    expect(canTargetAsDeadCreature(c)).toBe(false)
    expect(hasRemainsOnGrid(c)).toBe(true)
  })

  it('dead-creature targeting: corpse at 0 HP', () => {
    const c = minimalCombatant({
      stats: {
        armorClass: 10,
        maxHitPoints: 10,
        currentHitPoints: 0,
        initiativeModifier: 0,
      },
      remains: 'corpse',
      diedAtRound: 1,
    })
    expect(canTargetAsDeadCreature(c)).toBe(true)
  })

  it('separates zero HP from death record: living has no death fields', () => {
    const alive = minimalCombatant({
      stats: {
        armorClass: 10,
        maxHitPoints: 10,
        currentHitPoints: 5,
        initiativeModifier: 0,
      },
    })
    expect(isDefeatedCombatant(alive)).toBe(false)
    expect(isDeadCombatant(alive)).toBe(false)
    expect(canTargetAsDeadCreature(alive)).toBe(false)
  })

  it('undefined remains: living has no grid remains; implicit corpse only for dead-creature targeting at 0 HP', () => {
    const living = minimalCombatant({})
    expect(hasRemainsOnGrid(living)).toBe(false)
    expect(hasIntactRemainsForRevival(living)).toBe(true)

    const syntheticZeroNoRecord = minimalCombatant({
      stats: {
        armorClass: 10,
        maxHitPoints: 10,
        currentHitPoints: 0,
        initiativeModifier: 0,
      },
    })
    expect(hasRemainsOnGrid(syntheticZeroNoRecord)).toBe(false)
    expect(canTargetAsDeadCreature(syntheticZeroNoRecord)).toBe(true)
    expect(hasIntactRemainsForRevival(syntheticZeroNoRecord)).toBe(true)
  })
})
