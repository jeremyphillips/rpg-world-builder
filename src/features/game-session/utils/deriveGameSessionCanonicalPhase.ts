import type { GameSession } from '../domain/game-session.types'

/**
 * Canonical encounter phase for **game session shell** routing (derived only from the
 * `GameSession` record + HTTP refetch — not from URL).
 *
 * - **`play`**: active session with a linked persisted encounter — user belongs on `/play`.
 * - **`lobby`**: no active encounter on the record — includes **lobby** and **setup** routes
 *   (anything that is not encounter play). Naming matches “lobby vs play” product language;
 *   setup is intentionally grouped here as “not in encounter.”
 *
 * Used by lobby/play `Navigate` guards and should stay aligned with socket-driven
 * `refetch` in `GameSessionSyncProvider` (shell-level lifecycle).
 */
export type GameSessionCanonicalPhase = 'play' | 'lobby'

export function deriveGameSessionCanonicalPhase(session: GameSession): GameSessionCanonicalPhase {
  return session.status === 'active' && Boolean(session.activeEncounterId) ? 'play' : 'lobby'
}
