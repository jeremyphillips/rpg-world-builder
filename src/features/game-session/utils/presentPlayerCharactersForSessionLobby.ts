import type { CharacterRosterSummary } from '@/features/character/read-model'

import type { GameSession } from '../domain/game-session.types'
import { resolveExpectedSessionCharacterIds } from './resolveExpectedSessionCharacterIds'

/** Player character vs campaign NPC row (party ally NPCs are not counted for session-start gating). */
export function isPlayerCharacterForSessionLobby(c: CharacterRosterSummary): boolean {
  return c.type !== 'npc'
}

/**
 * Player characters (PCs) that are expected for this session, owned by a user currently present in
 * the lobby. Used for lobby UX (e.g. enabling **Start session**).
 *
 * Aligns with {@link resolveLaunchSessionCharacterIds} + expected roster, but restricted to PCs.
 * Server-side launch may still evolve; this is the client guardrail for the DM action.
 */
export function getPresentPlayerCharacterIdsForSessionLobby(
  session: GameSession,
  campaignCharacters: CharacterRosterSummary[],
  presentUserIdSet: ReadonlySet<string>,
): string[] {
  const expected = new Set(resolveExpectedSessionCharacterIds(session, campaignCharacters))
  const present = presentUserIdSet
  const ids: string[] = []
  for (const c of campaignCharacters) {
    if (!expected.has(c.id)) continue
    if (!isPlayerCharacterForSessionLobby(c)) continue
    if (present.has(c.ownerUserId)) ids.push(c.id)
  }
  return ids
}
