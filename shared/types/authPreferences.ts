/**
 * Canonical user preferences (API + client). Notifications live under `preferences.notifications`;
 * UI affordances (e.g. content list defaults) under `preferences.ui`.
 */

export type NotificationPreferences = {
  sessionScheduled: boolean
  inviteReceived: boolean
  mentionedInChat: boolean
}

export type ContentListUiPreferences = {
  hideDisallowed?: boolean
}

export type AuthUserPreferences = {
  notifications?: NotificationPreferences
  ui?: {
    contentLists?: {
      spells?: ContentListUiPreferences
      monsters?: ContentListUiPreferences
    }
  }
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  sessionScheduled: true,
  inviteReceived: true,
  mentionedInChat: true,
}
