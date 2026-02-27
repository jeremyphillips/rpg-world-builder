import mongoose from 'mongoose'
import { env } from '../config/env'
import * as notificationService from './notification.service'
import * as sessionInviteService from './sessionInvite.service'

const db = () => mongoose.connection.useDb(env.DB_NAME)
const sessionsCollection = () => db().collection('sessions')
const campaignsCollection = () => db().collection('campaigns')
const campaignMembersCollection = () => db().collection('campaignMembers')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled'

export interface SessionDoc {
  campaignId: mongoose.Types.ObjectId
  date: string // ISO
  title?: string
  notes?: string
  status: SessionStatus
  visibility: {
    allCharacters: boolean
    characterIds: string[]
  }
  createdAt: Date
  updatedAt: Date
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getSessionsForUser(userId: string, role: string) {
  const oid = new mongoose.Types.ObjectId(userId)

  // Find campaigns the user belongs to (admin or member)
  const memberCampaignIds = await campaignMembersCollection()
    .distinct('campaignId', { userId: oid })

  const campaigns = await campaignsCollection()
    .find({
      $or: [
        { 'membership.ownerId': oid },
        { _id: { $in: memberCampaignIds } },
      ],
    })
    .project({ _id: 1 })
    .toArray()

  const campaignIds = campaigns.map((c) => c._id)

  if (role === 'admin' || role === 'superadmin') {
    return sessionsCollection().find().sort({ date: -1 }).toArray()
  }

  return sessionsCollection()
    .find({ campaignId: { $in: campaignIds } })
    .sort({ date: -1 })
    .toArray()
}

export async function getSessionById(id: string) {
  return sessionsCollection().findOne({
    _id: new mongoose.Types.ObjectId(id),
  })
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export async function createSession(
  adminUserId: string,
  data: {
    campaignId: string
    date: string
    title?: string
    notes?: string
    visibility?: { allCharacters: boolean; characterIds: string[] }
  },
) {
  const now = new Date()

  const doc: SessionDoc = {
    campaignId: new mongoose.Types.ObjectId(data.campaignId),
    date: data.date,
    title: data.title,
    notes: data.notes,
    status: 'scheduled',
    visibility: data.visibility ?? { allCharacters: true, characterIds: [] },
    createdAt: now,
    updatedAt: now,
  }

  const result = await sessionsCollection().insertOne(doc)
  const session = await sessionsCollection().findOne({ _id: result.insertedId })

  // Notify all campaign members (excluding the admin who created it)
  const approvedMembers = await campaignMembersCollection()
    .find({ campaignId: new mongoose.Types.ObjectId(data.campaignId), status: 'approved' })
    .project({ userId: 1 })
    .toArray()

  const memberUserIds = approvedMembers
    .map((m) => (m.userId as mongoose.Types.ObjectId).toString())
    .filter((uid) => uid !== adminUserId)

  if (memberUserIds.length > 0) {

    // Create trackable session invite records
    await sessionInviteService.createSessionInvites({
      sessionId: result.insertedId.toString(),
      campaignId: data.campaignId,
      memberUserIds,
    })

    // Send session invite notifications
    await notificationService.createSessionInviteNotifications({
      sessionId: result.insertedId.toString(),
      campaignId: data.campaignId,
      memberUserIds,
      sessionTitle: data.title ?? 'New Session',
      sessionDate: data.date,
      sessionNotes: data.notes,
    })
  }

  return session
}

export async function updateSession(
  id: string,
  data: Partial<Pick<SessionDoc, 'title' | 'notes' | 'date' | 'status'>>,
) {
  return sessionsCollection().findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: 'after' },
  )
}

export async function deleteSession(id: string, adminUserId: string) {
  const sessionOid = new mongoose.Types.ObjectId(id)

  // Fetch session before deleting so we can include details in the notification
  const session = await sessionsCollection().findOne({ _id: sessionOid })
  if (!session) return { deletedCount: 0 }

  // Find all invited members for this session
  const invites = await db()
    .collection('sessionInvites')
    .find({ sessionId: sessionOid })
    .toArray()

  const memberUserIds = invites
    .map((inv) => inv.userId.toString())
    .filter((uid: string) => uid !== adminUserId)

  // Send cancellation notifications
  if (memberUserIds.length > 0) {
    const notifications = memberUserIds.map((userId: string) => ({
      userId: new mongoose.Types.ObjectId(userId),
      type: 'session.cancelled' as const,
      readAt: null,
      requiresAction: false,
      actionTakenAt: null,
      createdAt: new Date(),
      context: {
        campaignId: session.campaignId,
      },
      payload: {
        sessionTitle: session.title ?? 'a session',
        sessionDate: session.date,
      },
    }))
    await db().collection('notifications').insertMany(notifications)
  }

  // Clean up session invites
  await db().collection('sessionInvites').deleteMany({ sessionId: sessionOid })

  return sessionsCollection().deleteOne({ _id: sessionOid })
}
