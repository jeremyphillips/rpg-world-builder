import { useMemo } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import {
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPreferences,
} from '@/shared'

export type { NotificationPreferences }

export type AccountSettings = {
  firstName: string
  lastName: string
  username: string
  avatarKey: string | null
  bio: string
  website: string
  email: string
  preferences: {
    notifications: NotificationPreferences
  }
}

/**
 * Derives account-settings form values from the already-loaded AuthProvider
 * user, avoiding a duplicate `/api/auth/me` fetch.
 */
export function useAccountSettings() {
  const { user, loading } = useAuth()

  const data = useMemo<AccountSettings | null>(() => {
    if (!user) return null
    return {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      username: user.username ?? '',
      avatarKey: user.avatarUrl ?? null,
      bio: user.bio ?? '',
      website: user.website ?? '',
      email: user.email ?? '',
      preferences: {
        notifications: {
          ...DEFAULT_NOTIFICATION_PREFS,
          ...user.preferences?.notifications,
        },
      },
    }
  }, [user])

  const error: string | null = !loading && !user ? 'Not authenticated' : null

  return { data, loading, error }
}
