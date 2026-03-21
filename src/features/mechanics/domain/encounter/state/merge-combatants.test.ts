import { describe, expect, it } from 'vitest'

import type { CombatantInstance } from './types'
import { createEncounterState, mergeCombatantsIntoEncounter } from './runtime'

function minimalEnemy(id: string, label: string): CombatantInstance {
  return {
    instanceId: id,
    side: 'enemies',
    source: { kind: 'monster', sourceId: 'goblin', label },
    stats: {
      armorClass: 10,
      maxHitPoints: 10,
      currentHitPoints: 10,
      initiativeModifier: 0,
      dexterityScore: 10,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      speeds: { ground: 30 },
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

function minimalParty(id: string, label: string): CombatantInstance {
  return {
    instanceId: id,
    side: 'party',
    source: { kind: 'pc', sourceId: id, label },
    stats: {
      armorClass: 10,
      maxHitPoints: 10,
      currentHitPoints: 10,
      initiativeModifier: 0,
      dexterityScore: 10,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      speeds: { ground: 30 },
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

function minimalAllySummon(id: string, label: string): CombatantInstance {
  return {
    instanceId: id,
    side: 'party',
    source: { kind: 'monster', sourceId: 'wolf', label },
    creatureType: 'beast',
    stats: {
      armorClass: 13,
      maxHitPoints: 11,
      currentHitPoints: 11,
      initiativeModifier: 2,
      dexterityScore: 15,
      abilityScores: {
        strength: 12,
        dexterity: 15,
        constitution: 12,
        intelligence: 3,
        wisdom: 12,
        charisma: 6,
      },
      speeds: { ground: 40 },
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

describe('mergeCombatantsIntoEncounter', () => {
  it('adds party combatants and merges initiative while preserving active turn', () => {
    const base = createEncounterState(
      [minimalParty('pc-1', 'Hero'), minimalEnemy('enemy-1', 'Goblin')],
      { rng: () => 0.5 },
    )

    const merged = mergeCombatantsIntoEncounter(
      base,
      [minimalAllySummon('summon-1', 'Wolf')],
      { rng: () => 0.5 },
    )

    expect(merged.partyCombatantIds).toContain('summon-1')
    expect(merged.combatantsById['summon-1']).toBeDefined()
    expect(merged.initiative.some((r) => r.combatantId === 'summon-1')).toBe(true)
    expect(merged.activeCombatantId).toBe(base.activeCombatantId)
    expect(merged.initiativeOrder.length).toBe(3)
  })
})
