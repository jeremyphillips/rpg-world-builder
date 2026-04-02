import type { Request, Response } from 'express'
import { validateRequired } from '../../../shared/validators/common'
import { emitGameSessionSync } from '../../../socket'
import * as gameSessionService from '../services/gameSession.service'
import { startGameSession as executeStartGameSession } from '../services/startGameSession.service'

function paramString(req: Request, key: string): string | undefined {
  const v = req.params[key]
  if (typeof v === 'string') return v
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0]
  return undefined
}

export async function listGameSessions(req: Request, res: Response) {
  const campaignId = paramString(req, 'id')
  if (!campaignId) {
    res.status(400).json({ error: 'Campaign ID is required' })
    return
  }
  const gameSessions = await gameSessionService.listGameSessionsForCampaign(campaignId)
  res.json({ gameSessions })
}

export async function getGameSession(req: Request, res: Response) {
  const campaignId = paramString(req, 'id')
  const gameSessionId = paramString(req, 'gameSessionId')
  if (!campaignId || !gameSessionId) {
    res.status(400).json({ error: 'Campaign ID and game session ID are required' })
    return
  }
  const session = await gameSessionService.getGameSessionById(gameSessionId, campaignId)
  if (!session) {
    res.status(404).json({ error: 'Game session not found' })
    return
  }
  res.json({ gameSession: session })
}

export async function createGameSession(req: Request, res: Response) {
  const campaignId = paramString(req, 'id')
  const userId = (req as Request & { userId?: string }).userId
  if (!campaignId) {
    res.status(400).json({ error: 'Campaign ID is required' })
    return
  }
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const titleCheck = validateRequired(req.body.title, 'title')
  if (!titleCheck.valid) {
    res.status(400).json({ error: titleCheck.message })
    return
  }

  const title = String(req.body.title).trim()
  if (!title) {
    res.status(400).json({ error: 'title must not be empty' })
    return
  }

  const {
    status,
    scheduledFor,
    locationId,
    buildingId,
    floorId,
    locationLabel,
  } = req.body

  if (status !== undefined && !gameSessionService.isGameSessionStatus(status)) {
    res.status(400).json({ error: 'Invalid status' })
    return
  }

  try {
    const gameSession = await gameSessionService.createGameSession(campaignId, userId, {
      title,
      status,
      scheduledFor: scheduledFor === undefined ? undefined : scheduledFor,
      locationId,
      buildingId,
      floorId,
      locationLabel,
    })
    res.status(201).json({ gameSession })
  } catch (err) {
    console.error('createGameSession:', err)
    res.status(500).json({ error: 'Failed to create game session' })
  }
}

export async function startGameSession(req: Request, res: Response) {
  const campaignId = paramString(req, 'id')
  const gameSessionId = paramString(req, 'gameSessionId')
  const userId = (req as Request & { userId?: string }).userId
  if (!campaignId || !gameSessionId) {
    res.status(400).json({ error: 'Campaign ID and game session ID are required' })
    return
  }
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const raw = (req.body as { presentUserIds?: unknown } | undefined)?.presentUserIds
  const clientPresentUserIds = Array.isArray(raw)
    ? raw.map((x) => (typeof x === 'string' ? x : String(x))).filter((s) => s.length > 0)
    : undefined

  const result = await executeStartGameSession(gameSessionId, campaignId, userId, clientPresentUserIds)
  if (!result.ok) {
    res.status(result.status).json({ error: result.message })
    return
  }
  emitGameSessionSync({
    campaignId,
    gameSessionId,
    sessionRowChanged: true,
    combatSessionId: result.session.activeEncounterId ?? undefined,
    combatRevision: undefined,
  })
  res.json({ gameSession: result.session })
}

export async function updateGameSession(req: Request, res: Response) {
  const campaignId = paramString(req, 'id')
  const gameSessionId = paramString(req, 'gameSessionId')
  if (!campaignId || !gameSessionId) {
    res.status(400).json({ error: 'Campaign ID and game session ID are required' })
    return
  }

  const {
    title,
    status,
    scheduledFor,
    locationId,
    buildingId,
    floorId,
    locationLabel,
    opponentRefKeys,
    activeEncounterId,
  } = req.body

  if (status !== undefined && !gameSessionService.isGameSessionStatus(status)) {
    res.status(400).json({ error: 'Invalid status' })
    return
  }

  if (
    opponentRefKeys !== undefined &&
    (!Array.isArray(opponentRefKeys) || opponentRefKeys.some((x: unknown) => typeof x !== 'string'))
  ) {
    res.status(400).json({ error: 'opponentRefKeys must be an array of strings' })
    return
  }

  try {
    const gameSession = await gameSessionService.updateGameSession(gameSessionId, campaignId, {
      title,
      status,
      scheduledFor,
      locationId,
      buildingId,
      floorId,
      locationLabel,
      opponentRefKeys,
      activeEncounterId,
    })
    if (!gameSession) {
      res.status(404).json({ error: 'Game session not found' })
      return
    }
    emitGameSessionSync({
      campaignId,
      gameSessionId,
      sessionRowChanged: true,
      combatSessionId: gameSession.activeEncounterId ?? undefined,
      combatRevision: undefined,
    })
    res.json({ gameSession })
  } catch (err) {
    console.error('updateGameSession:', err)
    res.status(500).json({ error: 'Failed to update game session' })
  }
}

export async function deleteGameSession(req: Request, res: Response) {
  const campaignId = paramString(req, 'id')
  const gameSessionId = paramString(req, 'gameSessionId')
  if (!campaignId || !gameSessionId) {
    res.status(400).json({ error: 'Campaign ID and game session ID are required' })
    return
  }
  const deleted = await gameSessionService.deleteGameSession(gameSessionId, campaignId)
  if (!deleted) {
    res.status(404).json({ error: 'Game session not found' })
    return
  }
  res.status(204).send()
}
