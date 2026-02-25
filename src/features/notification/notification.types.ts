export type NotificationContext =
  | { type: 'campaign'; campaignId: string }
  | { type: 'character'; characterId: string }
  | { type: 'newPartyMember'; characterId: string; campaignId?: string }
  | { type: 'equipment'; equipmentId: string }
  | { type: 'invite'; inviteId: string }
  | { type: 'sessionInvite'; sessionInviteId: string }
  | { type: 'conversation'; conversationId: string }

export interface AppNotification {
  _id: string
  userId: string
  type: string
  readAt: string | null
  requiresAction: boolean
  actionTakenAt: string | null
  createdAt: string
  context: NotificationContext
  payload: Record<string, unknown>
}

export interface NotificationContextType {
  notifications: AppNotification[]
  unreadCount: number
  loading: boolean
  refresh: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}