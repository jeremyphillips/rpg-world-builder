/**
 * Shared types for the character-build engine module.
 */
import type { EditionId } from '@/data/editions/edition.types'
import type { SettingId } from '@/data/types'

/**
 * Minimal draft shape consumed by engine build functions.
 *
 * Mirrors the subset of CharacterBuilderState that the engine needs.
 * Kept deliberately loose (all optional) so callers can pass partial
 * state objects without casting.
 */
export type BuildDraft = {
  edition?: EditionId | string
  setting?: SettingId | string
  race?: string
  alignment?: string
}
