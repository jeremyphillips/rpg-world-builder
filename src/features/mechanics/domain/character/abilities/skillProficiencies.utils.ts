import { getSystemSkillProficiencies } from '@/features/mechanics/domain/rulesets/system/skillProficiencies'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import type { SkillProficiencyId } from '@/features/content/skillProficiencies/domain/types'

const skills = getSystemSkillProficiencies(DEFAULT_SYSTEM_RULESET_ID)
const skillProficiencyById = Object.fromEntries(skills.map((s) => [s.id, s]))

export const skillProficiencyIdToName = (id: SkillProficiencyId | string): string =>
  skillProficiencyById[id]?.name ?? id
