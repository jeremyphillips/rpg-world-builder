import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { apiFetch, ApiError } from '../api'
import type { AuthUserPreferences } from '@/shared'

interface AuthUser {
  id: string
  username: string
  email: string
  role: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  bio?: string
  website?: string
  preferences?: AuthUserPreferences
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  /** Re-fetch the current user from the server (e.g. after registration sets a cookie). */
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // AbortController prevents StrictMode from completing both duplicate
  // /api/auth/me fetches, which would create two distinct user object
  // references and cascade unnecessary re-renders through every consumer.
  useEffect(() => {
    const controller = new AbortController()
    apiFetch<{ user: AuthUser | null }>('/api/auth/me', { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setUser(data?.user ?? null)
      })
      .catch(() => {
        if (!controller.signal.aborted) setUser(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const data = await apiFetch<{ user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      setUser(data.user)
    } catch (err) {
      throw new Error(err instanceof ApiError ? err.message : 'Login failed')
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const data = await apiFetch<{ user: AuthUser | null }>('/api/auth/me')
    setUser(data?.user ?? null)
  }, [])

  // Memoize so consumers only re-render when auth state actually changes
  const value = useMemo(
    () => ({ user, loading, signIn, signOut, refreshUser }),
    [user, loading, signIn, signOut, refreshUser],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
