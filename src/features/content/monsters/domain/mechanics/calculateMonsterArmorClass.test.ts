import { describe, expect, it } from 'vitest'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { CreatureArmorCatalogEntry } from '@/features/mechanics/domain/equipment/armorClass'
import { calculateMonsterArmorClass } from './calculateMonsterArmorClass'

function buildArmorById(): Record<string, CreatureArmorCatalogEntry> {
  return {
    leather: {
      id: 'leather',
      name: 'Leather',
      category: 'light',
      baseAC: 11,
      dex: { mode: 'full' },
    },
    'chain-shirt': {
      id: 'chain-shirt',
      name: 'Chain Shirt',
      category: 'medium',
      baseAC: 13,
      dex: { mode: 'capped', maxBonus: 2 },
    },
    hide: {
      id: 'hide',
      name: 'Hide',
      category: 'medium',
      baseAC: 12,
      dex: { mode: 'capped', maxBonus: 2 },
    },
    plate: {
      id: 'plate',
      name: 'Plate',
      category: 'heavy',
      baseAC: 18,
      dex: { mode: 'none' },
    },
    'shield-wood': {
      id: 'shield-wood',
      name: 'Shield (Wood)',
      category: 'shields',
      acBonus: 2,
      dex: { mode: 'none' },
    },
    'shield-steel': {
      id: 'shield-steel',
      name: 'Shield (Steel)',
      category: 'shields',
      acBonus: 3,
      dex: { mode: 'none' },
    },
  }
}

function buildMonsterMechanics(
  overrides: Partial<Monster['mechanics']>,
): Pick<Monster, 'mechanics'> {
  return {
    mechanics: {
      hitPoints: { count: 2, die: 8 },
      armorClass: { kind: 'natural', base: 10 },
      movement: { ground: 30 },
      abilities: {
        strength: 10,
        dexterity: 14,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      proficiencyBonus: 2,
      ...overrides,
    },
  }
}

describe('calculateMonsterArmorClass', () => {
  const armorById = buildArmorById()

  it('resolves wrapped equipment armor using the wrapped armor id and ac modifier', () => {
    const monster = buildMonsterMechanics({
      armorClass: { kind: 'equipment', armorRefs: ['scraps'] },
      equipment: {
        armor: {
          scraps: {
            armorId: 'chain-shirt',
            acModifier: -2,
          },
        },
      },
      abilities: {
        strength: 10,
        dexterity: 16,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
    })

    const result = calculateMonsterArmorClass(monster, armorById)

    expect(result.value).toBe(13)
    expect(result.breakdown.bodyArmor?.id).toBe('chain-shirt')
    expect(result.breakdown.bodyArmor?.refId).toBe('scraps')
  })

  it('degrades safely when armor ids are unresolved', () => {
    const monster = buildMonsterMechanics({
      armorClass: { kind: 'equipment', armorRefs: ['missing'] },
    })

    const result = calculateMonsterArmorClass(monster, armorById)

    expect(result.value).toBe(12)
    expect(result.breakdown.bodyArmor).toBeUndefined()
  })

  it('chooses the highest body armor and shield contribution by type', () => {
    const monster = buildMonsterMechanics({
      armorClass: {
        kind: 'equipment',
        armorRefs: ['hide-wrap', 'plate-wrap', 'wood-shield', 'steel-shield'],
      },
      equipment: {
        armor: {
          'hide-wrap': { armorId: 'hide' },
          'plate-wrap': { armorId: 'plate' },
          'wood-shield': { armorId: 'shield-wood' },
          'steel-shield': { armorId: 'shield-steel' },
        },
      },
      abilities: {
        strength: 10,
        dexterity: 18,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
    })

    const result = calculateMonsterArmorClass(monster, armorById)

    expect(result.value).toBe(21)
    expect(result.breakdown.bodyArmor?.id).toBe('plate')
    expect(result.breakdown.shieldArmor?.id).toBe('shield-steel')
  })

  it('defaults natural armor without a base to 10 plus dexterity modifier', () => {
    const monster = buildMonsterMechanics({
      armorClass: { kind: 'natural' },
    })

    expect(calculateMonsterArmorClass(monster, armorById).value).toBe(12)
  })

  it('lets override armor class win over equipment and dexterity', () => {
    const monster = buildMonsterMechanics({
      armorClass: {
        kind: 'equipment',
        armorRefs: ['plate-wrap'],
        override: 17,
      },
      equipment: {
        armor: {
          'plate-wrap': { armorId: 'plate' },
        },
      },
    })

    expect(calculateMonsterArmorClass(monster, armorById).value).toBe(17)
  })

  it('supports fixed armor class directly', () => {
    const monster = buildMonsterMechanics({
      armorClass: { kind: 'fixed', value: 19 },
    })

    const result = calculateMonsterArmorClass(monster, armorById)

    expect(result.value).toBe(19)
    expect(result.breakdown.parts).toEqual([{ kind: 'override', label: 'Fixed', value: 19 }])
  })
})
