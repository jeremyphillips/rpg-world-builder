import { useMemo } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'

export type NotificationPreferences = {
  sessionScheduled: boolean
  inviteReceived: boolean
  mentionedInChat: boolean
}

export type AccountSettings = {
  firstName: string
  lastName: string
  username: string
  avatarKey: string | null
  bio: string
  website: string
  email: string
  notificationPreferences: NotificationPreferences
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  sessionScheduled: true,
  inviteReceived: true,
  mentionedInChat: true,
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
      notificationPreferences: {
        ...DEFAULT_NOTIFICATION_PREFS,
        ...user.notificationPreferences,
      },
    }
  }, [user])

  const error: string | null = !loading && !user ? 'Not authenticated' : null

  return { data, loading, error }
}
