import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { io, type Socket } from 'socket.io-client'
import { apiFetch } from '../api'
import { useAuth } from './AuthProvider'

const SOCKET_URL = import.meta.env.DEV ? '' : window.location.origin

type SocketConnectionContextValue = {
  socket: Socket | null
}

const SocketConnectionContext = createContext<SocketConnectionContextValue | undefined>(undefined)

export function SocketConnectionProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (authLoading || !user) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setSocket(null)
      return
    }

    let cancelled = false

    const connect = async () => {
      try {
        const { token } = await apiFetch<{ token: string }>('/api/auth/socket-token')
        if (cancelled) return
        const s = io(SOCKET_URL, {
          auth: { token },
          path: '/socket.io',
        })
        socketRef.current = s
        setSocket(s)
      } catch {
        if (!cancelled) setSocket(null)
      }
    }

    connect()

    return () => {
      cancelled = true
      socketRef.current?.disconnect()
      socketRef.current = null
      setSocket(null)
    }
  }, [user, authLoading])

  return (
    <SocketConnectionContext.Provider value={{ socket }}>
      {children}
    </SocketConnectionContext.Provider>
  )
}

export function useSocketConnection(): SocketConnectionContextValue {
  const ctx = useContext(SocketConnectionContext)
  if (!ctx) {
    throw new Error('useSocketConnection must be used within SocketConnectionProvider')
  }
  return ctx
}
