import { describe, expect, it } from 'vitest'

import { validateCreatureProficiencyGroups } from './authoredCreatureProficiencies'
import {
  migrateProficiencyMapValue,
  type LegacyProficiencyMigrationReport,
} from './legacyProficiencyMigration'

describe('validateCreatureProficiencyGroups', () => {
  it('accepts valid per-group values', () => {
    expect(
      validateCreatureProficiencyGroups({
        skills: { stealth: 'expertise' },
        tools: { 'thieves-tools': 'proficient' },
        weapons: { longsword: 'proficient' },
        armor: { leather: 'proficient' },
        saves: { dex: 'proficient' },
      }),
    ).toEqual([])
  })

  it('rejects expertise on standard groups', () => {
    const e = validateCreatureProficiencyGroups({
      weapons: { longsword: 'expertise' },
    })
    expect(e.length).toBeGreaterThan(0)
    expect(e[0]!.path).toContain('weapons')
  })
})

describe('migrateProficiencyMapValue', () => {
  it('maps legacy levels for expertise groups', () => {
    const report: LegacyProficiencyMigrationReport = { invalidLegacyExpertiseInStandardGroup: [] }
    expect(migrateProficiencyMapValue('skills', 'a', { proficiencyLevel: 2 }, 'p', report)).toBe('expertise')
    expect(report.invalidLegacyExpertiseInStandardGroup).toHaveLength(0)
  })

  it('coerces standard group level 2 and reports', () => {
    const report: LegacyProficiencyMigrationReport = { invalidLegacyExpertiseInStandardGroup: [] }
    expect(migrateProficiencyMapValue('saves', 'dex', { proficiencyLevel: 2 }, 'p', report)).toBe('proficient')
    expect(report.invalidLegacyExpertiseInStandardGroup).toHaveLength(1)
  })
})
