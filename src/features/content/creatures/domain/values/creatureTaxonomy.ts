/** Closed vocabulary of rule labels on creature type rows (not freeform strings). */
export const CREATURE_TYPE_RULE_TAGS = ['extraplanar'] as const
export type CreatureTypeRuleTag = (typeof CREATURE_TYPE_RULE_TAGS)[number]

/**
 * Global subtype tag catalog (ids and display names). `allowedSubtypeIds` on each
 * {@link CREATURE_TYPE_DEFINITIONS} row references this list — add here first, then allow per type.
 */
export const CREATURE_SUBTYPE_DEFINITIONS = [
  { id: 'air', name: 'Air' },
  { id: 'aquatic', name: 'Aquatic' },
  { id: 'demon', name: 'Demon' },
  { id: 'devil', name: 'Devil' },
  { id: 'dwarf', name: 'Dwarf' },
  { id: 'earth', name: 'Earth' },
  { id: 'elf', name: 'Elf' },
  { id: 'fire', name: 'Fire' },
  { id: 'gnoll', name: 'Gnoll' },
  { id: 'gnome', name: 'Gnome' },
  { id: 'goblinoid', name: 'Goblinoid' },
  { id: 'grimlock', name: 'Grimlock' },
  { id: 'halfling', name: 'Halfling' },
  { id: 'human', name: 'Human' },
  { id: 'kobold', name: 'Kobold' },
  { id: 'lizardfolk', name: 'Lizardfolk' },
  { id: 'merfolk', name: 'Merfolk' },
  { id: 'orc', name: 'Orc' },
  { id: 'sahuagin', name: 'Sahuagin' },
  { id: 'shapechanger', name: 'Shapechanger' },
  { id: 'swarm', name: 'Swarm' },
  { id: 'titan', name: 'Titan' },
  { id: 'water', name: 'Water' },
] as const

export type CreatureSubtypeId = (typeof CREATURE_SUBTYPE_DEFINITIONS)[number]['id']

const extraplanarRuleTags: readonly [CreatureTypeRuleTag] = ['extraplanar'] as const

/**
 * Per-type `allowedSubtypeIds` constrain which subtype tags are valid for a type; expand in data.
 * Subtype UI options (`{ value, label }[]`) live in `domain/options/creatureTaxonomyOptions.ts`, not in this file.
 * Empty means no subtypes in UI for that type.
 */
const humanoidSubtypeIds = [
  'aquatic',
  'dwarf',
  'elf',
  'gnoll',
  'gnome',
  'goblinoid',
  'grimlock',
  'halfling',
  'human',
  'kobold',
  'lizardfolk',
  'merfolk',
  'orc',
  'sahuagin',
] as const

export const CREATURE_TYPE_DEFINITIONS = [
  { id: 'aberration', name: 'Aberration', allowedSubtypeIds: [] as const, ruleTags: extraplanarRuleTags },
  { id: 'animal', name: 'Animal', allowedSubtypeIds: ['aquatic', 'swarm'] as const },
  { id: 'beast', name: 'Beast', allowedSubtypeIds: ['aquatic', 'swarm'] as const },
  { id: 'celestial', name: 'Celestial', allowedSubtypeIds: [] as const, ruleTags: extraplanarRuleTags },
  { id: 'construct', name: 'Construct', allowedSubtypeIds: [] as const },
  { id: 'dragon', name: 'Dragon', allowedSubtypeIds: [] as const },
  {
    id: 'elemental',
    name: 'Elemental',
    allowedSubtypeIds: ['air', 'earth', 'fire', 'water'] as const,
    ruleTags: extraplanarRuleTags,
  },
  { id: 'fey', name: 'Fey', allowedSubtypeIds: [] as const, ruleTags: extraplanarRuleTags },
  {
    id: 'fiend',
    name: 'Fiend',
    allowedSubtypeIds: ['demon', 'devil', 'shapechanger'] as const,
    ruleTags: extraplanarRuleTags,
  },
  { id: 'giant', name: 'Giant', allowedSubtypeIds: ['titan'] as const },
  { id: 'humanoid', name: 'Humanoid', allowedSubtypeIds: humanoidSubtypeIds },
  { id: 'monstrosity', name: 'Monstrosity', allowedSubtypeIds: ['shapechanger', 'swarm', 'titan'] as const },
  { id: 'ooze', name: 'Ooze', allowedSubtypeIds: [] as const },
  { id: 'plant', name: 'Plant', allowedSubtypeIds: [] as const },
  { id: 'undead', name: 'Undead', allowedSubtypeIds: ['shapechanger'] as const, ruleTags: extraplanarRuleTags },
  { id: 'vermin', name: 'Vermin', allowedSubtypeIds: ['swarm'] as const },
] as const

export type CreatureTypeId = (typeof CREATURE_TYPE_DEFINITIONS)[number]['id']

type CreatureTypeDefRow = (typeof CREATURE_TYPE_DEFINITIONS)[number]

export const EXTRAPLANAR_CREATURE_TYPE_IDS = [
  ...CREATURE_TYPE_DEFINITIONS.filter(
    (m): m is CreatureTypeDefRow & { ruleTags: readonly CreatureTypeRuleTag[] } =>
      'ruleTags' in m && m.ruleTags.includes('extraplanar'),
  ).map((m) => m.id),
] as const

export type ExtraplanarCreatureTypeId = (typeof EXTRAPLANAR_CREATURE_TYPE_IDS)[number]

export function creatureTypeHasRuleTag(
  id: CreatureTypeId,
  tag: CreatureTypeRuleTag,
): boolean {
  const row = CREATURE_TYPE_DEFINITIONS.find((m) => m.id === id)
  if (!row || !('ruleTags' in row)) return false
  return row.ruleTags.includes(tag)
}

export function getAllowedSubtypeIdsForCreatureType(
  typeId: CreatureTypeId,
): readonly CreatureSubtypeId[] {
  const row = CREATURE_TYPE_DEFINITIONS.find((m) => m.id === typeId)
  if (!row) return []
  return row.allowedSubtypeIds as readonly CreatureSubtypeId[]
}

export function isSubtypeAllowedForCreatureType(
  typeId: CreatureTypeId,
  subtypeId: CreatureSubtypeId,
): boolean {
  return getAllowedSubtypeIdsForCreatureType(typeId).includes(subtypeId)
}
