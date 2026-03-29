import { describe, expect, it } from 'vitest'

import { buildMonsterCombatantInstance } from '@/features/encounter/helpers/combatants'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter/state/types'

import {
  getCombatantDarkvisionRangeFt,
  getEncounterViewerPerceptionCapabilitiesFromCombatant,
} from '../perception.capabilities'

describe('getCombatantDarkvisionRangeFt', () => {
  it('reads max range from senses.special darkvision', () => {
    const c: CombatantInstance = {
      instanceId: 'x',
      side: 'party',
      source: { kind: 'pc', sourceId: 'x', label: 'X' },
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
      senses: {
        special: [
          { type: 'darkvision', range: 60 },
          { type: 'darkvision', range: 120 },
        ],
      },
    }
    expect(getCombatantDarkvisionRangeFt(c)).toBe(120)
  })

  it('falls back to skillRuntime when senses omit darkvision', () => {
    const c: CombatantInstance = {
      instanceId: 'x',
      side: 'party',
      source: { kind: 'pc', sourceId: 'x', label: 'X' },
      stats: {
        armorClass: 10,
        maxHitPoints: 10,
        currentHitPoints: 10,
        initiativeModifier: 0,
        skillRuntime: { darkvisionRangeFt: 60 },
      },
      attacks: [],
      activeEffects: [],
      runtimeEffects: [],
      turnHooks: [],
      conditions: [],
      states: [],
    }
    expect(getCombatantDarkvisionRangeFt(c)).toBe(60)
  })

  it('prefers senses over skillRuntime when both set', () => {
    const c: CombatantInstance = {
      instanceId: 'x',
      side: 'party',
      source: { kind: 'pc', sourceId: 'x', label: 'X' },
      stats: {
        armorClass: 10,
        maxHitPoints: 10,
        currentHitPoints: 10,
        initiativeModifier: 0,
        skillRuntime: { darkvisionRangeFt: 60 },
      },
      attacks: [],
      activeEffects: [],
      runtimeEffects: [],
      turnHooks: [],
      conditions: [],
      states: [],
      senses: { special: [{ type: 'darkvision', range: 120 }] },
    }
    expect(getCombatantDarkvisionRangeFt(c)).toBe(120)
  })
})

describe('getEncounterViewerPerceptionCapabilitiesFromCombatant', () => {
  it('returns darkvision range from monster build (senses + skillRuntime)', () => {
    const monster = {
      id: 'test-dv',
      name: 'Test',
      type: 'humanoid',
      mechanics: {
        hitPoints: { count: 1, die: 8, modifier: 0 },
        armorClass: { value: 10 },
        movement: { ground: 30 },
        abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        proficiencyBonus: 2,
        senses: { special: [{ type: 'darkvision' as const, range: 120 }], passivePerception: 10 },
      },
      lore: { alignment: 'neutral', xpValue: 0, challengeRating: 0 },
    } as Monster

    const c = buildMonsterCombatantInstance({
      runtimeId: 'm1',
      monster,
      attacks: [],
      initiativeModifier: 0,
      armorClass: 10,
      currentHitPoints: 5,
      activeEffects: [],
      turnHooks: [],
    })
    expect(getEncounterViewerPerceptionCapabilitiesFromCombatant(c)).toEqual({ darkvisionRangeFt: 120 })
    expect(getCombatantDarkvisionRangeFt(c)).toBe(120)
  })

  it('returns undefined when no darkvision on combatant', () => {
    const monster = {
      id: 'test',
      name: 'Test',
      type: 'humanoid',
      mechanics: {
        hitPoints: { count: 1, die: 8, modifier: 0 },
        armorClass: { value: 10 },
        movement: { ground: 30 },
        abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        proficiencyBonus: 2,
      },
      lore: { alignment: 'neutral', xpValue: 0, challengeRating: 0 },
    } as Monster

    const c = buildMonsterCombatantInstance({
      runtimeId: 'm2',
      monster,
      attacks: [],
      initiativeModifier: 0,
      armorClass: 10,
      currentHitPoints: 5,
      activeEffects: [],
      turnHooks: [],
    })
    expect(getEncounterViewerPerceptionCapabilitiesFromCombatant(c)).toBeUndefined()
  })
})
