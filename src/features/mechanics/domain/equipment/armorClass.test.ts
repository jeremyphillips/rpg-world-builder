import { describe, expect, it } from 'vitest'
import {
  calculateCreatureArmorClass,
  getCreatureArmorFormulaDefinition,
  type CreatureArmorInput,
} from './armorClass'

describe('creatureArmorClass', () => {
  it('uses armor dex content shape instead of category fallback', () => {
    const formula = getCreatureArmorFormulaDefinition({
      id: 'custom-light',
      name: 'Custom Light',
      category: 'light',
      baseAC: 13,
      dex: { mode: 'none' },
    })

    expect(formula).toEqual({ base: 13 })
  })

  it('chooses the highest valid body armor and shield by type', () => {
    const armors: CreatureArmorInput[] = [
      {
        id: 'leather',
        name: 'Leather',
        category: 'light',
        baseAC: 11,
        dex: { mode: 'full' },
      },
      {
        id: 'breastplate',
        name: 'Breastplate',
        category: 'medium',
        baseAC: 14,
        dex: { mode: 'capped', maxBonus: 2 },
      },
      {
        id: 'shield-wood',
        name: 'Shield (Wood)',
        category: 'shields',
        acBonus: 2,
        dex: { mode: 'none' },
      },
      {
        id: 'shield-steel',
        name: 'Shield (Steel)',
        category: 'shields',
        acBonus: 3,
        dex: { mode: 'none' },
      },
    ]

    const result = calculateCreatureArmorClass({
      dexterityScore: 18,
      armors,
    })

    expect(result.value).toBe(19)
    expect(result.breakdown.bodyArmor?.id).toBe('breastplate')
    expect(result.breakdown.shieldArmor?.id).toBe('shield-steel')
    expect(result.breakdown.parts).toEqual([
      { kind: 'base', label: 'Breastplate', value: 14, sourceId: 'breastplate', refId: undefined },
      { kind: 'dex', label: 'DEX', value: 2, uncappedValue: 4, maxBonus: 2 },
      { kind: 'modifier', label: 'Shield (Steel)', value: 3, sourceId: 'shield-steel', refId: undefined },
    ])
  })
})
