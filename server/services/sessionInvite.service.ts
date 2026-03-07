import mongoose from 'mongoose'
import { env } from '../shared/config/env'
import * as notificationService from './notification.service'

const db = () => mongoose.connection.useDb(env.DB_NAME)
const sessionInvitesCollection = () => db().collection('sessionInvites')
const campaignsCollection = () => db().collection('campaigns')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SessionInviteStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export interface SessionInviteDoc {
  sessionId: mongoose.Types.ObjectId
  campaignId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  status: SessionInviteStatus
  createdAt: Date
  respondedAt: Date | null
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getSessionInviteById(id: string) {
  return sessionInvitesCollection().findOne({
    _id: new mongoose.Types.ObjectId(id),
  })
}

export async function getSessionInvitesForSession(sessionId: string) {
  return sessionInvitesCollection()
    .find({ sessionId: new mongoose.Types.ObjectId(sessionId) })
    .toArray()
}

export async function getSessionInviteForUser(sessionId: string, userId: string) {
  return sessionInvitesCollection().findOne({
    sessionId: new mongoose.Types.ObjectId(sessionId),
    userId: new mongoose.Types.ObjectId(userId),
  })
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/**
 * Create session invites for all campaign members.
 * Called when a new session is created.
 */
export async function createSessionInvites(data: {
  sessionId: string
  campaignId: string
  memberUserIds: string[]
}) {
  if (data.memberUserIds.length === 0) return []

  const now = new Date()
  const docs: SessionInviteDoc[] = data.memberUserIds.map((uid) => ({
    sessionId: new mongoose.Types.ObjectId(data.sessionId),
    campaignId: new mongoose.Types.ObjectId(data.campaignId),
    userId: new mongoose.Types.ObjectId(uid),
    status: 'pending' as const,
    createdAt: now,
    respondedAt: null,
  }))

  const result = await sessionInvitesCollection().insertMany(docs)
  return sessionInvitesCollection()
    .find({ _id: { $in: Object.values(result.insertedIds) } })
    .toArray()
}

/**
 * Accept or decline a session invite.
 * Sends a notification to the campaign admin.
 */
export async function respondToSessionInvite(
  inviteId: string,
  userId: string,
  accept: boolean,
) {
  const invite = await getSessionInviteById(inviteId)
  if (!invite) return null
  if (invite.userId.toString() !== userId) return null
  if (invite.status !== 'pending') return invite // already responded

  const newStatus: SessionInviteStatus = accept ? 'accepted' : 'declined'

  const updated = await sessionInvitesCollection().findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(inviteId) },
    { $set: { status: newStatus, respondedAt: new Date() } },
    { returnDocument: 'after' },
  )

  // Mark the associated session.invite notification as action-taken
  const notification = await db().collection('notifications').findOne({
    userId: invite.userId,
    type: 'session.invite',
    'context.sessionInviteId': invite.sessionId, // sessionId was stored as sessionInviteId in context
  })
  if (notification) {
    await notificationService.markActionTaken(notification._id.toString(), userId)
  }

  // Notify the campaign admin about the RSVP response
  const campaign = await campaignsCollection().findOne({
    _id: invite.campaignId,
  })
  const sessionOwner = campaign?.membership?.ownerId ?? campaign?.membership?.adminId
  if (sessionOwner) {
    const adminUserId = sessionOwner.toString()
    if (adminUserId !== userId) {
      // Look up the user's name for the notification message
      const userDoc = await db().collection('users').findOne({
        _id: new mongoose.Types.ObjectId(userId),
      })
      const userName = userDoc?.name ?? userDoc?.email ?? 'A player'

      // Look up session for the date
      const sessionDoc = await db().collection('sessions').findOne({
        _id: invite.sessionId,
      })
      const sessionDate = sessionDoc?.date ?? ''
      const sessionTitle = sessionDoc?.title ?? 'a session'

      await notificationService.createNotification({
        userId: new mongoose.Types.ObjectId(adminUserId),
        type: 'session.rsvp',
        requiresAction: false,
        context: {
          campaignId: invite.campaignId,
          sessionInviteId: invite.sessionId,
        },
        payload: {
          userName,
          action: newStatus,
          sessionTitle,
          sessionDate,
          sessionId: invite.sessionId.toString(),
          campaignId: invite.campaignId.toString(),
        },
      })
    }
  }

  return updated
}
