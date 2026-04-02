import { useEffect, useMemo, useState } from 'react'
import { useSocketConnection } from '@/app/providers/SocketConnectionProvider'

export type GameSessionLobbyPresencePayload = {
  campaignId: string
  gameSessionId: string
  presentUserIds: string[]
}

/**
 * Ephemeral lobby presence: joins a Socket.IO room for this game session and tracks
 * which authenticated user ids are currently connected (ref-counted server-side).
 * Does not persist membership on the session document.
 */
export function useGameSessionLobbyPresence(
  campaignId: string | undefined,
  gameSessionId: string | undefined,
) {
  const { socket } = useSocketConnection()
  const [presentUserIds, setPresentUserIds] = useState<string[]>([])

  useEffect(() => {
    if (!socket || !campaignId || !gameSessionId) {
      setPresentUserIds([])
      return
    }

    const handler = (payload: GameSessionLobbyPresencePayload) => {
      if (payload.campaignId !== campaignId || payload.gameSessionId !== gameSessionId) {
        return
      }
      setPresentUserIds(payload.presentUserIds ?? [])
    }

    socket.on('game_session_lobby_presence', handler)
    socket.emit('join_game_session_lobby', { campaignId, gameSessionId })

    return () => {
      socket.off('game_session_lobby_presence', handler)
      socket.emit('leave_game_session_lobby', { campaignId, gameSessionId })
    }
  }, [socket, campaignId, gameSessionId])

  const presentUserIdSet = useMemo(() => new Set(presentUserIds), [presentUserIds])

  return { presentUserIds, presentUserIdSet }
}
