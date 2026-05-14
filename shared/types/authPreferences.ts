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
      classes?: ContentListUiPreferences
      races?: ContentListUiPreferences
      monsters?: ContentListUiPreferences
      locations?: ContentListUiPreferences
      skillProficiencies?: ContentListUiPreferences
      armor?: ContentListUiPreferences
      gear?: ContentListUiPreferences
      weapons?: ContentListUiPreferences
      magicItems?: ContentListUiPreferences
    }
  }
}

/** Keys under `preferences.ui.contentLists` (e.g. hide-disallowed list prefs). */
export type ContentListPreferencesKey = keyof NonNullable<
  NonNullable<AuthUserPreferences['ui']>['contentLists']
>

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  sessionScheduled: true,
  inviteReceived: true,
  mentionedInChat: true,
}
