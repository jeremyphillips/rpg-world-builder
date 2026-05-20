/**
 * Fully-evaluated system catalog for Node/server and vitest (no code-splitting).
 * Client should use `loadSystemCatalog()` from catalog.ts instead.
 */
import { getSystemSpells } from './spells'
import { getSystemMonsters } from './monsters'
import { DEFAULT_SYSTEM_RULESET_ID } from '../ids/systemIds'
import type { CampaignCatalog } from './catalogBase'
import { buildSystemCatalogBase } from './catalogBase'

function keyBy<T extends { id: string }>(items: readonly T[]): Record<string, T> {
  const map: Record<string, T> = {}
  for (const item of items) {
    map[item.id] = item
  }
  return map
}

export const systemCatalog: CampaignCatalog = {
  ...buildSystemCatalogBase(),
  spellsById: keyBy(getSystemSpells(DEFAULT_SYSTEM_RULESET_ID)),
  monstersById: keyBy(getSystemMonsters(DEFAULT_SYSTEM_RULESET_ID)),
}
