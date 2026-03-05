/**
 * Skill proficiency repository — system catalog only (no campaign overrides).
 */
import type { SkillProficiency } from '@/features/content/domain/types'
import {
  getSystemSkillProficiencies,
  getSystemSkillProficiency,
} from '@/features/mechanics/domain/core/rules/systemCatalog.skillProficiencies'
import type { SystemRulesetId } from '@/features/mechanics/domain/core/rules'

function matchesSearch(name: string, search: string): boolean {
  return name.toLowerCase().includes(search.toLowerCase())
}

export const skillProficiencyRepo = {
  async listSummaries(
    _campaignId: string,
    systemId: SystemRulesetId,
    opts?: { search?: string }
  ): Promise<SkillProficiency[]> {
    const items = getSystemSkillProficiencies(systemId)
    let results = [...items]
    if (opts?.search) {
      results = results.filter((r) => matchesSearch(r.name, opts.search!))
    }
    return results.sort((a, b) => a.name.localeCompare(b.name))
  },

  async getEntry(
    _campaignId: string,
    systemId: SystemRulesetId,
    id: string
  ): Promise<SkillProficiency | null> {
    return getSystemSkillProficiency(systemId, id) ?? null
  },
}
