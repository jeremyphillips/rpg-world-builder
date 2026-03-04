import type { Character } from '@/features/character/domain/types'

/**
 * Minimal draft shape consumed by engine build functions.
 *
 * Mirrors the subset of CharacterBuilderState that the engine needs.
 * Kept deliberately loose (all optional) so callers can pass partial
 * state objects without casting.
 */
export type BuildDraft = Pick<Character, 'race' | 'alignment'> & {
  race?: string
  alignment?: string
}
