/**
 * Build a campaign-specific catalog by merging system + campaign content and
 * then applying the Ruleset's ContentRules.
 *
 * For each content category the logic is:
 *   1. Merge: system entries + campaign entries (campaign wins on id collision)
 *   2. Merge custom entries into allById (so they participate in allow/deny)
 *   3. Compute allowedSet via getAllowedSet(rule, allIds)
 *   4. Build allowedById: filter allById by allowedSet, apply overrides
 *
 * Output:
 *   - Filtered view (*ById, *Ids): used by pickers/players (allowed only)
 *   - Admin view (*AllById, *AllowedIds): used by list pages for allowedInCampaign
 *
 * TODO: Add unit test file (e.g. buildCampaignCatalog.test.ts) to validate:
 *   - all_except excludes ids properly
 *   - only includes ids properly
 *   - custom entries appear in allById AND can be excluded by rules
 *   - campaign overrides system on id collision in allById and allowedById
 */
import type { CampaignCatalog } from './systemCatalog'
import type { RulesetLike } from './ruleset.types'
import type { ContentRule, RulesetContent } from '@/shared/types/ruleset'
import { getAllowedSet } from '@/features/content/domain/contentPolicy'

// ---------------------------------------------------------------------------
// Catalog category config
// ---------------------------------------------------------------------------

export type CatalogCategoryConfig = {
  /** Category key for logging */
  key: string
  /** Which ruleset.content rule to apply (e.g. c.races, c.equipment) */
  ruleKey: keyof RulesetContent
  /** System/campaign field name in CampaignCatalog (e.g. racesById) */
  byIdField: keyof CampaignCatalog
  /** Id list field name for filtered output (e.g. raceIds) — omit if category has no ids field */
  idsField?: keyof CampaignCatalog
}

export const CATALOG_CATEGORY_CONFIG: CatalogCategoryConfig[] = [
  { key: 'classes', ruleKey: 'classes', byIdField: 'classesById', idsField: 'classIds' },
  { key: 'races', ruleKey: 'races', byIdField: 'racesById', idsField: 'raceIds' },
  { key: 'weapons', ruleKey: 'equipment', byIdField: 'weaponsById' },
  { key: 'armor', ruleKey: 'equipment', byIdField: 'armorById' },
  { key: 'gear', ruleKey: 'equipment', byIdField: 'gearById' },
  { key: 'magicItems', ruleKey: 'equipment', byIdField: 'magicItemsById' },
  { key: 'enhancements', ruleKey: 'equipment', byIdField: 'enhancementsById' },
  { key: 'spells', ruleKey: 'spells', byIdField: 'spellsById' },
  { key: 'monsters', ruleKey: 'monsters', byIdField: 'monstersById' },
]
// skillProficienciesById is system-only; add to config when campaign support is added

// ---------------------------------------------------------------------------
// Extended catalog type (admin fields)
// ---------------------------------------------------------------------------

export type CampaignCatalogAdmin = CampaignCatalog & {
  classesAllById?: Record<string, CampaignCatalog['classesById'][string]>
  classAllowedIds?: string[]
  racesAllById?: Record<string, CampaignCatalog['racesById'][string]>
  raceAllowedIds?: string[]
  weaponsAllById?: Record<string, CampaignCatalog['weaponsById'][string]>
  weaponAllowedIds?: string[]
  armorAllById?: Record<string, CampaignCatalog['armorById'][string]>
  armorAllowedIds?: string[]
  gearAllById?: Record<string, CampaignCatalog['gearById'][string]>
  gearAllowedIds?: string[]
  magicItemsAllById?: Record<string, CampaignCatalog['magicItemsById'][string]>
  magicItemAllowedIds?: string[]
  enhancementsAllById?: Record<string, CampaignCatalog['enhancementsById'][string]>
  enhancementAllowedIds?: string[]
  spellsAllById?: Record<string, CampaignCatalog['spellsById'][string]>
  spellAllowedIds?: string[]
  monstersAllById?: Record<string, CampaignCatalog['monstersById'][string]>
  monsterAllowedIds?: string[]
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Shallow-merge override fields onto a base entry. */
function applyOverride<T extends Record<string, unknown>>(
  base: T,
  patch: Record<string, unknown>,
): T {
  return { ...base, ...patch } as T
}

/**
 * Build allById (merged system+campaign+custom), allowedSet, and allowedById
 * for a single content category.
 *
 * Flow:
 *   1. allById = merge system + campaign
 *   2. Merge rule.custom into allById (custom participates in allow/deny)
 *   3. allowedSet = getAllowedSet(rule, Object.keys(allById))
 *   4. allowedById = filter allById by allowedSet, apply overrides to survivors
 */
function resolveCategory<T extends { id: string }>(
  key: string,
  systemById: Record<string, T> | undefined,
  campaignById: Record<string, T> | undefined,
  rule: ContentRule | undefined,
): {
  allById: Record<string, T>
  allowedSet: Set<string>
  allowedById: Record<string, T>
} {
  if (!systemById) {
    console.warn(`[buildCampaignCatalog] Missing system map for "${key}"`)
    return { allById: {}, allowedSet: new Set(), allowedById: {} }
  }

  // 1. Merge system + campaign (campaign wins on collision)
  let allById: Record<string, T> = campaignById
    ? { ...systemById, ...campaignById }
    : { ...systemById }

  // 2. Merge custom into allById so custom entries participate in allow/deny
  if (rule?.custom) {
    for (const [id, entry] of Object.entries(rule.custom)) {
      allById[id] = entry as T
    }
  }

  const allIds = Object.keys(allById)

  // 3. Compute allowed set
  const allowedSet = getAllowedSet(rule, allIds)

  // 4. Build allowedById: filter by allowedSet, apply overrides
  const allowedById: Record<string, T> = {}
  for (const id of allIds) {
    if (!allowedSet.has(id)) continue
    let entry = allById[id]
    if (rule?.overrides?.[id]) {
      entry = applyOverride(entry, rule.overrides[id] as Record<string, unknown>)
    }
    allowedById[id] = entry
  }

  return { allById, allowedSet, allowedById }
}

const BY_ID_TO_SINGULAR: Record<string, string> = {
  classesById: 'class',
  racesById: 'race',
  weaponsById: 'weapon',
  armorById: 'armor',
  gearById: 'gear',
  magicItemsById: 'magicItem',
  enhancementsById: 'enhancement',
  spellsById: 'spell',
  monstersById: 'monster',
}

function getAdminFieldNames(byIdField: string): { allByIdField: string; allowedIdsField: string } {
  const base = byIdField.replace(/ById$/, '')
  const singular = BY_ID_TO_SINGULAR[byIdField] ?? base
  return {
    allByIdField: `${base}AllById`,
    allowedIdsField: `${singular}AllowedIds`,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildCampaignCatalog(
  system: CampaignCatalog,
  campaign: Partial<CampaignCatalog>,
  ruleset: RulesetLike,
): CampaignCatalogAdmin {
  const c = ruleset.content as RulesetContent
  const result: Record<string, unknown> = {
    skillProficienciesById: system.skillProficienciesById,
  }

  for (const config of CATALOG_CATEGORY_CONFIG) {
    const systemById = system[config.byIdField] as Record<string, { id: string }> | undefined
    const campaignById = campaign[config.byIdField] as Record<string, { id: string }> | undefined
    const rule = c[config.ruleKey] as ContentRule | undefined

    const { allById, allowedSet, allowedById } = resolveCategory(
      config.key,
      systemById,
      campaignById,
      rule,
    )

    result[config.byIdField] = allowedById
    if (config.idsField) {
      result[config.idsField] = Object.keys(allowedById)
    }

    const { allByIdField, allowedIdsField } = getAdminFieldNames(config.byIdField)
    result[allByIdField] = allById
    result[allowedIdsField] = Array.from(allowedSet)
  }

  return result as CampaignCatalogAdmin
}
