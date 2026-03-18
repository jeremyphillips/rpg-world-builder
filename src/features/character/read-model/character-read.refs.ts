/**
 * Character read-model reference loaders.
 * Batch-loads reference data for race, class, subclass, proficiencies, equipment.
 */

import { abilityIdToKey } from '@/features/mechanics/domain/character'
import { getSystemRaces } from '@/features/mechanics/domain/rulesets/system/races'
import { getSystemClasses } from '@/features/mechanics/domain/rulesets/system/classes'
import { getSystemSkillProficiencies } from '@/features/mechanics/domain/rulesets/system/skillProficiencies'
import { getSystemArmor } from '@/features/mechanics/domain/rulesets/system/armor'
import { getSystemWeapons } from '@/features/mechanics/domain/rulesets/system/weapons'
import { getSystemGear } from '@/features/mechanics/domain/rulesets/system/gear'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import type {
  CharacterReadReferences,
  ClassProgressionSummary,
  IdNameSummary,
  LoadCharacterReadReferencesArgs,
} from './character-read.types'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toIdNameMap<T extends { id: string; name: string }>(
  records: readonly T[],
): Map<string, IdNameSummary> {
  const map = new Map<string, IdNameSummary>()
  for (const r of records) {
    map.set(r.id, { id: r.id, name: r.name })
  }
  return map
}

function loadIdNameRecords(): {
  races: ReturnType<typeof getSystemRaces>
  classes: ReturnType<typeof getSystemClasses>
  proficiencies: ReturnType<typeof getSystemSkillProficiencies>
  armor: ReturnType<typeof getSystemArmor>
  weapons: ReturnType<typeof getSystemWeapons>
  gear: ReturnType<typeof getSystemGear>
} {
  return {
    races: getSystemRaces(DEFAULT_SYSTEM_RULESET_ID),
    classes: getSystemClasses(DEFAULT_SYSTEM_RULESET_ID),
    proficiencies: getSystemSkillProficiencies(DEFAULT_SYSTEM_RULESET_ID),
    armor: getSystemArmor(DEFAULT_SYSTEM_RULESET_ID),
    weapons: getSystemWeapons(DEFAULT_SYSTEM_RULESET_ID),
    gear: getSystemGear(DEFAULT_SYSTEM_RULESET_ID),
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load reference data for character read endpoints.
 * Collects IDs from characters, batch-fetches catalog data, and returns typed lookup maps.
 * Use for GET /characters/me, GET /characters/:id, GET /characters/available-for-campaign, campaign roster.
 */
export async function loadCharacterReadReferences(
  args: LoadCharacterReadReferencesArgs,
): Promise<CharacterReadReferences> {
  const { include = {} } = args
  const includeProficiencies = include.proficiencies ?? false
  const includeItems = include.items ?? false
  const includeClassProgression = include.classProgression ?? false

  const catalog = loadIdNameRecords()

  const raceById = toIdNameMap(catalog.races)
  const classById = new Map<string, IdNameSummary>()
  const subclassById = new Map<string, IdNameSummary>()
  const classProgressionById = new Map<string, ClassProgressionSummary>()
  for (const c of catalog.classes) {
    classById.set(c.id, { id: c.id, name: c.name })
    const opts = c.definitions?.options ?? []
    for (const opt of opts) {
      if (opt.id && opt.name) subclassById.set(opt.id, { id: opt.id, name: opt.name })
    }
    if (includeClassProgression && c.progression) {
      const p = c.progression
      classProgressionById.set(c.id, {
        hitDie: p.hitDie,
        spellcasting: p.spellcasting,
        spellProgression: p.spellProgression
          ? {
              ability: p.spellProgression.ability
                ? abilityIdToKey(p.spellProgression.ability)
                : undefined,
              type: p.spellProgression.type,
            }
          : undefined,
        attackProgression: p.attackProgression,
        savingThrows: p.savingThrows?.map((id) => abilityIdToKey(id)),
      })
    }
  }

  const proficiencyById = includeProficiencies
    ? toIdNameMap(catalog.proficiencies)
    : new Map<string, IdNameSummary>()

  const itemById = includeItems ? new Map<string, IdNameSummary>() : new Map<string, IdNameSummary>()
  if (includeItems) {
    for (const a of catalog.armor) itemById.set(a.id, { id: a.id, name: a.name })
    for (const w of catalog.weapons) itemById.set(w.id, { id: w.id, name: w.name })
    for (const g of catalog.gear) itemById.set(g.id, { id: g.id, name: g.name })
  }

  return {
    raceById,
    classById,
    subclassById,
    classProgressionById,
    proficiencyById,
    itemById,
  }
}
