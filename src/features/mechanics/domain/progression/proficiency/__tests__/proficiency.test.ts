import { describe, expect, it } from 'vitest'

import type { Ruleset } from '@/shared/types/ruleset'
import { CHARACTER_PROFICIENCY_BONUS_TABLE } from '../proficiencyBonusTable'
import { resolveProficiencyBonusAtLevel } from '../resolveProficiencyBonusAtLevel'
import { resolveProficiencyContribution } from '../resolveProficiencyContribution'
import { resolveCharacterProficiencyBonus } from '../resolveCharacterProficiencyBonus'

const TEST_RULESET = {
  mechanics: {
    progression: {
      proficiencyBonusTable: CHARACTER_PROFICIENCY_BONUS_TABLE,
    },
  },
} as unknown as Ruleset

describe('resolveProficiencyBonusAtLevel', () => {
  it('returns 0 for level 0 or below', () => {
    expect(resolveProficiencyBonusAtLevel({ level: 0, ruleset: TEST_RULESET })).toBe(0)
    expect(resolveProficiencyBonusAtLevel({ level: -1, ruleset: TEST_RULESET })).toBe(0)
  })

  it('returns +2 for levels 1–4', () => {
    expect(resolveProficiencyBonusAtLevel({ level: 1, ruleset: TEST_RULESET })).toBe(2)
    expect(resolveProficiencyBonusAtLevel({ level: 4, ruleset: TEST_RULESET })).toBe(2)
  })

  it('returns +3 for levels 5–8', () => {
    expect(resolveProficiencyBonusAtLevel({ level: 5, ruleset: TEST_RULESET })).toBe(3)
    expect(resolveProficiencyBonusAtLevel({ level: 8, ruleset: TEST_RULESET })).toBe(3)
  })

  it('returns +6 for levels 17–20', () => {
    expect(resolveProficiencyBonusAtLevel({ level: 17, ruleset: TEST_RULESET })).toBe(6)
    expect(resolveProficiencyBonusAtLevel({ level: 20, ruleset: TEST_RULESET })).toBe(6)
  })

  it('falls back to formula when no table is defined', () => {
    const noTableRuleset = {
      mechanics: { progression: {} },
    } as unknown as Ruleset

    expect(resolveProficiencyBonusAtLevel({ level: 1, ruleset: noTableRuleset })).toBe(2)
    expect(resolveProficiencyBonusAtLevel({ level: 5, ruleset: noTableRuleset })).toBe(3)
    expect(resolveProficiencyBonusAtLevel({ level: 17, ruleset: noTableRuleset })).toBe(6)
  })
})

describe('resolveProficiencyContribution', () => {
  it('multiplies bonus by level', () => {
    expect(resolveProficiencyContribution(2, 1)).toBe(2)
    expect(resolveProficiencyContribution(3, 2)).toBe(6)
    expect(resolveProficiencyContribution(4, 1)).toBe(4)
  })

  it('returns 0 when proficiency level is 0', () => {
    expect(resolveProficiencyContribution(3, 0)).toBe(0)
  })
})

describe('resolveCharacterProficiencyBonus', () => {
  it('sums class levels and resolves from table', () => {
    const result = resolveCharacterProficiencyBonus({
      classEntries: [{ level: 3 }, { level: 2 }],
      ruleset: TEST_RULESET,
    })
    expect(result).toBe(3)
  })

  it('handles a single class', () => {
    const result = resolveCharacterProficiencyBonus({
      classEntries: [{ level: 1 }],
      ruleset: TEST_RULESET,
    })
    expect(result).toBe(2)
  })

  it('returns 0 for empty class entries', () => {
    const result = resolveCharacterProficiencyBonus({
      classEntries: [],
      ruleset: TEST_RULESET,
    })
    expect(result).toBe(0)
  })
})
