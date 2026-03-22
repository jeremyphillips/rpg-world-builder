/** Closed vocabulary of rule labels on creature type rows (not freeform strings). */
export const CREATURE_TYPE_RULE_TAGS = ['extraplanar'] as const
export type CreatureTypeRuleTag = (typeof CREATURE_TYPE_RULE_TAGS)[number]

export const MONSTER_TYPE_OPTIONS = [
  { id: 'aberration', name: 'Aberration', ruleTags: ['extraplanar'] as const },
  { id: 'animal', name: 'Animal' },
  { id: 'beast', name: 'Beast' },
  { id: 'celestial', name: 'Celestial', ruleTags: ['extraplanar'] as const },
  { id: 'construct', name: 'Construct' },
  { id: 'dragon', name: 'Dragon' },
  { id: 'elemental', name: 'Elemental', ruleTags: ['extraplanar'] as const },
  { id: 'fey', name: 'Fey', ruleTags: ['extraplanar'] as const },
  { id: 'fiend', name: 'Fiend', ruleTags: ['extraplanar'] as const },
  { id: 'giant', name: 'Giant' },
  { id: 'humanoid', name: 'Humanoid' },
  { id: 'monstrosity', name: 'Monstrosity' },
  { id: 'ooze', name: 'Ooze' },
  { id: 'plant', name: 'Plant' },
  { id: 'undead', name: 'Undead', ruleTags: ['extraplanar'] as const },
  { id: 'vermin', name: 'Vermin' },
] as const

export type MonsterType = (typeof MONSTER_TYPE_OPTIONS)[number]['id']

export const EXTRAPLANAR_CREATURE_TYPE_IDS = [
  ...MONSTER_TYPE_OPTIONS.filter(
    (m): m is (typeof MONSTER_TYPE_OPTIONS)[number] & {
      ruleTags: readonly CreatureTypeRuleTag[]
    } => 'ruleTags' in m && m.ruleTags.includes('extraplanar'),
  ).map((m) => m.id),
] as const

export type ExtraplanarCreatureTypeId = (typeof EXTRAPLANAR_CREATURE_TYPE_IDS)[number]

export function monsterTypeHasRuleTag(
  id: MonsterType,
  tag: CreatureTypeRuleTag,
): boolean {
  const row = MONSTER_TYPE_OPTIONS.find((m) => m.id === id)
  if (!row || !('ruleTags' in row)) return false
  return row.ruleTags.includes(tag)
}

export const MONSTER_SIZE_CATEGORY_OPTIONS = [
  { id: 'tiny', name: 'Tiny' },
  { id: 'small', name: 'Small' },
  { id: 'medium', name: 'Medium' },
  { id: 'large', name: 'Large' },
  { id: 'huge', name: 'Huge' },
  { id: 'gargantuan', name: 'Gargantuan' },
] as const

export type MonsterSizeCategory = (typeof MONSTER_SIZE_CATEGORY_OPTIONS)[number]['id']
