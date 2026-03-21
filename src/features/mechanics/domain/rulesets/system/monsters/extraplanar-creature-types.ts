import type { CreatureTypeCondition } from '@/features/mechanics/domain/conditions/condition.types'
import {
  MONSTER_TYPE_OPTIONS,
  type MonsterType,
} from '@/features/content/monsters/domain/vocab/monster.vocab'

/** Extraplanar / otherworldly creature types used by Protection from Evil and Good, Forbiddance, etc. */
export const EXTRAPLANAR_CREATURE_TYPE_IDS = [
  'aberration',
  'celestial',
  'elemental',
  'fey',
  'fiend',
  'undead',
] as const satisfies readonly MonsterType[]

export type ExtraplanarCreatureTypeId = (typeof EXTRAPLANAR_CREATURE_TYPE_IDS)[number]

function monsterTypeName(id: MonsterType): string {
  return MONSTER_TYPE_OPTIONS.find((m) => m.id === id)?.name ?? id
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
