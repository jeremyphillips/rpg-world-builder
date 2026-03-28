import { describe, expect, it } from 'vitest'

import type { CombatantInstance } from '../types/combatant.types'
import {
  canCombatantTakeReactions,
  canTargetAsDeadCreature,
  getCombatantTurnStatus,
  hasConsumableRemains,
  hasIntactRemainsForRevival,
  hasRemainsOnGrid,
  isDeadCombatant,
  isDefeatedCombatant,
  shouldAutoSkipCombatantTurn,
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

  it('remainsConsumed: no grid presence, dead-creature targeting, or consumable remains', () => {
    const c = minimalCombatant({
      stats: {
        armorClass: 10,
        maxHitPoints: 10,
        currentHitPoints: 0,
        initiativeModifier: 0,
      },
      remains: 'corpse',
      diedAtRound: 1,
      remainsConsumed: { atRound: 2, spawnInstanceId: 'wiz-spawn-zombie-0-123' },
    })
    expect(hasRemainsOnGrid(c)).toBe(false)
    expect(canTargetAsDeadCreature(c)).toBe(false)
    expect(hasConsumableRemains(c)).toBe(false)
  })
})

describe('CombatantTurnStatus', () => {
  it('defeated: auto-skip, skipReason defeated, not in initiative', () => {
    const c = minimalCombatant({
      stats: {
        armorClass: 10,
        maxHitPoints: 10,
        currentHitPoints: 0,
        initiativeModifier: 0,
      },
    })
    const s = getCombatantTurnStatus(c)
    expect(s.isDefeated).toBe(true)
    expect(s.shouldAutoSkipTurn).toBe(true)
    expect(s.skipReason).toBe('defeated')
    expect(s.remainsInInitiative).toBe(false)
    expect(shouldAutoSkipCombatantTurn(c)).toBe(true)
  })

  it('incapacitated while alive: cannot act, auto-skip cannot-act, remains in initiative', () => {
    const c = minimalCombatant({
      conditions: [{ id: 'incap', label: 'incapacitated' }],
    })
    const s = getCombatantTurnStatus(c)
    expect(s.canTakeActions).toBe(false)
    expect(s.canTakeReactions).toBe(false)
    expect(canCombatantTakeReactions(c)).toBe(false)
    expect(s.shouldAutoSkipTurn).toBe(true)
    expect(s.skipReason).toBe('cannot-act')
    expect(s.remainsInInitiative).toBe(true)
  })

  it('banished: no battlefield presence, skip banished, remains in initiative when HP > 0', () => {
    const c = minimalCombatant({
      states: [{ id: 'b', label: 'banished' }],
    })
    const s = getCombatantTurnStatus(c)
    expect(s.hasBattlefieldPresence).toBe(false)
    expect(s.occupiesGrid).toBe(false)
    expect(s.canBeTargetedOnGrid).toBe(false)
    expect(s.shouldAutoSkipTurn).toBe(true)
    expect(s.skipReason).toBe('banished')
    expect(s.remainsInInitiative).toBe(true)
  })

  it('off-grid state: absence and skipReason off-grid', () => {
    const c = minimalCombatant({
      states: [{ id: 'og', label: 'off-grid' }],
    })
    const s = getCombatantTurnStatus(c)
    expect(s.hasBattlefieldPresence).toBe(false)
    expect(s.skipReason).toBe('off-grid')
    expect(s.remainsInInitiative).toBe(true)
  })

  it('remains-consumed when defeated: skipReason remains-consumed, no battlefield presence', () => {
    const c = minimalCombatant({
      stats: {
        armorClass: 10,
        maxHitPoints: 10,
        currentHitPoints: 0,
        initiativeModifier: 0,
      },
      remains: 'corpse',
      diedAtRound: 1,
      remainsConsumed: { atRound: 2 },
    })
    const s = getCombatantTurnStatus(c)
    expect(s.skipReason).toBe('remains-consumed')
    expect(s.hasBattlefieldPresence).toBe(false)
    expect(s.canBeTargetedOnGrid).toBe(false)
  })
})
