import type { Monster } from '@/features/content/monsters/domain/types'
import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import { assertSystemRulesetId } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import { createDefaultCampaignRulesetPatch } from '@/features/mechanics/domain/rulesets/campaign/repo'
import { normalizeCampaignRulesetPatch } from '@/features/mechanics/domain/rulesets/campaign/patch/normalize'
import { resolveCampaignRuleset } from '@/features/mechanics/domain/rulesets/resolve/ruleset'
import { buildCampaignCatalog, type CampaignCatalogAdmin } from '@/features/mechanics/domain/rulesets/campaign/buildCatalog'
import { getSystemRuleset, systemCatalog } from '@/features/mechanics/domain/rulesets/system/catalog'
import type { CampaignRulesetPatch } from '@/features/mechanics/domain/rulesets/types/ruleset.types'
import type { Ruleset } from '@/shared/types/ruleset'

import { getPatchByCampaignId } from '../../campaign/services/rulesetPatch.service'
import * as monstersService from '../../content/monsters/services/monsters.service'
import * as spellsService from '../../content/spells/services/spells.service'

function keyById<T extends { id: string }>(items: readonly T[]): Record<string, T> {
  const map: Record<string, T> = {}
  for (const item of items) map[item.id] = item
  return map
}

function campaignMonsterDocToMonster(d: monstersService.CampaignMonsterDoc): Monster {
  const data = d.data ?? {}
  return {
    id: d.monsterId,
    name: d.name,
    ...data,
    source: 'campaign',
    campaignId: d.campaignId,
    accessPolicy: d.accessPolicy,
  } as Monster
}

function campaignSpellDocToSpell(d: spellsService.CampaignSpellDoc): Spell {
  return {
    id: d.spellId,
    name: d.name,
    description: d.description,
    imageKey: d.imageKey,
    school: d.school,
    level: d.level,
    classes: d.classes,
    ritual: d.ritual,
    concentration: d.concentration,
    effects: d.effects as Spell['effects'],
  } as Spell
}

/**
 * Resolves campaign ruleset + merged catalog (system + campaign monsters/spells) for mechanics.
 * Intentionally mirrors client `CampaignRulesProvider` + `loadCampaignCatalogOverrides` at a smaller scope.
 */
export async function resolveCampaignRulesAndCatalogForGameSession(
  campaignId: string,
): Promise<{ ruleset: Ruleset; catalog: CampaignCatalogAdmin }> {
  const patchDoc = await getPatchByCampaignId(campaignId)
  const rawPatch: CampaignRulesetPatch = patchDoc
    ? (patchDoc as unknown as CampaignRulesetPatch)
    : createDefaultCampaignRulesetPatch(campaignId)

  assertSystemRulesetId(rawPatch.systemId)
  const system = getSystemRuleset(rawPatch.systemId)
  const normalized = normalizeCampaignRulesetPatch(rawPatch)
  const ruleset = resolveCampaignRuleset(system, normalized)

  const [monsterDocs, spellDocs] = await Promise.all([
    monstersService.listByCampaign(campaignId),
    spellsService.listByCampaign(campaignId),
  ])

  const campaignMonsters = monsterDocs.map(campaignMonsterDocToMonster)
  const campaignSpells = spellDocs.map(campaignSpellDocToSpell)

  const overrides: Parameters<typeof buildCampaignCatalog>[1] = {}
  if (campaignMonsters.length > 0) {
    overrides.monstersById = keyById(campaignMonsters)
  }
  if (campaignSpells.length > 0) {
    overrides.spellsById = keyById(campaignSpells)
  }

  const catalog = buildCampaignCatalog(systemCatalog, overrides, ruleset)
  return { ruleset, catalog }
}
