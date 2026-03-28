import { describe, expect, it } from 'vitest'

import type { Monster } from '@/features/content/monsters/domain/types'
import type { Weapon } from '@/features/content/equipment/weapons/domain/types/weapon.types'
import { buildMonsterAttackEntries, buildMonsterExecutableActions } from '../../monsters'
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

/** Exercises `buildMonsterActionUsage` via `buildMonsterExecutableActions` only (helper stays private). */
const MONSTER_USAGE_MATRIX = {
  id: 'usage-matrix-monster',
  name: 'Usage Matrix',
  mechanics: {
    hitPoints: { count: 1, die: 8 },
    armorClass: { kind: 'fixed', value: 10 },
    movement: { ground: 30 },
    proficiencyBonus: 2,
    actions: [
      {
        kind: 'natural',
        name: 'Claw',
        attackType: 'claw',
        attackBonus: 3,
        damage: '1d4',
        damageType: 'slashing',
      },
      {
        kind: 'special',
        name: 'Recharge Breath',
        description: 'Recharge 5–6.',
        recharge: { min: 5, max: 6 },
      },
      {
        kind: 'special',
        name: 'Limited Hex',
        description: '2/day.',
        uses: { count: 2, period: 'day' as const },
      },
      {
        kind: 'special',
        name: 'Recharge And Uses',
        description: 'Both recharge and daily uses.',
        recharge: { min: 6, max: 6 },
        uses: { count: 1, period: 'day' as const },
      },
      {
        kind: 'special',
        name: 'No Usage',
        description: 'At will.',
      },
    ],
    bonusActions: [],
  },
  lore: {},
} as unknown as Monster

describe('combat simulation monster action helpers', () => {
  describe('buildMonsterExecutableActions usage (special recharge / uses)', () => {
    it('maps natural actions to undefined usage', () => {
      const actions = buildMonsterExecutableActions(MONSTER_USAGE_MATRIX, {})
      const claw = actions.find((a) => a.label === 'Claw')
      expect(claw?.usage).toBeUndefined()
    })

    it('maps recharge-only special actions', () => {
      const actions = buildMonsterExecutableActions(MONSTER_USAGE_MATRIX, {})
      const breath = actions.find((a) => a.label === 'Recharge Breath')
      expect(breath?.usage).toEqual({
        recharge: { min: 5, max: 6, ready: true },
        uses: undefined,
      })
    })

    it('maps uses-only special actions', () => {
      const actions = buildMonsterExecutableActions(MONSTER_USAGE_MATRIX, {})
      const hex = actions.find((a) => a.label === 'Limited Hex')
      expect(hex?.usage).toEqual({
        recharge: undefined,
        uses: { max: 2, remaining: 2, period: 'day' },
      })
    })

    it('maps special actions with both recharge and uses', () => {
      const actions = buildMonsterExecutableActions(MONSTER_USAGE_MATRIX, {})
      const both = actions.find((a) => a.label === 'Recharge And Uses')
      expect(both?.usage).toEqual({
        recharge: { min: 6, max: 6, ready: true },
        uses: { max: 1, remaining: 1, period: 'day' },
      })
    })

    it('maps at-will specials without recharge or uses to undefined usage', () => {
      const actions = buildMonsterExecutableActions(MONSTER_USAGE_MATRIX, {})
      const atWill = actions.find((a) => a.label === 'No Usage')
      expect(atWill?.usage).toBeUndefined()
    })
  })

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
        resolutionMode: 'attack-roll',
        attackProfile: expect.objectContaining({
          attackBonus: 4,
          damage: '1d6 + 2',
          damageType: 'piercing',
        }),
      }),
      expect.objectContaining({
        label: 'Acid Spit',
        resolutionMode: 'attack-roll',
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
        resolutionMode: 'attack-roll',
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

  it('seeds recharge and limited-use metadata for executable monster special actions', () => {
    const monster = {
      id: 'usage-test-monster',
      name: 'Usage Test Monster',
      mechanics: {
        hitPoints: { count: 2, die: 8 },
        armorClass: { kind: 'fixed', value: 12 },
        movement: { ground: 30 },
        actions: [
          {
            kind: 'special',
            name: 'Fire Breath',
            description: 'Each creature in a cone must make a saving throw.',
            save: { ability: 'dex', dc: 13 },
            damage: '4d6',
            damageType: 'fire',
            target: 'creatures-in-area',
            recharge: { min: 5, max: 6 },
            uses: { count: 1, period: 'day' },
          },
        ],
        bonusActions: [],
      },
      lore: {},
    } as unknown as Monster

    const actions = buildMonsterExecutableActions(monster, {})

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Fire Breath',
        usage: {
          recharge: {
            min: 5,
            max: 6,
            ready: true,
          },
          uses: {
            max: 1,
            remaining: 1,
            period: 'day',
          },
        },
      }),
    )
  })

  it('preserves movement-targeting metadata for containment-style monster actions', () => {
    const monster = {
      id: 'cube-test-monster',
      name: 'Gelatinous Cube',
      mechanics: {
        hitPoints: { count: 2, die: 8 },
        armorClass: { kind: 'fixed', value: 12 },
        movement: { ground: 15 },
        actions: [
          {
            kind: 'special',
            name: 'Engulf',
            description: 'The cube moves through creature spaces and engulfs them.',
            target: 'creatures-entered-during-move',
            movement: {
              upToSpeed: true,
              noOpportunityAttacks: true,
              canEnterCreatureSpaces: true,
              targetSizeMax: 'large',
            },
            save: { ability: 'dex', dc: 12 },
            onFail: [{ kind: 'state', stateId: 'engulfed' }],
          },
        ],
        bonusActions: [],
      },
      lore: {},
    } as unknown as Monster

    const actions = buildMonsterExecutableActions(monster, {})

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Engulf',
        targeting: { kind: 'entered-during-move' },
        movement: {
          upToSpeed: true,
          noOpportunityAttacks: true,
          canEnterCreatureSpaces: true,
          targetSizeMax: 'large',
        },
      }),
    )
  })
})
