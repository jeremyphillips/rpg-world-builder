import type { CharacterRosterSummary } from '@/features/character/read-model'
import type { GameSession } from '../domain/game-session.types'

/**
 * Resolves which campaign characters are **expected** in this game session lobby (planning / display).
 * Distinct from **present** (Socket.IO lobby) and **launched** (see `resolveLaunchSessionCharacterIds`).
 *
 * **Temporary:** returns every campaign character id so all PCs are treated as expected.
 * Future versions may filter by session roster, invites, join rules, or exclusions — keep
 * call sites using this helper so that logic stays in one place.
 */
export function resolveExpectedSessionCharacterIds(
  _session: GameSession,
  campaignCharacters: CharacterRosterSummary[],
): string[] {
  return campaignCharacters.map((c) => c.id)
}
