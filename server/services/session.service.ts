import mongoose from 'mongoose'
import { env } from '../shared/config/env'
import { canViewSession } from '../../shared/domain/capabilities'
import type { ViewerContext } from '../../shared/domain/capabilities'
import type { CampaignRole } from '../../shared/types'
import {
  getUserMembershipsMap,
  getUserCharacterIds,
} from './campaignMember.service'
import { getCampaignById, getOwnedCampaignIds } from './campaign.service'
import { toSessionSummary } from '../../src/features/session/read-model'
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

const isPlatformAdmin = (role: string) => role === 'admin' || role === 'superadmin'

/**
 * Fetches sessions for user with visibility filtering applied.
 * Platform admins see all sessions; others see only sessions they can view per canViewSession.
 */
export async function getSessionsForUserWithVisibility(
  userId: string,
  userRole: string,
): Promise<ReturnType<typeof toSessionSummary>[]> {
  const sessions = await getSessionsForUser(userId, userRole)

  if (isPlatformAdmin(userRole)) {
    return sessions.map((s) => toSessionSummary(s as unknown as Parameters<typeof toSessionSummary>[0]))
  }

  const campaignIds = [
    ...new Set(
      sessions
        .map((s) => (s.campaignId as mongoose.Types.ObjectId)?.toString())
        .filter((id): id is string => !!id),
    ),
  ]

  const [membershipsMap, ownedIds] = await Promise.all([
    getUserMembershipsMap(userId, campaignIds),
    getOwnedCampaignIds(userId, campaignIds),
  ])

  const filtered = sessions.filter((s) => {
    const cid = (s.campaignId as mongoose.Types.ObjectId)?.toString()
    if (!cid) return false
    const membership = membershipsMap.get(cid)
    const ctx: ViewerContext = {
      campaignRole: (membership?.campaignRole as CampaignRole) ?? null,
      isOwner: ownedIds.has(cid),
      isPlatformAdmin: false,
      characterIds: membership?.characterIds ?? [],
    }
    return canViewSession(
      ctx,
      s.visibility as SessionDoc['visibility'],
    )
  })

  return filtered.map((s) =>
    toSessionSummary(s as unknown as Parameters<typeof toSessionSummary>[0]),
  )
}

/**
 * Fetches a single session by ID with access check.
 * Returns null if not found or if user lacks visibility.
 */
export async function getSessionByIdWithAccess(
  id: string,
  userId: string,
  userRole: string,
): Promise<ReturnType<typeof toSessionSummary> | null> {
  const doc = await getSessionById(id)
  if (!doc) return null

  if (isPlatformAdmin(userRole)) {
    return toSessionSummary(doc as unknown as Parameters<typeof toSessionSummary>[0])
  }

  const cid = (doc.campaignId as mongoose.Types.ObjectId)?.toString()
  if (!cid) return null

  const campaign = await getCampaignById(cid)
  const ownerStr = campaign?.membership?.ownerId?.toString()
  const isOwner = ownerStr === userId
  const charIds = await getUserCharacterIds(cid, userId)
  const members = await getUserMembershipsMap(userId, [cid])
  const membership = members.get(cid)

  const ctx: ViewerContext = {
    campaignRole: (membership?.campaignRole as CampaignRole) ?? null,
    isOwner,
    isPlatformAdmin: false,
    characterIds: charIds,
  }

  if (!canViewSession(ctx, doc.visibility as SessionDoc['visibility'])) {
    return null
  }

  return toSessionSummary(doc as unknown as Parameters<typeof toSessionSummary>[0])
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
): Promise<ReturnType<typeof toSessionSummary> | null> {
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
    ? toSessionSummary(session as unknown as Parameters<typeof toSessionSummary>[0])
    : null
}

export async function updateSession(
  id: string,
  data: Partial<Pick<SessionDoc, 'title' | 'notes' | 'date' | 'status'>>,
): Promise<ReturnType<typeof toSessionSummary> | null> {
  const doc = await sessionsCollection().findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: 'after' },
  )
  return doc
    ? toSessionSummary(doc as unknown as Parameters<typeof toSessionSummary>[0])
    : null
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
