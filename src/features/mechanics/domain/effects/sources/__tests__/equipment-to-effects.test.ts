import { describe, expect, it } from 'vitest'
import { getSystemArmor } from '@/features/mechanics/domain/rulesets/system/armor'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import { resolveStat } from '@/features/mechanics/domain/resolution'
import type { EvaluationContext } from '@/features/mechanics/domain/conditions/evaluation-context.types'
import type { AbilityScoreValue } from '@/features/mechanics/domain/character'
import { getEquipmentEffects, selectActiveEquipmentEffects } from '../equipment-to-effects'

function buildArmorById() {
  return Object.fromEntries(
    getSystemArmor(DEFAULT_SYSTEM_RULESET_ID).map((armor) => [armor.id, armor]),
  )
}

function buildContext(dexterity: AbilityScoreValue): EvaluationContext {
  return {
    self: {
      id: 'test-character',
      level: 1,
      hp: 10,
      hpMax: 10,
      hitDie: 8,
      abilities: {
        strength: 10,
        dexterity,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      conditions: [],
      resources: {},
      equipment: {},
      flags: {},
    },
  }
}

describe('getEquipmentEffects character armor parity', () => {
  const armorById = buildArmorById()

  it('keeps unarmored armor class at 10 plus dexterity modifier', () => {
    const value = resolveStat('armor_class', buildContext(16), [])

    expect(value).toBe(13)
  })

  it('keeps light armor behavior at base plus full dexterity modifier', () => {
    const effects = getEquipmentEffects({ armor: ['studded-leather'] }, armorById)
    const active = selectActiveEquipmentEffects(effects, { armorId: 'studded-leather' })

    const value = resolveStat('armor_class', buildContext(16), active)

    expect(value).toBe(15)
  })

  it('keeps medium armor behavior at base plus capped dexterity modifier', () => {
    const effects = getEquipmentEffects({ armor: ['hide'] }, armorById)
    const active = selectActiveEquipmentEffects(effects, { armorId: 'hide' })

    const value = resolveStat('armor_class', buildContext(18), active)

    expect(value).toBe(14)
  })

  it('keeps heavy armor behavior at base without dexterity modifier', () => {
    const effects = getEquipmentEffects({ armor: ['plate'] }, armorById)
    const active = selectActiveEquipmentEffects(effects, { armorId: 'plate' })

    const value = resolveStat('armor_class', buildContext(18), active)

    expect(value).toBe(18)
  })

  it('keeps shield bonus as an additive modifier after armor formula selection', () => {
    const effects = getEquipmentEffects({ armor: ['hide', 'shield-wood'] }, armorById)
    const active = selectActiveEquipmentEffects(effects, {
      armorId: 'hide',
      shieldId: 'shield-wood',
    })

    const value = resolveStat('armor_class', buildContext(16), active)

    expect(value).toBe(16)
  })
})
