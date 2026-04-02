import { apiFetch } from '@/app/api'
import type { GameSession, GameSessionStatus } from '../domain/game-session.types'

type GameSessionDto = {
  id: string
  campaignId: string
  dmUserId: string
  status: GameSessionStatus
  title: string
  scheduledFor: string | null
  location: {
    locationId: string | null
    buildingId: string | null
    floorId: string | null
    label: string | null
  }
  participants: GameSession['participants']
  activeEncounterId: string | null
  createdAt: string
  updatedAt: string
}

function dtoToGameSession(d: GameSessionDto): GameSession {
  return {
    id: d.id,
    campaignId: d.campaignId,
    dmUserId: d.dmUserId,
    status: d.status,
    title: d.title,
    scheduledFor: d.scheduledFor,
    location: {
      locationId: d.location.locationId,
      buildingId: d.location.buildingId,
      floorId: d.location.floorId,
      label: d.location.label,
    },
    participants: d.participants,
    activeEncounterId: d.activeEncounterId,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }
}

export async function fetchGameSessionsForCampaign(campaignId: string): Promise<GameSession[]> {
  const data = await apiFetch<{ gameSessions: GameSessionDto[] }>(
    `/api/campaigns/${campaignId}/game-sessions`,
  )
  return (data.gameSessions ?? []).map(dtoToGameSession)
}

export async function fetchGameSession(
  campaignId: string,
  gameSessionId: string,
): Promise<GameSession> {
  const data = await apiFetch<{ gameSession: GameSessionDto }>(
    `/api/campaigns/${campaignId}/game-sessions/${gameSessionId}`,
  )
  return dtoToGameSession(data.gameSession)
}

export async function createGameSession(
  campaignId: string,
  body: {
    title: string
    status?: GameSessionStatus
    scheduledFor?: string | null
    locationId?: string | null
    buildingId?: string | null
    floorId?: string | null
    locationLabel?: string | null
  },
): Promise<GameSession> {
  const data = await apiFetch<{ gameSession: GameSessionDto }>(
    `/api/campaigns/${campaignId}/game-sessions`,
    { method: 'POST', body },
  )
  return dtoToGameSession(data.gameSession)
}

export type GameSessionPatch = {
  title?: string
  status?: GameSessionStatus
  scheduledFor?: string | null
  locationId?: string | null
  buildingId?: string | null
  floorId?: string | null
  locationLabel?: string | null
  activeEncounterId?: string | null
}

export async function updateGameSession(
  campaignId: string,
  gameSessionId: string,
  patch: GameSessionPatch,
): Promise<GameSession> {
  const data = await apiFetch<{ gameSession: GameSessionDto }>(
    `/api/campaigns/${campaignId}/game-sessions/${gameSessionId}`,
    { method: 'PATCH', body: patch },
  )
  return dtoToGameSession(data.gameSession)
}
