import { describe, expect, it } from 'vitest'

import {
  normalizeStandardProficiencyIds,
  validateCreatureProficiencyGroups,
} from './authoredCreatureProficiencies'

describe('validateCreatureProficiencyGroups', () => {
  it('accepts valid per-group values', () => {
    expect(
      validateCreatureProficiencyGroups({
        skills: { stealth: 'expertise' },
        tools: { 'thieves-tools': 'proficient' },
        weapons: ['longsword'],
        armor: ['leather'],
        saves: ['dex'],
      }),
    ).toEqual([])
  })

  it('rejects non-array standard groups', () => {
    const e = validateCreatureProficiencyGroups({
      weapons: { longsword: 'proficient' },
    })
    expect(e.length).toBeGreaterThan(0)
    expect(e[0]!.path).toContain('weapons')
  })

  it('rejects invalid skill tier strings', () => {
    const e = validateCreatureProficiencyGroups({
      skills: { stealth: 'nope' },
    })
    expect(e.length).toBeGreaterThan(0)
    expect(e[0]!.path).toContain('skills')
  })
})

describe('normalizeStandardProficiencyIds', () => {
  it('dedupes array input', () => {
    expect(normalizeStandardProficiencyIds(['a', 'a', 'b'])).toEqual(['a', 'b'])
  })

  it('reads legacy proficient map keys', () => {
    expect(normalizeStandardProficiencyIds({ dex: 'proficient', str: 'proficient' })).toEqual(['dex', 'str'])
  })

  it('treats legacy proficiencyLevel >= 1 as present', () => {
    expect(normalizeStandardProficiencyIds({ wis: { proficiencyLevel: 1 } })).toEqual(['wis'])
  })
})
