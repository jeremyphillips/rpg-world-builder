export type {
  GameSession,
  GameSessionLocationContext,
  GameSessionParticipant,
  GameSessionParticipantRole,
  GameSessionStatus,
} from './domain/game-session.types'
export {
  fetchGameSession,
  fetchGameSessionsForCampaign,
  createGameSession,
  updateGameSession,
  startGameSession,
  type GameSessionPatch,
} from './api/gameSessionApi'
export { useGameSessionRecord } from './routes/GameSessionRecordContext'
export {
  campaignGameSessionLobbyPath,
  campaignGameSessionPath,
  campaignGameSessionPlayPath,
  campaignGameSessionSetupPath,
  campaignGameSessionsListPath,
} from './routes/gameSessionPaths'
export { canEditGameSessionSetup } from './utils/canEditGameSessionSetup'
export { resolveExpectedSessionCharacterIds } from './utils/resolveExpectedSessionCharacterIds'
export {
  resolveLaunchSessionCharacterIds,
  type RosterCharacterForLaunch,
} from './utils/resolveLaunchSessionCharacterIds'
export {
  getPresentPlayerCharacterIdsForSessionLobby,
  isPlayerCharacterForSessionLobby,
} from './utils/presentPlayerCharactersForSessionLobby'
export { useGameSessionLobbyPresence } from './hooks/useGameSessionLobbyPresence'
export type { GameSessionLobbyPresencePayload } from './hooks/useGameSessionLobbyPresence'
