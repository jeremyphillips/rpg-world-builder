import type { CampaignCatalog } from './catalog'

/** Placeholder until async `systemCatalog` module loads; keeps ruleset resolution safe. */
export const emptyCampaignCatalog: CampaignCatalog = {
  classesById: {},
  classIds: [],
  racesById: {},
  raceIds: [],
  weaponsById: {},
  armorById: {},
  gearById: {},
  magicItemsById: {},
  enhancementsById: {},
  spellsById: {},
  skillProficienciesById: {},
  skillProficiencyIds: [],
  monstersById: {},
}
