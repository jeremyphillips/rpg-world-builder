import type { CreatureSizeId } from '../values/creatureSize'
import { CREATURE_SIZE_DEFINITIONS } from '../values/creatureSize'
import {
  CREATURE_SUBTYPE_DEFINITIONS,
  CREATURE_TYPE_DEFINITIONS,
  getAllowedSubtypeIdsForCreatureType,
  type CreatureSubtypeId,
  type CreatureTypeId,
} from '../values/creatureTaxonomy'

/**
 * Form/list select rows for subtypes valid for a creature type, derived from taxonomy + catalog names.
 */
export function getAllowedSubtypeOptionsForCreatureType(
  typeId: CreatureTypeId,
): { value: CreatureSubtypeId; label: string }[] {
  return getAllowedSubtypeIdsForCreatureType(typeId).map((id) => {
    const def = CREATURE_SUBTYPE_DEFINITIONS.find((o) => o.id === id)
    return { value: id, label: def?.name ?? id }
  })
}

export function getCreatureTypeSelectOptions(): { value: CreatureTypeId; label: string }[] {
  return CREATURE_TYPE_DEFINITIONS.map((r) => ({ value: r.id, label: r.name }))
}

export function getCreatureSizeSelectOptions(): { value: CreatureSizeId; label: string }[] {
  return CREATURE_SIZE_DEFINITIONS.map((r) => ({ value: r.id, label: r.name }))
}

export const CREATURE_TAXONOMY_FILTER_ALL = 'all' as const

/** List/grids: "All" plus one row per creature type. */
export function getCreatureTypeFilterOptions(): { value: string; label: string }[] {
  return [
    { label: 'All', value: CREATURE_TAXONOMY_FILTER_ALL },
    ...CREATURE_TYPE_DEFINITIONS.map((c) => ({ label: c.name, value: c.id })),
  ]
}

/** List/grids: "All" plus one row per size. */
export function getCreatureSizeFilterOptions(): { value: string; label: string }[] {
  return [
    { label: 'All', value: CREATURE_TAXONOMY_FILTER_ALL },
    ...CREATURE_SIZE_DEFINITIONS.map((c) => ({ label: c.name, value: c.id })),
  ]
}
