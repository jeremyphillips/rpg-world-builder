import type { CharacterDetailDto } from '@/features/character/read-model'
import { toCharacterForEngine } from '@/features/character/read-model'

import { buildCharacterQueryContext } from './buildCharacterQueryContext'
import type { CharacterQueryContext } from './characterQueryContext.types'

/**
 * Thin adapter: detail DTO → engine character → query context.
 * Use for membership / id-set questions; do not duplicate selector semantics elsewhere.
 */
export function buildCharacterQueryContextFromDetailDto(dto: CharacterDetailDto): CharacterQueryContext {
  return buildCharacterQueryContext(toCharacterForEngine(dto))
}
