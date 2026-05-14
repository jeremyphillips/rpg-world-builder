/** Closed vocabulary of rule labels on creature type rows (not freeform strings). */
export const CREATURE_TYPE_RULE_TAGS = ['extraplanar'] as const
export type CreatureTypeRuleTag = (typeof CREATURE_TYPE_RULE_TAGS)[number]

/**
 * Global subtype tag catalog (ids and display names). `allowedSubtypeIds` on each
 * {@link CREATURE_TYPE_DEFINITIONS} row references this list — add here first, then allow per type.
 */
export const CREATURE_SUBTYPE_DEFINITIONS = [
  { id: 'angel', name: 'Angel' },
  { id: 'chromatic', name: 'Chromatic' },
  { id: 'cleric', name: 'Cleric' },
  { id: 'demon', name: 'Demon' },
  { id: 'devil', name: 'Devil' },
  // { id: 'dwarf', name: 'Dwarf' },
  // { id: 'elf', name: 'Elf' },
  { id: 'druid', name: 'Druid' },
  { id: 'genie', name: 'Genie' },
  // { id: 'gnome', name: 'Gnome' },
  { id: 'goblinoid', name: 'Goblinoid' },
  // { id: 'halfling', name: 'Halfling' },
  // { id: 'human', name: 'Human' },
  { id: 'lycanthrope', name: 'Lycanthrope' },
  { id: 'metallic', name: 'Metallic' },
  // { id: 'orc', name: 'Orc' },
  { id: 'swarm', name: 'Swarm' },
  { id: 'titan', name: 'Titan' },
  { id: 'wizard', name: 'Wizard' },
] as const

export type CreatureSubtypeId = (typeof CREATURE_SUBTYPE_DEFINITIONS)[number]['id']

const extraplanarRuleTags: readonly [CreatureTypeRuleTag] = ['extraplanar'] as const

export const CREATURE_TYPE_DEFINITIONS = [
  { id: 'aberration', name: 'Aberration', allowedSubtypeIds: [] as const, ruleTags: extraplanarRuleTags },
  { id: 'animal', name: 'Animal', allowedSubtypeIds: ['aquatic', 'swarm'] as const },
  { id: 'beast', name: 'Beast', allowedSubtypeIds: ['aquatic', 'swarm'] as const },
  { id: 'celestial', name: 'Celestial', allowedSubtypeIds: ['angel'] as const, ruleTags: extraplanarRuleTags },
  { id: 'construct', name: 'Construct', allowedSubtypeIds: [] as const },
  { id: 'dragon', name: 'Dragon', allowedSubtypeIds: ['chromatic', 'metallic'] as const },
  {
    id: 'elemental',
    name: 'Elemental',
    allowedSubtypeIds: ['genie'] as const,
    ruleTags: extraplanarRuleTags,
  },
  { id: 'fey', name: 'Fey', allowedSubtypeIds: ['goblinoid'] as const, ruleTags: extraplanarRuleTags },
  {
    id: 'fiend',
    name: 'Fiend',
    allowedSubtypeIds: ['demon', 'devil', 'shapechanger'] as const,
    ruleTags: extraplanarRuleTags,
  },
  { id: 'giant', name: 'Giant', allowedSubtypeIds: ['titan'] as const },
  { id: 'humanoid', name: 'Humanoid', allowedSubtypeIds: ['cleric', 'druid', 'wizard'] as const },
  { id: 'monstrosity', name: 'Monstrosity', allowedSubtypeIds: ['swarm', 'titan', 'lycanthrope'] as const },
  { id: 'ooze', name: 'Ooze', allowedSubtypeIds: [] as const },
  { id: 'plant', name: 'Plant', allowedSubtypeIds: [] as const },
  { id: 'undead', name: 'Undead', allowedSubtypeIds: ['wizard'] as const, ruleTags: extraplanarRuleTags },
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
