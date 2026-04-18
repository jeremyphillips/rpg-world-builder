/**
 * User-facing labels for {@link CreatureSenseType} ids. Engine rules live elsewhere;
 * this module owns display metadata only.
 */

const CREATURE_SENSE_TYPE_ROWS = [
  { id: 'darkvision' as const, name: 'Darkvision' },
  { id: 'blindsight' as const, name: 'Blindsight' },
  { id: 'tremorsense' as const, name: 'Tremorsense' },
  { id: 'truesight' as const, name: 'Truesight' },
  { id: 'normal' as const, name: 'Normal' },
]

export type CreatureSenseTypeId = (typeof CREATURE_SENSE_TYPE_ROWS)[number]['id']

export const CREATURE_SENSE_TYPE_IDS: readonly CreatureSenseTypeId[] =
  CREATURE_SENSE_TYPE_ROWS.map((r) => r.id)

const CREATURE_SENSE_TYPE_BY_ID: ReadonlyMap<CreatureSenseTypeId, (typeof CREATURE_SENSE_TYPE_ROWS)[number]> =
  new Map(CREATURE_SENSE_TYPE_ROWS.map((r) => [r.id, r]))

/** User-facing label for a creature sense type id; undefined if `id` is not known. */
export function getCreatureSenseTypeDisplayName(id: string): string | undefined {
  if (!(CREATURE_SENSE_TYPE_IDS as readonly string[]).includes(id)) return undefined
  return CREATURE_SENSE_TYPE_BY_ID.get(id as CreatureSenseTypeId)?.name
}
