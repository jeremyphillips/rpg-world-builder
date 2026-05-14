import { describe, expect, it } from 'vitest'

import { buildCreatureSensesFromResolvedRace } from '@/features/character/domain/derived/grants/raceSenseGrants'
import { buildMonsterCombatantInstance } from '@/features/encounter/helpers/combatants'
import type { Monster } from '@/features/content/monsters/domain/types'
import { getSystemRace } from '@/features/mechanics/domain/rulesets/system/races'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import type { CombatantInstance } from '@/features/mechanics/domain/combat/state/types'

import {
  getCombatantBlindsightRangeFt,
  getCombatantDarkvisionRangeFt,
  getCombatantVisionSenseRanges,
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

  it('resolves darkvision 60 from system elf race grant shape on a PC-like combatant', () => {
    const race = getSystemRace(DEFAULT_SYSTEM_RULESET_ID, 'elf')
    const senses = buildCreatureSensesFromResolvedRace(race)
    const c: CombatantInstance = {
      instanceId: 'pc-elf',
      side: 'party',
      source: { kind: 'pc', sourceId: 'c1', label: 'Elf' },
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
      senses,
    }
    expect(getCombatantDarkvisionRangeFt(c)).toBe(60)
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

  it('reads max blindsight range from senses.special', () => {
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
          { type: 'blindsight', range: 30 },
          { type: 'blindsight', range: 60 },
        ],
      },
    }
    expect(getCombatantBlindsightRangeFt(c)).toBe(60)
  })

  it('getCombatantVisionSenseRanges returns both senses when present', () => {
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
          { type: 'blindsight', range: 60 },
          { type: 'darkvision', range: 120 },
        ],
      },
    }
    expect(getCombatantVisionSenseRanges(c)).toEqual({
      blindsightRangeFt: 60,
      darkvisionRangeFt: 120,
    })
    expect(getEncounterViewerPerceptionCapabilitiesFromCombatant(c)).toEqual({
      blindsightRangeFt: 60,
      darkvisionRangeFt: 120,
    })
  })

  it('returns blindsight-only when monster has blindsight but no darkvision', () => {
    const monster = {
      id: 'test-bs',
      name: 'Test',
      type: 'humanoid',
      mechanics: {
        hitPoints: { count: 1, die: 8, modifier: 0 },
        armorClass: { value: 10 },
        movement: { ground: 30 },
        abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        proficiencyBonus: 2,
        senses: { special: [{ type: 'blindsight' as const, range: 60 }], passivePerception: 10 },
      },
      lore: { alignment: 'neutral', xpValue: 0, challengeRating: 0 },
    } as Monster

    const c = buildMonsterCombatantInstance({
      runtimeId: 'm-bs',
      monster,
      attacks: [],
      initiativeModifier: 0,
      armorClass: 10,
      currentHitPoints: 5,
      activeEffects: [],
      turnHooks: [],
    })
    expect(getEncounterViewerPerceptionCapabilitiesFromCombatant(c)).toEqual({ blindsightRangeFt: 60 })
  })

  it('returns undefined when no darkvision or blindsight on combatant', () => {
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
