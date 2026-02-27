/**
 * Build a campaign-specific catalog by merging system + campaign content and
 * then applying the Ruleset's ContentRules.
 *
 * For each content category the logic is:
 *   1. Merge: system entries + campaign entries (campaign wins on id collision)
 *   2. Filter by policy ("all_except" / "only")
 *   3. Apply `overrides` (shallow merge per entry)
 *   4. Merge `custom` entries from the ruleset itself (custom wins on id collision)
 */
import type { CampaignCatalog } from './systemCatalog'
import type { Ruleset, ContentRule } from '@/data/ruleSets'

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
 * Filter + override + merge custom for a single content category.
 *
 * @param systemById  The full system map for this category
 * @param rule        The ruleset's ContentRule (may be undefined → allow all)
 */
function applyContentRule<T extends { id: string }>(
  systemById: Record<string, T>,
  rule: ContentRule | undefined,
): Record<string, T> {
  if (!rule) return { ...systemById };

  let result: Record<string, T>;

  if (rule.policy === 'only') {
    result = {};
    for (const id of rule.ids) {
      const entry = systemById[id];
      if (entry) result[id] = entry;
    }
  } else {
    const excluded = new Set(rule.ids);
    result = {};
    for (const [id, entry] of Object.entries(systemById)) {
      if (!excluded.has(id)) result[id] = entry;
    }
  }

  if (rule.overrides) {
    for (const [id, patch] of Object.entries(rule.overrides)) {
      if (result[id]) {
        result[id] = applyOverride(result[id], patch as Record<string, unknown>);
      }
    }
  }

  if (rule.custom) {
    for (const [id, entry] of Object.entries(rule.custom)) {
      result[id] = entry as T;
    }
  }

  return result;
}

/**
 * Merge system + campaign entries, then apply content rules.
 *
 * Campaign entries override system entries on id collision.
 */
function resolveContent<T extends { id: string }>(
  systemById: Record<string, T>,
  campaignById: Record<string, T> | undefined,
  rule: ContentRule | undefined,
): Record<string, T> {
  const merged = campaignById
    ? { ...systemById, ...campaignById }
    : systemById;
  return applyContentRule(merged, rule);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildCampaignCatalog(
  system: CampaignCatalog,
  campaign: Partial<CampaignCatalog>,
  ruleset: Ruleset,
): CampaignCatalog {
  const c = ruleset.content;

  const classesById = resolveContent(system.classesById, campaign.classesById, c.classes);
  const racesById   = resolveContent(system.racesById,   campaign.racesById,   c.races);

  return {
    classesById,
    classIds:                 Object.keys(classesById),
    racesById,
    raceIds:                  Object.keys(racesById),
    weaponsById:              resolveContent(system.weaponsById,              campaign.weaponsById,              c.equipment),
    armorById:                resolveContent(system.armorById,                campaign.armorById,                c.equipment),
    gearById:                 resolveContent(system.gearById,                 campaign.gearById,                 c.equipment),
    magicItemsById:           resolveContent(system.magicItemsById,           campaign.magicItemsById,           c.equipment),
    enhancementTemplatesById: resolveContent(system.enhancementTemplatesById, campaign.enhancementTemplatesById, c.equipment),
    spellsById:               resolveContent(system.spellsById,              campaign.spellsById,               c.spells),
    monstersById:             resolveContent(system.monstersById,             campaign.monstersById,             c.monsters),
  };
}
