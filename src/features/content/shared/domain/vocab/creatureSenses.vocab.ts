/**
 * Creature sense type ids, display names, and lookups. Same role as
 * {@link damage/damageTypesSelect.vocab} — mapping lives in `.vocab`, not `.types`.
 */

/** Canonical rows: ids + labels. The union {@link CreatureSenseType} is derived from this table. */
export const CREATURE_SENSE_TYPE_DEFINITIONS = [
  { id: 'darkvision' as const, name: 'Darkvision' },
  { id: 'blindsight' as const, name: 'Blindsight' },
  { id: 'tremorsense' as const, name: 'Tremorsense' },
  { id: 'truesight' as const, name: 'Truesight' },
  { id: 'normal' as const, name: 'Normal' },
] as const

export type CreatureSenseType = (typeof CREATURE_SENSE_TYPE_DEFINITIONS)[number]['id']

export type CreatureSenseTypeDefinition = (typeof CREATURE_SENSE_TYPE_DEFINITIONS)[number]

export const CREATURE_SENSE_TYPE_IDS: readonly CreatureSenseType[] =
  CREATURE_SENSE_TYPE_DEFINITIONS.map((d) => d.id)

export type CreatureSenseTypeId = CreatureSenseType

const CREATURE_SENSE_TYPE_BY_ID: ReadonlyMap<CreatureSenseType, CreatureSenseTypeDefinition> = new Map(
  CREATURE_SENSE_TYPE_DEFINITIONS.map((r) => [r.id, r]),
)

/** User-facing label for a creature sense type id; undefined if `id` is not known. */
export function getCreatureSenseTypeDisplayName(id: string): string | undefined {
  // Legacy/alternate id in old data — prefer canonical truesight in types and authoring.
  const canonical = id === 'truesense' ? 'truesight' : id
  if (!(CREATURE_SENSE_TYPE_IDS as readonly string[]).includes(canonical)) return undefined
  return CREATURE_SENSE_TYPE_BY_ID.get(canonical as CreatureSenseType)?.name
}
