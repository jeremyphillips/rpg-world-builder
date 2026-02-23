/**
 * Build a campaign-specific catalog by applying a Ruleset's ContentPolicies
 * to the system catalog.
 *
 * For each content category the logic is:
 *   1. `allow === true`  → pass through all system entries
 *   2. `allow` is string[] → pick only those ids
 *   3. Apply `overrides` (shallow merge per entry)
 *   4. Merge `custom` entries (custom wins on id collision)
 */
import type { CampaignCatalog } from './systemCatalog'
import type { Ruleset, ContentPolicy } from '@/data/ruleSets'

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
 * @param policy      The ruleset's ContentPolicy (may be undefined → allow all)
 */
function applyPolicy<T extends { id: string }>(
  systemById: Record<string, T>,
  policy: ContentPolicy | undefined,
): Record<string, T> {
  if (!policy || policy.allow === true) {
    // Allow all — start with a shallow copy of the system map
    const result = { ...systemById }
    if (policy?.overrides) {
      for (const [id, patch] of Object.entries(policy.overrides)) {
        if (result[id]) {
          result[id] = applyOverride(result[id], patch as Record<string, unknown>)
        }
      }
    }
    if (policy?.custom) {
      for (const [id, entry] of Object.entries(policy.custom)) {
        result[id] = entry as T
      }
    }
    return result
  }

  // Allow list — pick only specified ids
  const result: Record<string, T> = {}
  for (const id of policy.allow) {
    const entry = systemById[id]
    if (entry) result[id] = entry
  }

  if (policy.overrides) {
    for (const [id, patch] of Object.entries(policy.overrides)) {
      if (result[id]) {
        result[id] = applyOverride(result[id], patch as Record<string, unknown>)
      }
    }
  }

  if (policy.custom) {
    for (const [id, entry] of Object.entries(policy.custom)) {
      result[id] = entry as T
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildCampaignCatalog(
  system: CampaignCatalog,
  ruleset: Ruleset,
): CampaignCatalog {
  const c = ruleset.content

  return {
    classesById:              applyPolicy(system.classesById,              c.classes),
    racesById:                applyPolicy(system.racesById,                c.races),
    weaponsById:              applyPolicy(system.weaponsById,              c.equipment),
    armorById:                applyPolicy(system.armorById,                c.equipment),
    gearById:                 applyPolicy(system.gearById,                 c.equipment),
    magicItemsById:           applyPolicy(system.magicItemsById,           c.equipment),
    enhancementTemplatesById: applyPolicy(system.enhancementTemplatesById, c.equipment),
    spellsById:               applyPolicy(system.spellsById,               c.spells),
    monstersById:             applyPolicy(system.monstersById,             c.monsters),
  }
}
