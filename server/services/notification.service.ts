import mongoose from 'mongoose'
import { env } from '../shared/config/env'

const db = () => mongoose.connection.useDb(env.DB_NAME)
const notificationsCollection = () => db().collection('notifications')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotificationDoc {
  userId: mongoose.Types.ObjectId
  type: string                       // namespaced: campaign.invite, equipment.assigned, etc.
  readAt: Date | null
  requiresAction: boolean
  actionTakenAt: Date | null
  createdAt: Date
  context: {
    campaignId?: mongoose.Types.ObjectId
    characterId?: mongoose.Types.ObjectId
    campaignMemberId?: mongoose.Types.ObjectId
    conversationId?: mongoose.Types.ObjectId
    equipmentId?: mongoose.Types.ObjectId
    inviteId?: mongoose.Types.ObjectId
    sessionInviteId?: mongoose.Types.ObjectId
    invitedUserId?: mongoose.Types.ObjectId
  }
  payload: Record<string, unknown>   // type-specific structured data
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getNotificationsForUser(userId: string) {
  return notificationsCollection()
    .find({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray()
}

export async function getUnreadCount(userId: string) {
  return notificationsCollection().countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    readAt: null,
  })
}

export async function getNotificationById(id: string) {
  return notificationsCollection().findOne({
    _id: new mongoose.Types.ObjectId(id),
  })
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export async function createNotification(
  data: Omit<NotificationDoc, 'readAt' | 'actionTakenAt' | 'createdAt'>
) {
  const doc: NotificationDoc = {
    ...data,
    readAt: null,
    actionTakenAt: null,
    createdAt: new Date(),
  }

  const result = await notificationsCollection().insertOne(doc)
  return notificationsCollection().findOne({ _id: result.insertedId })
}

export async function markAsRead(id: string, userId: string) {
  return notificationsCollection().findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    },
    { $set: { readAt: new Date() } },
    { returnDocument: 'after' },
  )
}

export async function markAllAsRead(userId: string) {
  return notificationsCollection().updateMany(
    {
      userId: new mongoose.Types.ObjectId(userId),
      readAt: null,
    },
    { $set: { readAt: new Date() } },
  )
}

export async function markActionTaken(id: string, userId: string) {
  return notificationsCollection().findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    },
    { $set: { actionTakenAt: new Date(), readAt: new Date() } },
    { returnDocument: 'after' },
  )
}

// ---------------------------------------------------------------------------
// Session-invite helpers
// ---------------------------------------------------------------------------

export async function createSessionInviteNotifications(data: {
  sessionId: string
  campaignId: string
  memberUserIds: string[]
  sessionTitle: string
  sessionDate: string
  sessionNotes?: string
}) {
  const notifications = data.memberUserIds.map((userId) => ({
    userId: new mongoose.Types.ObjectId(userId),
    type: 'session.invite' as const,
    readAt: null,
    requiresAction: true,
    actionTakenAt: null,
    createdAt: new Date(),
    context: {
      campaignId: new mongoose.Types.ObjectId(data.campaignId),
      sessionInviteId: new mongoose.Types.ObjectId(data.sessionId),
    },
    payload: {
      sessionTitle: data.sessionTitle,
      sessionDate: data.sessionDate,
      sessionNotes: data.sessionNotes,
    },
  }))

  if (notifications.length === 0) return []

  const result = await notificationsCollection().insertMany(notifications)
  return notificationsCollection()
    .find({ _id: { $in: Object.values(result.insertedIds) } })
    .toArray()
}
