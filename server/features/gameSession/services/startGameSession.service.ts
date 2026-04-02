import { getGameSessionLobbyPresentUserIds } from '../../../socket'
import { createPersistedCombatSession } from '../../combat/services/combatPersisted.service'
import { buildCombatStartupInputFromGameSession } from './buildGameSessionCombatStartup.server'
import { getGameSessionById, updateGameSession, type GameSessionApi } from './gameSession.service'

export type StartGameSessionResult =
  | { ok: true; session: GameSessionApi }
  | { ok: false; status: number; message: string }

export async function startGameSession(
  gameSessionId: string,
  campaignId: string,
  userId: string,
): Promise<StartGameSessionResult> {
  const existing = await getGameSessionById(gameSessionId, campaignId)
  if (!existing) {
    return { ok: false, status: 404, message: 'Game session not found.' }
  }
  if (existing.dmUserId !== userId) {
    return { ok: false, status: 403, message: 'Only the DM can start this session.' }
  }
  if (existing.status !== 'lobby') {
    return { ok: false, status: 400, message: 'Session must be in lobby status to start.' }
  }
  if (existing.activeEncounterId) {
    return { ok: false, status: 409, message: 'Session already has an active encounter.' }
  }

  const presentUserIds = getGameSessionLobbyPresentUserIds(campaignId, gameSessionId)
  const built = await buildCombatStartupInputFromGameSession(existing, campaignId, { presentUserIds })
  if (!built.ok) {
    return { ok: false, status: 400, message: built.message }
  }

  const created = await createPersistedCombatSession(built.input)
  if (!created.ok) {
    return { ok: false, status: 400, message: created.error.message }
  }

  const updated = await updateGameSession(gameSessionId, campaignId, {
    status: 'active',
    activeEncounterId: created.sessionId,
  })
  if (!updated) {
    return { ok: false, status: 500, message: 'Failed to update game session after creating combat.' }
  }

  return { ok: true, session: updated }
}
