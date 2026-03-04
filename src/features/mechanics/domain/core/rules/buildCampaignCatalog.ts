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
import type { RulesetLike } from './ruleset.types'
import type { ContentRule } from '@/shared/types/ruleset'

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
  key: string,
  systemById: Record<string, T>,
  rule: ContentRule | undefined,
): Record<string, T> {
  if (!rule) return { ...(systemById ?? {}) };

  if (!systemById) {
    console.warn(`[applyContentRule] Missing systemById for "${key}"`);
    return {} as Record<string, T>;
  }
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
  key: string,
  systemById: Record<string, T>,
  campaignById: Record<string, T> | undefined,
  rule: ContentRule | undefined,
): Record<string, T> {
  const merged = campaignById
    ? { ...systemById, ...campaignById }
    : systemById;
  return applyContentRule(key, merged, rule);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildCampaignCatalog(
  system: CampaignCatalog,
  campaign: Partial<CampaignCatalog>,
  ruleset: RulesetLike,
): CampaignCatalog {
  // Runtime guards for debugging system.weaponsById undefined
  const systemKeys = Object.keys(system);
  const weaponsByIdVal = system.weaponsById;
  if (!weaponsByIdVal) {
    console.warn('[buildCampaignCatalog] system.weaponsById is undefined', {
      systemKeys,
      weaponsById: weaponsByIdVal,
      typeofWeaponsById: typeof weaponsByIdVal,
    });
  }

  const c = ruleset.content;

  const classesById = resolveContent('classes', system.classesById, campaign.classesById, c.classes);
  const racesById   = resolveContent('races', system.racesById,   campaign.racesById,   c.races);

  return {
    classesById,
    classIds:                 Object.keys(classesById),
    racesById,
    raceIds:                  Object.keys(racesById),
    weaponsById:              resolveContent('weapons', system.weaponsById,              campaign.weaponsById,              c.equipment),
    armorById:                resolveContent('armor', system.armorById,                campaign.armorById,                c.equipment),
    gearById:                 resolveContent('gear', system.gearById,                 campaign.gearById,                 c.equipment),
    magicItemsById:           resolveContent('magicItems', system.magicItemsById,           campaign.magicItemsById,           c.equipment),
    enhancementsById:         resolveContent('enhancementTemplates', system.enhancementsById, campaign.enhancementsById, c.equipment),
    spellsById:               resolveContent('spells', system.spellsById,              campaign.spellsById,               c.spells),
    monstersById:             resolveContent('monsters', system.monstersById,             campaign.monstersById,             c.monsters),
  };
}
