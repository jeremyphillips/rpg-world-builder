import { describe, expect, it } from 'vitest'

import type { CombatantInstance } from '@/features/mechanics/domain/encounter'
import type { EncounterState } from '@/features/mechanics/domain/encounter/state/types'

import { deriveEncounterSideOutcome } from './derive-encounter-side-outcome'

function minimalEncounter(overrides: Partial<EncounterState>): EncounterState {
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
    ...overrides,
  }
}

function c(id: string, side: 'party' | 'enemies', hp: number): CombatantInstance {
  return {
    instanceId: id,
    side,
    source: { kind: 'pc', sourceId: id, label: id },
    stats: {
      armorClass: 10,
      maxHitPoints: 10,
      currentHitPoints: hp,
      initiativeModifier: 0,
    },
    attacks: [],
    activeEffects: [],
    runtimeEffects: [],
    turnHooks: [],
    conditions: [],
    states: [],
  }
}

describe('deriveEncounterSideOutcome', () => {
  it('ongoing when both sides have active combatants', () => {
    const state = minimalEncounter({
      partyCombatantIds: ['a'],
      enemyCombatantIds: ['b'],
      combatantsById: {
        a: c('a', 'party', 5),
        b: c('b', 'enemies', 5),
      },
    })
    expect(deriveEncounterSideOutcome(state).kind).toBe('ongoing')
  })

  it('allies_win when enemies are all defeated', () => {
    const state = minimalEncounter({
      partyCombatantIds: ['a'],
      enemyCombatantIds: ['b'],
      combatantsById: {
        a: c('a', 'party', 5),
        b: c('b', 'enemies', 0),
      },
    })
    expect(deriveEncounterSideOutcome(state).kind).toBe('allies_win')
  })

  it('enemies_win when party is all defeated', () => {
    const state = minimalEncounter({
      partyCombatantIds: ['a'],
      enemyCombatantIds: ['b'],
      combatantsById: {
        a: c('a', 'party', 0),
        b: c('b', 'enemies', 5),
      },
    })
    expect(deriveEncounterSideOutcome(state).kind).toBe('enemies_win')
  })

  it('stalemate when no one is active', () => {
    const state = minimalEncounter({
      partyCombatantIds: ['a'],
      enemyCombatantIds: ['b'],
      combatantsById: {
        a: c('a', 'party', 0),
        b: c('b', 'enemies', 0),
      },
    })
    expect(deriveEncounterSideOutcome(state).kind).toBe('stalemate')
  })
})
