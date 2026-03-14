import { describe, expect, it } from 'vitest'

import {
  addConditionToCombatant,
  addStateToCombatant,
  advanceEncounterTurn,
  applyDamageToCombatant,
  applyHealingToCombatant,
  createEncounterState,
  removeConditionFromCombatant,
  removeStateFromCombatant,
} from './encounter-state'
import { rollInitiative } from './initiative-resolver'
import type { CombatantInstance } from './combatant.types'

describe('rollInitiative', () => {
  it('sorts by total, then modifier, then dexterity, then name', () => {
    const rolls = rollInitiative(
      [
        { instanceId: 'goblin-2', label: 'Goblin B', initiativeModifier: 2, dexterityScore: 14 },
        { instanceId: 'goblin-1', label: 'Goblin A', initiativeModifier: 2, dexterityScore: 14 },
        { instanceId: 'rogue', label: 'Rogue', initiativeModifier: 4, dexterityScore: 18 },
      ],
      {
        rng: () => 0.45, // 10 on a d20
      },
    )

    expect(rolls.map((roll) => roll.combatantId)).toEqual(['rogue', 'goblin-1', 'goblin-2'])
    expect(rolls.map((roll) => roll.total)).toEqual([14, 12, 12])
  })

  it('creates encounter state with the first initiative result active', () => {
    const combatants: CombatantInstance[] = [
      {
        instanceId: 'pc-1',
        side: 'party',
        source: { kind: 'pc', sourceId: 'pc-1', label: 'Cleric' },
        stats: { armorClass: 18, maxHitPoints: 20, currentHitPoints: 20, initiativeModifier: 0, dexterityScore: 10 },
        attacks: [],
        activeEffects: [],
        conditions: [],
        states: [],
      },
      {
        instanceId: 'monster-1',
        side: 'enemies',
        source: { kind: 'monster', sourceId: 'goblin', label: 'Goblin' },
        stats: { armorClass: 15, maxHitPoints: 7, currentHitPoints: 7, initiativeModifier: 2, dexterityScore: 14 },
        attacks: [],
        activeEffects: [],
        conditions: [],
        states: [],
      },
    ]

    const state = createEncounterState(combatants, {
      rng: () => 0.45,
    })

    expect(state.initiativeOrder).toEqual(['monster-1', 'pc-1'])
    expect(state.activeCombatantId).toBe('monster-1')
    expect(state.roundNumber).toBe(1)
    expect(state.partyCombatantIds).toEqual(['pc-1'])
    expect(state.enemyCombatantIds).toEqual(['monster-1'])
    expect(state.log.map((entry) => entry.type)).toEqual(['encounter_started', 'turn_started'])
  })

  it('advances turn order and starts a new round when initiative wraps', () => {
    const combatants: CombatantInstance[] = [
      {
        instanceId: 'pc-1',
        side: 'party',
        source: { kind: 'pc', sourceId: 'pc-1', label: 'Cleric' },
        stats: { armorClass: 18, maxHitPoints: 20, currentHitPoints: 20, initiativeModifier: 0, dexterityScore: 10 },
        attacks: [],
        activeEffects: [],
        conditions: [],
        states: [],
      },
      {
        instanceId: 'monster-1',
        side: 'enemies',
        source: { kind: 'monster', sourceId: 'goblin', label: 'Goblin' },
        stats: { armorClass: 15, maxHitPoints: 7, currentHitPoints: 7, initiativeModifier: 2, dexterityScore: 14 },
        attacks: [],
        activeEffects: [],
        conditions: [],
        states: [],
      },
    ]

    const started = createEncounterState(combatants, {
      rng: () => 0.45,
    })
    const secondTurn = advanceEncounterTurn(started)
    const wrappedTurn = advanceEncounterTurn(secondTurn)

    expect(secondTurn.activeCombatantId).toBe('pc-1')
    expect(secondTurn.roundNumber).toBe(1)
    expect(secondTurn.log.slice(-2).map((entry) => entry.type)).toEqual(['turn_ended', 'turn_started'])

    expect(wrappedTurn.activeCombatantId).toBe('monster-1')
    expect(wrappedTurn.roundNumber).toBe(2)
    expect(wrappedTurn.log.slice(-3).map((entry) => entry.type)).toEqual([
      'turn_ended',
      'round_started',
      'turn_started',
    ])
  })

  it('applies damage, healing, and runtime markers with log output', () => {
    const combatants: CombatantInstance[] = [
      {
        instanceId: 'pc-1',
        side: 'party',
        source: { kind: 'pc', sourceId: 'pc-1', label: 'Cleric' },
        stats: { armorClass: 18, maxHitPoints: 20, currentHitPoints: 20, initiativeModifier: 0, dexterityScore: 10 },
        attacks: [],
        activeEffects: [],
        conditions: [],
        states: [],
      },
    ]

    const started = createEncounterState(combatants, {
      rng: () => 0.45,
    })
    const damaged = applyDamageToCombatant(started, 'pc-1', 7)
    const healed = applyHealingToCombatant(damaged, 'pc-1', 3)
    const conditioned = addConditionToCombatant(healed, 'pc-1', 'poisoned')
    const stated = addStateToCombatant(conditioned, 'pc-1', 'concentrating')
    const conditionRemoved = removeConditionFromCombatant(stated, 'pc-1', 'poisoned')
    const stateRemoved = removeStateFromCombatant(conditionRemoved, 'pc-1', 'concentrating')

    expect(damaged.combatantsById['pc-1'].stats.currentHitPoints).toBe(13)
    expect(healed.combatantsById['pc-1'].stats.currentHitPoints).toBe(16)
    expect(stated.combatantsById['pc-1'].conditions).toEqual(['poisoned'])
    expect(stated.combatantsById['pc-1'].states).toEqual(['concentrating'])
    expect(stateRemoved.combatantsById['pc-1'].conditions).toEqual([])
    expect(stateRemoved.combatantsById['pc-1'].states).toEqual([])
    expect(stateRemoved.log.slice(-6).map((entry) => entry.type)).toEqual([
      'damage_applied',
      'healing_applied',
      'condition_applied',
      'state_applied',
      'condition_removed',
      'state_removed',
    ])
  })
})
