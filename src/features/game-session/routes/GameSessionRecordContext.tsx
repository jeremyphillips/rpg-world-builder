import { createContext, useContext, type ReactNode } from 'react'
import type { GameSession } from '../domain/game-session.types'

export type GameSessionRecordContextValue = {
  session: GameSession
  refetch: () => Promise<void>
}

const GameSessionRecordContext = createContext<GameSessionRecordContextValue | null>(null)

export function GameSessionRecordProvider({
  session,
  refetch,
  children,
}: {
  session: GameSession
  refetch: () => Promise<void>
  children: ReactNode
}) {
  return (
    <GameSessionRecordContext.Provider value={{ session, refetch }}>
      {children}
    </GameSessionRecordContext.Provider>
  )
}

export function useGameSessionRecord(): GameSessionRecordContextValue {
  const ctx = useContext(GameSessionRecordContext)
  if (!ctx) {
    throw new Error('useGameSessionRecord must be used within GameSessionRecordProvider')
  }
  return ctx
}
