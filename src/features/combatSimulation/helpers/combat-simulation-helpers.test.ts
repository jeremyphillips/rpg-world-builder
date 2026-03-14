import { describe, expect, it } from 'vitest'

import type { Monster } from '@/features/content/monsters/domain/types'
import type { Weapon } from '@/features/content/equipment/weapons/domain/types/weapon.types'
import { buildMonsterAttackEntries, buildMonsterExecutableActions } from './combat-simulation-helpers'

const TEST_MONSTER = {
  id: 'test-monster',
  name: 'Test Monster',
  mechanics: {
    hitPoints: { count: 2, die: 8 },
    armorClass: { kind: 'fixed', value: 12 },
    movement: { ground: 30 },
    proficiencyBonus: 2,
    actions: [
      {
        kind: 'natural',
        name: 'Rend',
        attackType: 'claw',
        attackBonus: 4,
        damage: '1d6',
        damageBonus: 2,
        damageType: 'piercing',
      },
      {
        kind: 'special',
        name: 'Acid Spit',
        description: 'The monster spits acid.',
        attackBonus: 5,
        damage: '2d4',
        damageBonus: 3,
        damageType: 'acid',
      },
    ],
    bonusActions: [],
  },
  lore: {},
} as unknown as Monster

const LONGBOW = {
  id: 'longbow',
  name: 'Longbow',
  mode: 'ranged',
  properties: [],
  damage: { default: '1d8' },
  damageType: 'piercing',
} as unknown as Weapon

const MONSTER_WEAPON_TEST = {
  id: 'weapon-test-monster',
  name: 'Weapon Test Monster',
  mechanics: {
    hitPoints: { count: 2, die: 8 },
    armorClass: { kind: 'fixed', value: 12 },
    movement: { ground: 30 },
    abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 10, cha: 10 },
    proficiencyBonus: 2,
    proficiencies: {
      weapons: {
        longbow: { proficiencyLevel: 1 },
      },
    },
    equipment: {
      weapons: {
        'bone-bow': {
          weaponId: 'longbow',
          aliasName: 'Bone Bow',
          damageOverride: '1d10',
        },
        'war-bow': {
          weaponId: 'longbow',
          aliasName: 'War Bow',
          attackBonus: 7,
        },
      },
    },
    actions: [
      { kind: 'weapon', weaponRef: 'bone-bow' },
      { kind: 'weapon', weaponRef: 'war-bow' },
    ],
    bonusActions: [],
  },
  lore: {},
} as unknown as Monster

describe('combat simulation monster action helpers', () => {
  it('preserves authored damage bonuses for natural and special display entries', () => {
    const attacks = buildMonsterAttackEntries(TEST_MONSTER, {})

    expect(attacks).toEqual([
      expect.objectContaining({
        name: 'Rend',
        attackBonus: 4,
        damage: '1d6 + 2',
        damageType: 'piercing',
      }),
      expect.objectContaining({
        name: 'Acid Spit',
        attackBonus: 5,
        damage: '2d4 + 3',
        damageType: 'acid',
      }),
    ])
  })

  it('uses authored attack and damage bonuses for natural and special executable actions', () => {
    const actions = buildMonsterExecutableActions(TEST_MONSTER, {})

    expect(actions).toEqual([
      expect.objectContaining({
        label: 'Rend',
        resolutionMode: 'attack_roll',
        attackProfile: expect.objectContaining({
          attackBonus: 4,
          damage: '1d6 + 2',
          damageType: 'piercing',
        }),
      }),
      expect.objectContaining({
        label: 'Acid Spit',
        resolutionMode: 'attack_roll',
        attackProfile: expect.objectContaining({
          attackBonus: 5,
          damage: '2d4 + 3',
          damageType: 'acid',
        }),
      }),
    ])
  })

  it('uses shared resolver math for weapon actions, including monster proficiencies and active modifiers', () => {
    const attacks = buildMonsterAttackEntries(
      MONSTER_WEAPON_TEST,
      { longbow: LONGBOW },
      [
        { kind: 'modifier', target: 'attack_roll', mode: 'add', value: 1 },
        { kind: 'modifier', target: 'damage', mode: 'add', value: 2 },
      ],
    )

    expect(attacks[0]).toEqual(
      expect.objectContaining({
        name: 'Bone Bow',
        attackBonus: 5,
        damage: '1d10 + 4',
        damageType: 'piercing',
      }),
    )

    const actions = buildMonsterExecutableActions(
      MONSTER_WEAPON_TEST,
      { longbow: LONGBOW },
      [
        { kind: 'modifier', target: 'attack_roll', mode: 'add', value: 1 },
        { kind: 'modifier', target: 'damage', mode: 'add', value: 2 },
      ],
    )

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Bone Bow',
        resolutionMode: 'attack_roll',
        attackProfile: expect.objectContaining({
          attackBonus: 5,
          damage: '1d10 + 4',
          damageType: 'piercing',
        }),
      }),
    )
  })

  it('prefers explicit authored weapon attack bonuses over shared resolved totals', () => {
    const actions = buildMonsterExecutableActions(
      MONSTER_WEAPON_TEST,
      { longbow: LONGBOW },
      [
        { kind: 'modifier', target: 'attack_roll', mode: 'add', value: 1 },
      ],
    )

    expect(actions[1]).toEqual(
      expect.objectContaining({
        label: 'War Bow',
        attackProfile: expect.objectContaining({
          attackBonus: 7,
          damage: '1d8 + 2',
          damageType: 'piercing',
        }),
      }),
    )
  })
})
