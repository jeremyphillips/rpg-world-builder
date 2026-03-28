import { describe, expect, it } from 'vitest'

import type { Monster } from '@/features/content/monsters/domain/types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import { createEncounterState } from '../state/runtime'
import { buildMonsterCombatantInstance } from '@/features/encounter/helpers/combatant-builders'
import {
  buildAttachedAuraInstancesFromMonsterTraits,
  collectMonsterTraitAttachedAuras,
  DEFAULT_MONSTER_RUNTIME_CONTEXT_FOR_ENCOUNTER,
  resolveTraitSaveDcFromEffects,
} from './monster-runtime'

function minimalMonster(overrides: Partial<Monster> & Pick<Monster, 'id'>): Monster {
  return {
    name: 'Test',
    type: 'aberration',
    size: 'medium',
    alignment: 'neutral',
    armorClass: { value: 10 },
    hitPoints: { count: 1, die: 8, modifier: 0 },
    speed: { ground: 30 },
    mechanics: {
      proficiencyBonus: 2,
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      savingThrows: {},
      hitPoints: { count: 1, die: 8, modifier: 0 },
      traits: [],
      actions: [],
    },
    ...overrides,
  } as Monster
}

describe('monster trait attached battlefield auras', () => {
  it('resolveTraitSaveDcFromEffects reads DC from save nested under interval', () => {
    const effects: Effect[] = [
      {
        kind: 'emanation',
        attachedTo: 'self',
        area: { kind: 'sphere', size: 5 },
      },
      {
        kind: 'interval',
        stateId: 'test',
        every: { value: 1, unit: 'turn' },
        effects: [
          {
            kind: 'save',
            save: { ability: 'con', dc: 14 },
            onFail: [{ kind: 'note', text: 'fail', category: 'under-modeled' }],
          },
        ],
      },
    ]
    expect(resolveTraitSaveDcFromEffects(effects)).toBe(14)
  })

  it('builds attached aura rows from trait emanation effects', () => {
    const traitEffects: Effect[] = [
      {
        kind: 'save',
        save: { ability: 'wisdom', dc: 14 },
      },
      {
        kind: 'emanation',
        attachedTo: 'self',
        area: { kind: 'sphere', size: 15 },
      },
      {
        kind: 'interval',
        every: { unit: 'turn', value: 1 },
        effects: [],
      },
    ]

    const monster = minimalMonster({
      id: 'test-aura-monster',
      mechanics: {
        traits: [
          {
            name: 'Aura of Testing',
            description: 'd',
            effects: traitEffects,
          },
        ],
        proficiencyBonus: 2,
        abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        savingThrows: {},
        hitPoints: { count: 1, die: 8, modifier: 0 },
        actions: [],
      },
    })

    const auras = buildAttachedAuraInstancesFromMonsterTraits(
      monster,
      DEFAULT_MONSTER_RUNTIME_CONTEXT_FOR_ENCOUNTER,
      'g1',
    )

    expect(auras).toHaveLength(1)
    expect(auras[0]!.source).toEqual({
      kind: 'monster-trait',
      monsterId: 'test-aura-monster',
      traitIndex: 0,
    })
    expect(auras[0]!.area).toEqual({ kind: 'sphere', size: 15 })
    expect(auras[0]!.saveDc).toBe(14)
  })

  it('does not emit auras when trait triggers are not matched', () => {
    const monster = minimalMonster({
      id: 'sunlight-only',
      mechanics: {
        traits: [
          {
            name: 'Sunlight',
            description: 'd',
            trigger: { kind: 'in-environment', environment: 'sunlight' },
            effects: [
              {
                kind: 'emanation',
                attachedTo: 'self',
                area: { kind: 'sphere', size: 10 },
              },
            ],
          },
        ],
        proficiencyBonus: 2,
        abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        savingThrows: {},
        hitPoints: { count: 1, die: 8, modifier: 0 },
        actions: [],
      },
    })

    const auras = buildAttachedAuraInstancesFromMonsterTraits(
      monster,
      DEFAULT_MONSTER_RUNTIME_CONTEXT_FOR_ENCOUNTER,
      'g1',
    )
    expect(auras).toHaveLength(0)
  })

  it('createEncounterState seeds trait auras when monstersById is provided', () => {
    const traitEffects: Effect[] = [
      {
        kind: 'emanation',
        attachedTo: 'self',
        area: { kind: 'sphere', size: 10 },
      },
      {
        kind: 'interval',
        every: { unit: 'turn', value: 1 },
        effects: [],
      },
    ]

    const monster = minimalMonster({
      id: 'encounter-seed',
      name: 'Seeder',
      mechanics: {
        traits: [
          {
            name: 'Field',
            description: 'd',
            effects: traitEffects,
          },
        ],
        proficiencyBonus: 2,
        abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        savingThrows: {},
        hitPoints: { count: 1, die: 8, modifier: 0 },
        actions: [],
      },
    })

    const combatant = buildMonsterCombatantInstance({
      runtimeId: 'm1',
      monster,
      attacks: [],
      actions: [],
      initiativeModifier: 0,
      armorClass: 10,
      currentHitPoints: 10,
      activeEffects: [],
      turnHooks: [],
    })

    const state = createEncounterState([combatant], {
      rng: () => 0.5,
      monstersById: { 'encounter-seed': monster },
    })

    expect(state.attachedAuraInstances).toHaveLength(1)
    expect(state.attachedAuraInstances![0]!.source.kind).toBe('monster-trait')
  })

  it('collectMonsterTraitAttachedAuras returns empty without catalog', () => {
    const combatant = buildMonsterCombatantInstance({
      runtimeId: 'm1',
      monster: minimalMonster({
        id: 'x',
        mechanics: {
          traits: [
            {
              name: 'T',
              description: 'd',
              effects: [
                {
                  kind: 'emanation',
                  attachedTo: 'self',
                  area: { kind: 'sphere', size: 5 },
                },
              ],
            },
          ],
          proficiencyBonus: 2,
          abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
          savingThrows: {},
          hitPoints: { count: 1, die: 8, modifier: 0 },
          actions: [],
        },
      }),
      attacks: [],
      actions: [],
      initiativeModifier: 0,
      armorClass: 10,
      currentHitPoints: 10,
      activeEffects: [],
      turnHooks: [],
    })

    expect(collectMonsterTraitAttachedAuras([combatant], undefined, DEFAULT_MONSTER_RUNTIME_CONTEXT_FOR_ENCOUNTER)).toEqual(
      [],
    )
  })
})
