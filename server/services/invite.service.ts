import crypto from 'crypto'
import mongoose from 'mongoose'
import { env } from '../shared/config/env'
import { notFound, forbidden } from '../shared/errors/ApiError'
import * as notificationService from './notification.service'
import type { CampaignMemberStatus, CampaignMemberStoredRole } from '../../shared/types'
const db = () => mongoose.connection.useDb(env.DB_NAME)
const invitesCollection = () => db().collection('campaignInvites')
const inviteTokensCollection = () => db().collection('inviteTokens')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export interface CampaignInviteDoc {
  campaignId: mongoose.Types.ObjectId
  invitedUserId: mongoose.Types.ObjectId
  invitedByUserId: mongoose.Types.ObjectId
  role: CampaignMemberStoredRole
  status: CampaignMemberStatus
  createdAt: Date
  respondedAt: Date | null
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getInviteById(id: string) {
  return invitesCollection().findOne({
    _id: new mongoose.Types.ObjectId(id),
  })
}

export interface InviteEnrichedDto {
  _id: mongoose.Types.ObjectId
  campaignId: mongoose.Types.ObjectId
  invitedUserId: mongoose.Types.ObjectId
  invitedByUserId: mongoose.Types.ObjectId
  role: CampaignMemberStoredRole
  status: CampaignMemberStatus
  createdAt: Date
  respondedAt: Date | null
  campaign: { _id: mongoose.Types.ObjectId; name?: string; description?: string } | null
  invitedByName: string
}

/**
 * Fetches invite with campaign and inviter details. Enforces userId check.
 * Throws ApiError.notFound() if invite does not exist.
 * Throws ApiError.forbidden() if the invite is not for the requesting user.
 */
export async function getInviteEnriched(
  inviteId: string,
  userId: string,
): Promise<InviteEnrichedDto> {
  const invite = await getInviteById(inviteId)
  if (!invite) {
    throw notFound('Invite not found')
  }
  if (invite.invitedUserId.toString() !== userId) {
    throw forbidden('Forbidden')
  }

  const [campaign, invitedBy] = await Promise.all([
    db().collection('campaigns').findOne(
      { _id: invite.campaignId },
      { projection: { identity: 1 } },
    ),
    db().collection('users').findOne(
      { _id: invite.invitedByUserId },
      { projection: { username: 1 } },
    ),
  ])

  return {
    ...invite,
    campaign: campaign
      ? {
          _id: campaign._id,
          name: (campaign.identity as { name?: string })?.name,
          description: (campaign.identity as { description?: string })?.description,
        }
      : null,
    invitedByName: (invitedBy?.username as string) ?? 'Unknown',
  } as InviteEnrichedDto
}

export async function getInvitesForUser(userId: string) {
  return invitesCollection()
    .find({ invitedUserId: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .toArray()
}

export async function getPendingInviteForCampaign(
  campaignId: string,
  invitedUserId: string,
) {
  return invitesCollection().findOne({
    campaignId: new mongoose.Types.ObjectId(campaignId),
    invitedUserId: new mongoose.Types.ObjectId(invitedUserId),
    status: 'pending',
  })
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export async function createInvite(data: {
  campaignId: string
  invitedUserId: string
  invitedByUserId: string
  role: CampaignMemberStoredRole
  campaignName: string
  invitedByName: string
}) {
  const existing = await getPendingInviteForCampaign(data.campaignId, data.invitedUserId)
  if (existing) return existing // Don't create duplicate pending invites

  const doc: CampaignInviteDoc = {
    campaignId: new mongoose.Types.ObjectId(data.campaignId),
    invitedUserId: new mongoose.Types.ObjectId(data.invitedUserId),
    invitedByUserId: new mongoose.Types.ObjectId(data.invitedByUserId),
    role: data.role,
    status: 'pending',
    createdAt: new Date(),
    respondedAt: null,
  }

  const result = await invitesCollection().insertOne(doc)
  const invite = await invitesCollection().findOne({ _id: result.insertedId })

  // Create notification for the invited user
  await notificationService.createNotification({
    userId: new mongoose.Types.ObjectId(data.invitedUserId),
    type: 'campaign.invite',
    requiresAction: true,
    context: {
      campaignId: new mongoose.Types.ObjectId(data.campaignId),
      inviteId: result.insertedId,
    },
    payload: {
      campaignName: data.campaignName,
      invitedByName: data.invitedByName,
      role: data.role,
    },
  })

  return invite
}

export async function respondToInvite(
  inviteId: string,
  userId: string,
  accept: boolean,
  characterId?: string,
) {
  const invite = await getInviteById(inviteId)
  if (!invite) return null
  if (invite.invitedUserId.toString() !== userId) return null
  if (invite.status !== 'pending') return invite // Already responded

  if (accept && !characterId) {
    throw new Error('characterId is required when accepting an invite')
  }

  const newStatus: Omit<CampaignMemberStatus, 'declined'> = accept ? 'accepted' : 'declined'

  const updatePayload: Record<string, unknown> = {
    status: newStatus,
    respondedAt: new Date(),
  }
  if (accept && characterId) {
    updatePayload.characterId = new mongoose.Types.ObjectId(characterId)
  }

  const updated = await invitesCollection().findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(inviteId) },
    { $set: updatePayload },
    { returnDocument: 'after' },
  )

  // If accepted, create CampaignMember with status pending (awaiting DM approval)
  if (accept && characterId) {
    const campaignMemberService = await import('./campaignMember.service')
    const role = invite.role === 'dm' ? 'dm' : invite.role === 'co_dm' ? 'co_dm' : 'pc'
    const member = await campaignMemberService.createCampaignMember({
      campaignId: invite.campaignId.toString(),
      characterId,
      userId,
      role,
      status: 'pending',
    })

    // Notify campaign admin about character pending approval
    const campaign = await db().collection('campaigns').findOne({ _id: invite.campaignId })
    const character = await db().collection('characters').findOne({ _id: new mongoose.Types.ObjectId(characterId) })
    const invitedUser = await db().collection('users').findOne({ _id: invite.invitedUserId })
    const campaignOwnerId = campaign?.membership?.ownerId ?? campaign?.membership?.adminId
    if (campaignOwnerId && member && character && invitedUser) {
      await notificationService.createNotification({
        userId: campaignOwnerId,
        type: 'character_pending_approval',
        requiresAction: true,
        context: {
          campaignId: invite.campaignId,
          campaignMemberId: member._id,
          characterId: member.characterId,
          invitedUserId: invite.invitedUserId,
        },
        payload: {
          characterName: character.name,
          userName: invitedUser.username,
          campaignName: campaign.identity?.name,
        },
      })
    }
  }

  // Mark the associated notification action as taken
  const notification = await db().collection('notifications').findOne({
    userId: invite.invitedUserId,
    type: 'campaign.invite',
    'context.inviteId': invite._id,
  })
  if (notification) {
    await notificationService.markActionTaken(notification._id.toString(), userId)
  }

  return updated
}

// ---------------------------------------------------------------------------
// Invite Tokens — for users who don't have an account yet
// ---------------------------------------------------------------------------

export interface InviteTokenDoc {
  token: string
  campaignId: mongoose.Types.ObjectId
  email: string
  invitedByUserId: mongoose.Types.ObjectId
  role: CampaignMemberStoredRole
  expiresAt: Date
  usedAt: Date | null
  usedByUserId: mongoose.Types.ObjectId | null
}

export async function createInviteToken(data: {
  campaignId: string
  email: string
  invitedByUserId: string
  role?: CampaignMemberStoredRole
}): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + env.INVITE_TOKEN_EXPIRY_DAYS)

  await inviteTokensCollection().insertOne({
    token,
    campaignId: new mongoose.Types.ObjectId(data.campaignId),
    email: data.email,
    invitedByUserId: new mongoose.Types.ObjectId(data.invitedByUserId),
    role: data.role ?? 'pc',
    expiresAt,
    usedAt: null,
    usedByUserId: null,
  } satisfies InviteTokenDoc)

  return token
}

export async function validateInviteToken(token: string) {
  const doc = await inviteTokensCollection().findOne({ token, usedAt: null })
  if (!doc) return null
  if (new Date() > (doc.expiresAt as Date)) return null
  return doc as unknown as InviteTokenDoc & { _id: mongoose.Types.ObjectId }
}

export async function consumeInviteToken(token: string, userId: string) {
  return inviteTokensCollection().findOneAndUpdate(
    { token, usedAt: null },
    { $set: { usedAt: new Date(), usedByUserId: new mongoose.Types.ObjectId(userId) } },
    { returnDocument: 'after' },
  )
}
