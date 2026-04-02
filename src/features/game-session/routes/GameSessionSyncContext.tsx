import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { useSocketConnection } from '@/app/providers/SocketConnectionProvider'

/** Mirrors server `GameSessionSyncPayload` — clients refetch canonical state after this event. */
export type GameSessionSyncPayload = {
  campaignId: string
  gameSessionId: string
  sessionRowChanged: boolean
  combatSessionId?: string
  combatRevision?: number
}

type GameSessionSyncContextValue = {
  lastSyncPayload: GameSessionSyncPayload | null
}

const GameSessionSyncContext = createContext<GameSessionSyncContextValue | null>(null)

export function GameSessionSyncProvider({
  campaignId,
  gameSessionId,
  refetchSession,
  children,
}: {
  campaignId: string
  gameSessionId: string
  refetchSession: () => Promise<void>
  children: ReactNode
}) {
  const { socket } = useSocketConnection()
  const [lastSyncPayload, setLastSyncPayload] = useState<GameSessionSyncPayload | null>(null)

  const onSync = useCallback(
    (payload: GameSessionSyncPayload) => {
      if (payload.gameSessionId !== gameSessionId || payload.campaignId !== campaignId) return
      if (payload.sessionRowChanged) {
        void refetchSession()
      }
      setLastSyncPayload(payload)
    },
    [campaignId, gameSessionId, refetchSession],
  )

  useEffect(() => {
    if (!socket) return

    const join = () => {
      socket.emit('join_game_session_sync', { campaignId, gameSessionId })
    }

    join()
    socket.on('connect', join)
    socket.on('game_session_sync', onSync)

    return () => {
      socket.emit('leave_game_session_sync', { campaignId, gameSessionId })
      socket.off('connect', join)
      socket.off('game_session_sync', onSync)
    }
  }, [socket, campaignId, gameSessionId, onSync])

  const value = useMemo(() => ({ lastSyncPayload }), [lastSyncPayload])

  return <GameSessionSyncContext.Provider value={value}>{children}</GameSessionSyncContext.Provider>
}

export function useGameSessionSync(): GameSessionSyncContextValue {
  const ctx = useContext(GameSessionSyncContext)
  if (!ctx) {
    throw new Error('useGameSessionSync must be used within GameSessionSyncProvider')
  }
  return ctx
}
