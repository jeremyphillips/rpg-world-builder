import { Server as HttpServer } from 'http'
import type { Socket } from 'socket.io'
import { Server as SocketServer } from 'socket.io'
import { verifyToken } from './shared/utils/jwt'
import { getGameSessionById } from './features/gameSession/services/gameSession.service'

export let io: SocketServer

/** Ephemeral lobby presence: roomKey → userId → ref count (tabs). Not persisted. */
const lobbyPresence = new Map<string, Map<string, number>>()

function lobbyRoomKey(campaignId: string, gameSessionId: string) {
  return `${campaignId}:${gameSessionId}`
}

function lobbyRoomName(roomKey: string) {
  return `gameSessionLobby:${roomKey}`
}

function addLobbyPresence(roomKey: string, userId: string) {
  let m = lobbyPresence.get(roomKey)
  if (!m) {
    m = new Map()
    lobbyPresence.set(roomKey, m)
  }
  m.set(userId, (m.get(userId) ?? 0) + 1)
}

function removeLobbyPresence(roomKey: string, userId: string) {
  const m = lobbyPresence.get(roomKey)
  if (!m) return
  const n = (m.get(userId) ?? 0) - 1
  if (n <= 0) m.delete(userId)
  else m.set(userId, n)
  if (m.size === 0) lobbyPresence.delete(roomKey)
}

function broadcastLobbyPresence(roomKey: string, campaignId: string, gameSessionId: string) {
  if (!io) return
  const presentUserIds = getGameSessionLobbyPresentUserIdsForRoomKey(roomKey)
  io.to(lobbyRoomName(roomKey)).emit('game_session_lobby_presence', {
    campaignId,
    gameSessionId,
    presentUserIds,
  })
}

/** Ephemeral user ids currently in the lobby room (Socket.IO tab ref counts). Used when starting a session. */
export function getGameSessionLobbyPresentUserIds(campaignId: string, gameSessionId: string): string[] {
  return getGameSessionLobbyPresentUserIdsForRoomKey(lobbyRoomKey(campaignId, gameSessionId))
}

function getGameSessionLobbyPresentUserIdsForRoomKey(roomKey: string): string[] {
  const counts = lobbyPresence.get(roomKey)
  return counts ? [...counts.keys()] : []
}

function leaveGameSessionLobbySocket(s: SocketWithUser) {
  const roomKey = s.lobbyRoomKey
  const userId = s.userId
  const campaignId = s.lobbyCampaignId
  const gameSessionId = s.lobbyGameSessionId
  if (!roomKey || !userId) return
  removeLobbyPresence(roomKey, userId)
  s.leave(lobbyRoomName(roomKey))
  s.lobbyRoomKey = undefined
  s.lobbyCampaignId = undefined
  s.lobbyGameSessionId = undefined
  if (campaignId && gameSessionId) {
    broadcastLobbyPresence(roomKey, campaignId, gameSessionId)
  }
}

export function initSocket(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token ?? socket.handshake.query?.token
    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication required'))
    }
    try {
      const payload = verifyToken(token)
      ;(socket as SocketWithUser).userId = payload.userId
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket: SocketWithUser) => {
    const userId = socket.userId
    if (userId) {
      socket.join(`user:${userId}`)
    }

    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`)
    })

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`)
    })

    socket.on('join_game_session_lobby', async (payload: { campaignId?: string; gameSessionId?: string }) => {
      const campaignId = payload?.campaignId
      const gameSessionId = payload?.gameSessionId
      const uid = socket.userId
      if (!campaignId || !gameSessionId || !uid) return

      const session = await getGameSessionById(gameSessionId, campaignId)
      if (!session) return

      const roomKey = lobbyRoomKey(campaignId, gameSessionId)
      if (socket.lobbyRoomKey === roomKey) {
        return
      }
      if (socket.lobbyRoomKey && socket.lobbyRoomKey !== roomKey) {
        leaveGameSessionLobbySocket(socket)
      }

      addLobbyPresence(roomKey, uid)
      socket.join(lobbyRoomName(roomKey))
      socket.lobbyRoomKey = roomKey
      socket.lobbyCampaignId = campaignId
      socket.lobbyGameSessionId = gameSessionId
      broadcastLobbyPresence(roomKey, campaignId, gameSessionId)
    })

    socket.on('leave_game_session_lobby', (payload: { campaignId?: string; gameSessionId?: string }) => {
      const campaignId = payload?.campaignId
      const gameSessionId = payload?.gameSessionId
      if (!campaignId || !gameSessionId || !socket.lobbyRoomKey) return
      const roomKey = lobbyRoomKey(campaignId, gameSessionId)
      if (socket.lobbyRoomKey !== roomKey) return
      leaveGameSessionLobbySocket(socket)
    })

    socket.on('disconnect', () => {
      leaveGameSessionLobbySocket(socket)
    })
  })

  return io
}

export function emitNewMessage(conversationId: string, message: Record<string, unknown>) {
  if (io) {
    io.to(`conversation:${conversationId}`).emit('new_message', message)
  }
}

interface SocketWithUser extends Socket {
  userId?: string
  lobbyRoomKey?: string
  lobbyCampaignId?: string
  lobbyGameSessionId?: string
}
