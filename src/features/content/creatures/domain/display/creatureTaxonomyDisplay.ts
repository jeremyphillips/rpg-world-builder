import { CREATURE_SIZE_DEFINITIONS } from '../values/creatureSize'
import { CREATURE_SUBTYPE_DEFINITIONS, CREATURE_TYPE_DEFINITIONS } from '../values/creatureTaxonomy'

/**
 * User-facing type label; `—` when absent; unknown ids pass through.
 */
export function getCreatureTypeDisplayName(typeId: string | undefined | null): string {
  if (typeId == null || typeId === '') return '—'
  const row = CREATURE_TYPE_DEFINITIONS.find((o) => o.id === typeId)
  return row?.name ?? typeId
}

/**
 * User-facing subtype label; `—` when absent; unknown ids pass through.
 */
export function getCreatureSubtypeDisplayName(subtypeId: string | undefined | null): string {
  if (subtypeId == null || subtypeId === '') return '—'
  const opt = CREATURE_SUBTYPE_DEFINITIONS.find((o) => o.id === subtypeId)
  return opt?.name ?? subtypeId
}

/**
 * User-facing size label; `—` when absent; unknown ids pass through.
 */
export function getCreatureSizeDisplayName(sizeId: string | undefined | null): string {
  if (sizeId == null || sizeId === '') return '—'
  const opt = CREATURE_SIZE_DEFINITIONS.find((o) => o.id === sizeId)
  return opt?.name ?? sizeId
}
