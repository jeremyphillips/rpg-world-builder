import { describe, expect, it } from 'vitest'

import type { Monster } from '@/features/content/monsters/domain/types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import { createEncounterState } from '@/features/mechanics/domain/combat/state/runtime'
import { buildMonsterCombatantInstance } from '@/features/encounter/helpers/combatants'
import {
  buildAttachedAuraInstancesFromMonsterTraits,
  collectMonsterTraitAttachedAuras,
  DEFAULT_MONSTER_RUNTIME_CONTEXT_FOR_ENCOUNTER,
  resolveTraitSaveDcFromEffects,
} from '@/features/mechanics/domain/combat/runtime/monster-runtime'

function minimalMonster(overrides: Partial<Monster> & Pick<Monster, 'id'>): Monster {
  return {
    name: 'Test',
    source: 'system',
    systemId: 'SRD_CC_v5_2_1',
    type: 'aberration',
    lore: { alignment: 'neutral', xpValue: 0, challengeRating: 0 },
    mechanics: {
      hitPoints: { count: 1, die: 8, modifier: 0 },
      armorClass: { kind: 'fixed', value: 10 },
      movement: { ground: 30 },
      proficiencyBonus: 2,
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      savingThrows: {},
      traits: [],
      actions: [],
    },
    ...overrides,
  } as unknown as Monster
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
        onFail: [],
      },
      {
        kind: 'emanation',
        attachedTo: 'self',
        area: { kind: 'sphere', size: 15 },
      },
      {
        kind: 'interval',
        stateId: 'trait-interval',
        every: { unit: 'turn', value: 1 },
        effects: [],
      },
    ]

    const monster = minimalMonster({
      id: 'test-aura-monster',
      mechanics: {
        hitPoints: { count: 1, die: 8, modifier: 0 },
        armorClass: { kind: 'fixed', value: 10 },
        movement: { ground: 30 },
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
        hitPoints: { count: 1, die: 8, modifier: 0 },
        armorClass: { kind: 'fixed', value: 10 },
        movement: { ground: 30 },
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
        stateId: 'encounter-interval',
        every: { unit: 'turn', value: 1 },
        effects: [],
      },
    ]

    const monster = minimalMonster({
      id: 'encounter-seed',
      name: 'Seeder',
      mechanics: {
        hitPoints: { count: 1, die: 8, modifier: 0 },
        armorClass: { kind: 'fixed', value: 10 },
        movement: { ground: 30 },
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
          hitPoints: { count: 1, die: 8, modifier: 0 },
          armorClass: { kind: 'fixed', value: 10 },
          movement: { ground: 30 },
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
