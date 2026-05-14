import type { CreatureSense, CreatureSenses } from '@/features/content/shared/domain/vocab/creatureSenses.types'

export type SenseType = CreatureSense['type']

export type MonsterSense = CreatureSense

/**
 * Stat-block authoring: `special` may be omitted when only passive Perception appears.
 * Use {@link normalizeCreatureSenses} from creature senses vocab for engine/UI normalized shape.
 */
export type MonsterSenses = Omit<CreatureSenses, 'special'> & {
  special?: CreatureSense[]
}
