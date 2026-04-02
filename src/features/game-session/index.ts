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
  type GameSessionPatch,
} from './api/gameSessionApi'
export { useGameSessionRecord } from './routes/GameSessionRecordContext'
export {
  campaignGameSessionLobbyPath,
  campaignGameSessionPath,
  campaignGameSessionSetupPath,
  campaignGameSessionsListPath,
} from './routes/gameSessionPaths'
export { canEditGameSessionSetup } from './utils/canEditGameSessionSetup'
export { resolveExpectedSessionCharacterIds } from './utils/resolveExpectedSessionCharacterIds'
export { useGameSessionLobbyPresence } from './hooks/useGameSessionLobbyPresence'
export type { GameSessionLobbyPresencePayload } from './hooks/useGameSessionLobbyPresence'
