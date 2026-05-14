import { describe, expect, it } from 'vitest'

import type { EvaluationContext } from '../../conditions/evaluation-context.types'
import { resolveWeaponAttackBonus } from '../resolvers/attack-resolver'

function createContext(level: number, proficiencyBonus = 2): EvaluationContext {
  return {
    self: {
      id: 'test-creature',
      level,
      proficiencyBonus,
      hp: 12,
      hpMax: 12,
      abilities: {
        strength: 16,
        dexterity: 14,
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

describe('resolveWeaponAttackBonus', () => {
  it('defaults proficiency inputs to level 1 and bonus 2', () => {
    const result = resolveWeaponAttackBonus(
      createContext(9),
      { type: 'melee' },
      []
    )

    expect(result.bonus).toBe(5)
    expect(result.proficiencyMode).toBe('proficient')
    expect(result.proficiencyBonus).toBe(2)
    expect(result.proficiencyContribution).toBe(2)
    expect(result.breakdown).toEqual([
      { label: 'STR', value: '+3', type: 'ability' },
      { label: 'Prof', value: '+2', type: 'proficiency' },
    ])
  })

  it('preserves expected character attack scaling with explicit proficiency bonus', () => {
    const result = resolveWeaponAttackBonus(
      createContext(5),
      { type: 'melee' },
      [],
      { proficiencyMode: 'proficient', proficiencyBonus: 3 }
    )

    expect(result.bonus).toBe(6)
    expect(result.proficiencyContribution).toBe(3)
  })

  it('supports expertise mode for monster weapon attacks', () => {
    const result = resolveWeaponAttackBonus(
      createContext(5),
      { type: 'melee' },
      [],
      { proficiencyMode: 'expertise', proficiencyBonus: 3 }
    )

    expect(result.bonus).toBe(9)
    expect(result.proficiencyContribution).toBe(6)
    expect(result.breakdown).toEqual([
      { label: 'STR', value: '+3', type: 'ability' },
      { label: 'Prof (expertise, 3)', value: '+6', type: 'proficiency' },
    ])
  })
})
