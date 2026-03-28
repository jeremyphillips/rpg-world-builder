import { describe, expect, it } from 'vitest'
import {
  SKILL_PROFICIENCY_COMBAT_UI_ACTION_IDS,
  type SkillProficiencyCombatUi,
} from '@/features/content/skillProficiencies/domain/types'
import { DEFAULT_SYSTEM_RULESET_ID } from '../ids/systemIds'
import {
  getSystemSkillProficiency,
  getSystemSkillProficiencies,
  SKILL_PROFICIENCIES_RAW,
} from './skillProficiencies'

describe('system skill proficiencies', () => {
  it('Stealth opts into Hide via combatUi', () => {
    const stealth = SKILL_PROFICIENCIES_RAW.find((s) => s.id === 'stealth')
    expect(stealth).toBeDefined()
    expect(stealth!.combatUi).toEqual({ actionId: 'hide' })

    const mapped = getSystemSkillProficiency(DEFAULT_SYSTEM_RULESET_ID, 'stealth')
    expect(mapped?.combatUi).toEqual({ actionId: 'hide' })
  })

  it('skills without combatUi remain valid and omit the field', () => {
    const without = SKILL_PROFICIENCIES_RAW.filter((s) => s.id !== 'stealth')
    expect(without.length).toBeGreaterThan(0)
    for (const s of without) {
      expect(s).not.toHaveProperty('combatUi')
    }

    expect(getSystemSkillProficiency(DEFAULT_SYSTEM_RULESET_ID, 'athletics')?.combatUi).toBeUndefined()
  })

  it('only Stealth currently opts into combatUi in the system catalog', () => {
    const withUi = getSystemSkillProficiencies(DEFAULT_SYSTEM_RULESET_ID).filter((s) => s.combatUi != null)
    expect(withUi).toHaveLength(1)
    expect(withUi[0]!.id).toBe('stealth')
  })

  it('allowed combatUi action ids are the canonical affordance list', () => {
    expect(SKILL_PROFICIENCY_COMBAT_UI_ACTION_IDS).toEqual(['hide'])
    const sample: SkillProficiencyCombatUi = { actionId: 'hide' }
    expect(sample.actionId).toBe('hide')
  })
})
