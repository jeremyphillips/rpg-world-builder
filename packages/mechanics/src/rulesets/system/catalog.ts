/**
 * System catalog — the full, unfiltered set of game resources and system
 * ruleset defaults.
 *
 * Game resources are the "base library" that rulesets filter/override via
 * ContentPolicy.  System rulesets are code-defined defaults that campaign
 * patches are applied on top of via `resolveCampaignRuleset`.
 *
 * Client: `loadSystemCatalog()` loads spell/monster sub-chunks in parallel.
 * Server/tests: import `systemCatalog` from `./catalog.sync`.
 */
import { DEFAULT_SYSTEM_RULESET_ID } from '../ids/systemIds'
import { buildSystemCatalogBase, type CampaignCatalog } from './catalogBase'

export {
  getSystemRuleset,
  SYSTEM_RULESETS,
  startingWealthTiersDefault,
} from './systemRulesets'

export { buildSystemCatalogBase, systemCatalogCore, type CampaignCatalog } from './catalogBase'

// ---------------------------------------------------------------------------
// Async catalog loader (client — spells + monsters in separate chunks)
// ---------------------------------------------------------------------------

function keyBy<T extends { id: string }>(items: readonly T[]): Record<string, T> {
  const map: Record<string, T> = {}
  for (const item of items) {
    map[item.id] = item
  }
  return map
}

let loadPromise: Promise<CampaignCatalog> | null = null

/** Deduped loader: core catalog sync, spells/monsters via dynamic import. */
export function loadSystemCatalog(): Promise<CampaignCatalog> {
  if (!loadPromise) {
    loadPromise = Promise.all([
      import('./spells'),
      import('./monsters'),
    ]).then(([spellsMod, monstersMod]) => {
      const base = buildSystemCatalogBase()
      const spells = spellsMod.getSystemSpells(DEFAULT_SYSTEM_RULESET_ID)
      const monsters = monstersMod.getSystemMonsters(DEFAULT_SYSTEM_RULESET_ID)
      return {
        ...base,
        spellsById: keyBy(spells),
        monstersById: keyBy(monsters),
      }
    })
  }
  return loadPromise
}
