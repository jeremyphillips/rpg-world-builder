import type { CreatureTypeCondition } from '@/features/mechanics/domain/conditions/condition.types'
import {
  CREATURE_TYPE_DEFINITIONS,
  EXTRAPLANAR_CREATURE_TYPE_IDS,
  type ExtraplanarCreatureTypeId,
} from '@/features/content/creatures/domain/values/creatureTaxonomy'
import type { CreatureTypeId } from '@/features/content/creatures/domain/values'

export { EXTRAPLANAR_CREATURE_TYPE_IDS, type ExtraplanarCreatureTypeId }

function monsterTypeName(id: CreatureTypeId): string {
  return CREATURE_TYPE_DEFINITIONS.find((m) => m.id === id)?.name ?? id
}

/** Use on effect `condition` where the **source** (e.g. attacker) must be one of these types — not for spell target selection. */
export const EXTRAPLANAR_CREATURE_TYPES: CreatureTypeCondition = {
  kind: 'creature-type',
  target: 'source',
  creatureTypes: [...EXTRAPLANAR_CREATURE_TYPE_IDS],
}

/** Forbiddance: SRD allows one or more types; encounter UI uses one selection + radiant/necrotic (see spell caveat). */
export const FORBIDDANCE_CREATURE_TYPE_CASTER_OPTIONS: { value: string; label: string }[] = [
  {
    value: 'all',
    label: `All listed types (${EXTRAPLANAR_CREATURE_TYPE_IDS.map((id) => monsterTypeName(id)).join(', ')})`,
  },
  ...EXTRAPLANAR_CREATURE_TYPE_IDS.map((id) => ({
    value: id,
    label: monsterTypeName(id),
  })),
]
