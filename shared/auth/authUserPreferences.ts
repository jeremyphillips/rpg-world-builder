import type { AuthUserPreferences, NotificationPreferences } from '../types/authPreferences'
import { DEFAULT_NOTIFICATION_PREFS } from '../types/authPreferences'

type DbPreferences = {
  notifications?: Partial<NotificationPreferences>
  ui?: AuthUserPreferences['ui']
}

/**
 * Builds the API `preferences` object from a Mongo user document (after migration to `preferences.*`).
 */
export function authUserPreferencesFromDb(
  preferences: unknown,
): AuthUserPreferences {
  const p = preferences as DbPreferences | undefined
  return {
    notifications: {
      ...DEFAULT_NOTIFICATION_PREFS,
      ...p?.notifications,
    },
    ui: p?.ui ?? {},
  }
}
