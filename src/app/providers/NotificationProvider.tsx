import { createContext, useContext, useMemo, useRef, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import { apiFetch } from '../api'
import type { NotificationContextType, AppNotification } from '@/features/notification'

const NotificationContext = createContext<NotificationContextType | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Hold user in a ref so `refresh` never changes identity.
  // Without this, every new user object (e.g. from StrictMode double-firing
  // the auth check) would recreate refresh → re-trigger the polling effect →
  // cause a burst of notification fetches and context value churn.
  const userRef = useRef(user)
  userRef.current = user

  const refresh = useCallback(async () => {
    if (!userRef.current) return
    setLoading(true)
    try {
      const data = await apiFetch<{ notifications: AppNotification[]; unreadCount: number }>('/api/notifications')
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load + poll every 30 seconds
  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    refresh()
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [user, refresh])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      // silently fail
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'POST' })
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
      )
      setUnreadCount(0)
    } catch {
      // silently fail
    }
  }, [])

  // Memoize so consumers only re-render when notification state changes
  const value = useMemo(
    () => ({ notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead }),
    [notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
