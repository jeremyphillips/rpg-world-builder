import mongoose from 'mongoose'
import { env } from '../shared/config/env'
import { getDb, toObjectId } from '../shared/utils/db'
import { badRequest, forbidden, notFound } from '../shared/errors/ApiError'
import { getCampaignById } from './campaign.service'
import { getPublicUrl } from './image.service'
import * as notificationService from './notification.service'
import type {
  CampaignMemberStatus,
  CampaignMemberStoredRole,
  CampaignCharacterStatus,
  CampaignMemberView,
} from '../../shared/types'

const db = () => mongoose.connection.useDb(env.DB_NAME)
const campaignMembersCollection = () => db().collection('campaignMembers')
const usersCollection = () => db().collection('users')
const charactersCollection = () => db().collection('characters')

export interface CampaignMemberDoc {
  _id: mongoose.Types.ObjectId
  campaignId: mongoose.Types.ObjectId
  characterId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  role: CampaignMemberStoredRole
  status: CampaignMemberStatus
  /** Character's in-campaign status (active by default, can be set to inactive/deceased) */
  characterStatus?: CampaignCharacterStatus
  requestedAt: Date
  approvedAt?: Date
  approvedBy?: mongoose.Types.ObjectId
  joinedAt?: Date
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getCampaignMembersByCampaign(campaignId: string) {
  return campaignMembersCollection()
    .find({ campaignId: new mongoose.Types.ObjectId(campaignId) })
    .sort({ joinedAt: 1 })
    .toArray()
}

/** Find single campaign member by character ID (e.g. for invite flow). */
export async function getCampaignMemberByCharacterId(characterId: string) {
  return campaignMembersCollection().findOne({
    characterId: new mongoose.Types.ObjectId(characterId),
  })
}

export async function getCampaignMembersByCharacter(characterId: string) {
  return campaignMembersCollection()
    .find({
      characterId: new mongoose.Types.ObjectId(characterId),
      status: { $in: ['pending', 'approved'] },
    })
    .toArray()
}

export async function isCharacterInCampaign(characterId: string): Promise<boolean> {
  const existing = await campaignMembersCollection().findOne({
    characterId: new mongoose.Types.ObjectId(characterId),
    status: { $in: ['pending', 'approved'] },
  })
  return !!existing
}

// ---------------------------------------------------------------------------
// Viewer context
// ---------------------------------------------------------------------------

export interface ViewerMembershipContext {
  viewerCharacterIds: string[]
  viewerHasPending: boolean
  viewerHasApproved: boolean
  allMembers: CampaignMemberDoc[]
}

/**
 * Derives the requesting user's membership context from CampaignMember docs.
 *
 * Uses getCampaignMembersByCampaign and compares ObjectIds properly so the
 * caller never has to deal with string vs ObjectId mismatches.
 */
export async function getViewerMembershipContext(
  campaignId: string,
  userId: string,
): Promise<ViewerMembershipContext> {
  const rawMembers = await getCampaignMembersByCampaign(campaignId)
  const allMembers = rawMembers as unknown as CampaignMemberDoc[]

  const uid = new mongoose.Types.ObjectId(userId)

  const viewerApproved: CampaignMemberDoc[] = []
  let viewerHasPending = false

  for (const m of allMembers) {
    if (!(m.userId as mongoose.Types.ObjectId).equals(uid)) continue
    if ((m.status as string) === 'approved') viewerApproved.push(m)
    else if ((m.status as string) === 'pending') viewerHasPending = true
  }

  return {
    viewerCharacterIds: viewerApproved.map(
      (m) => (m.characterId as mongoose.Types.ObjectId).toString(),
    ),
    viewerHasPending,
    viewerHasApproved: viewerApproved.length > 0,
    allMembers,
  }
}

// ---------------------------------------------------------------------------
// Hydration — batch-resolve user + character info for member rows
// ---------------------------------------------------------------------------

/**
 * Builds the `CampaignMemberView[]` array for API responses.
 *
 * Fetches User and Character docs in two `$in` queries (one per collection),
 * then joins them with the member docs.  The resulting rows are sorted by
 * `joinedAt` ascending (matching the service sort).
 */
export async function hydrateMemberViews(
  members: CampaignMemberDoc[],
): Promise<CampaignMemberView[]> {
  if (members.length === 0) return []

  const uniqueUserIds = [
    ...new Map(
      members.map((m) => [m.userId.toString(), m.userId]),
    ).values(),
  ]
  const uniqueCharIds = [
    ...new Map(
      members.map((m) => [m.characterId.toString(), m.characterId]),
    ).values(),
  ]

  const [userDocs, charDocs] = await Promise.all([
    usersCollection()
      .find(
        { _id: { $in: uniqueUserIds } },
        { projection: { username: 1, avatarKey: 1 } },
      )
      .toArray(),
    charactersCollection()
      .find(
        { _id: { $in: uniqueCharIds } },
        { projection: { name: 1, imageKey: 1 } },
      )
      .toArray(),
  ])

  const userMap = new Map(
    userDocs.map((u) => [
      u._id.toString(),
      {
        name: (u.username as string) ?? 'Unknown',
        avatarUrl: getPublicUrl(u.avatarKey as string) ?? null,
      },
    ]),
  )
  const charMap = new Map(
    charDocs.map((c) => [
      c._id.toString(),
      {
        name: (c.name as string) ?? 'Unnamed',
        imageUrl: getPublicUrl(c.imageKey as string) ?? null,
      },
    ]),
  )

  return members.map((m): CampaignMemberView => {
    const uid = m.userId.toString()
    const cid = m.characterId.toString()
    const user = userMap.get(uid)
    const char = charMap.get(cid)

    return {
      campaignMemberId: m._id.toString(),
      status: m.status as CampaignMemberStatus,
      characterStatus: (m.characterStatus as CampaignCharacterStatus) ?? 'active',
      joinedAt: m.joinedAt ? m.joinedAt.toISOString() : null,
      user: {
        id: uid,
        name: user?.name ?? 'Unknown',
        avatarUrl: user?.avatarUrl ?? null,
      },
      character: {
        id: cid,
        name: char?.name ?? 'Unnamed',
        imageUrl: char?.imageUrl ?? null,
      },
    }
  })
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export async function createCampaignMember(data: {
  campaignId: string
  characterId: string
  userId: string
  role: CampaignMemberStoredRole
  status?: CampaignMemberStatus
}) {
  const now = new Date()
  const status = data.status ?? 'approved'
  const doc: Record<string, unknown> = {
    campaignId: new mongoose.Types.ObjectId(data.campaignId),
    characterId: new mongoose.Types.ObjectId(data.characterId),
    userId: new mongoose.Types.ObjectId(data.userId),
    role: data.role,
    status,
    requestedAt: now,
  }
  if (status === 'approved') {
    doc.approvedAt = now
    doc.joinedAt = now
  }
  const result = await campaignMembersCollection().insertOne(doc)
  return campaignMembersCollection().findOne({ _id: result.insertedId })
}

export async function getCampaignMemberById(id: string) {
  return campaignMembersCollection().findOne({
    _id: new mongoose.Types.ObjectId(id),
  })
}

export async function approveCampaignMember(
  id: string,
  approvedByUserId: string
) {
  const now = new Date()
  const updated = await campaignMembersCollection().findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id), status: 'pending' },
    {
      $set: {
        status: 'approved',
        approvedAt: now,
        approvedBy: new mongoose.Types.ObjectId(approvedByUserId),
        joinedAt: now,
      },
    },
    { returnDocument: 'after' },
  )
  return updated
}

export async function rejectCampaignMember(id: string) {
  const updated = await campaignMembersCollection().findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id), status: 'pending' },
    { $set: { status: 'rejected' } },
    { returnDocument: 'after' },
  )
  return updated
}

export async function updateCharacterStatus(
  id: string,
  characterStatus: CampaignCharacterStatus,
) {
  return campaignMembersCollection().findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set: { characterStatus } },
    { returnDocument: 'after' },
  )
}

// ---------------------------------------------------------------------------
// Orchestrated commands (with notifications)
// ---------------------------------------------------------------------------

const VALID_CHARACTER_STATUSES: CampaignCharacterStatus[] = ['active', 'inactive', 'deceased']

/**
 * Approve a pending campaign member and send notifications.
 * Throws ApiError on 404, 400, or 403.
 */
export async function approveMemberWithNotifications(
  memberId: string,
  userId: string,
) {
  const member = await getCampaignMemberById(memberId)
  if (!member) throw notFound('Campaign member not found')

  const m = member as { status: string; campaignId: mongoose.Types.ObjectId }
  if (m.status !== 'pending') throw badRequest('Campaign member is not pending approval')

  const campaign = await getCampaignById(m.campaignId.toString())
  if (!campaign) throw notFound('Campaign not found')

  const ownerId = campaign.membership?.ownerId
  if (!ownerId?.equals(toObjectId(userId))) {
    throw forbidden('Only the campaign owner can approve characters')
  }

  const updated = await approveCampaignMember(memberId, userId)
  if (!updated) throw badRequest('Failed to approve')

  const u = updated as { userId: mongoose.Types.ObjectId; characterId: mongoose.Types.ObjectId }
  const character = await getDb().collection('characters').findOne({ _id: u.characterId })
  const characterName = character?.name as string | undefined
  const campaignName = (campaign.identity?.name as string) ?? ''

  await notificationService.createNotification({
    userId: u.userId,
    type: 'character_approved',
    requiresAction: false,
    context: { campaignId: m.campaignId, characterId: u.characterId },
    payload: { characterName, campaignName },
  })

  const approvedMembers = await getCampaignMembersByCampaign(m.campaignId.toString())
  const partyUserIds = (approvedMembers as { userId: mongoose.Types.ObjectId; status: string }[])
    .filter((mbr) => mbr.status === 'approved' && !mbr.userId.equals(u.userId))
    .map((mbr) => mbr.userId)

  for (const memberUserId of partyUserIds) {
    await notificationService.createNotification({
      userId: memberUserId,
      type: 'newPartyMember',
      requiresAction: false,
      context: { characterId: u.characterId, campaignId: m.campaignId },
      payload: { characterName, campaignName },
    })
  }

  return updated
}

/**
 * Reject a pending campaign member and send notification.
 * Throws ApiError on 404, 400, or 403.
 */
export async function rejectMemberWithNotifications(memberId: string, userId: string) {
  const member = await getCampaignMemberById(memberId)
  if (!member) throw notFound('Campaign member not found')

  const m = member as { status: string; campaignId: mongoose.Types.ObjectId }
  if (m.status !== 'pending') throw badRequest('Campaign member is not pending approval')

  const campaign = await getCampaignById(m.campaignId.toString())
  if (!campaign) throw notFound('Campaign not found')

  const ownerId = campaign.membership?.ownerId
  if (!ownerId?.equals(toObjectId(userId))) {
    throw forbidden('Only the campaign owner can reject characters')
  }

  const updated = await rejectCampaignMember(memberId)
  if (!updated) throw badRequest('Failed to reject')

  const u = updated as { userId: mongoose.Types.ObjectId; characterId: mongoose.Types.ObjectId }
  const character = await getDb().collection('characters').findOne({ _id: u.characterId })
  const characterName = character?.name as string | undefined
  const campaignName = (campaign.identity?.name as string) ?? ''

  await notificationService.createNotification({
    userId: u.userId,
    type: 'character_rejected',
    requiresAction: false,
    context: { campaignId: m.campaignId, characterId: u.characterId },
    payload: { characterName, campaignName },
  })

  return updated
}

/**
 * Update character status with permission checks and party notifications.
 * Throws ApiError on 404, 400, or 403.
 */
export async function updateCharacterStatusWithNotifications(
  memberId: string,
  userId: string,
  characterStatus: string,
) {
  if (!VALID_CHARACTER_STATUSES.includes(characterStatus as CampaignCharacterStatus)) {
    throw badRequest(
      `Invalid characterStatus. Must be one of: ${VALID_CHARACTER_STATUSES.join(', ')}`,
    )
  }

  const member = await getCampaignMemberById(memberId)
  if (!member) throw notFound('Campaign member not found')

  const m = member as {
    campaignId: mongoose.Types.ObjectId
    characterId: mongoose.Types.ObjectId
    userId: mongoose.Types.ObjectId
    status: string
    characterStatus?: string
  }

  const campaign = await getCampaignById(m.campaignId.toString())
  if (!campaign) throw notFound('Campaign not found')

  const ownerId = campaign.membership?.ownerId
  const isCampaignOwner = ownerId?.equals(toObjectId(userId)) ?? false
  const isCharacterOwner = m.userId.equals(toObjectId(userId))

  if (!isCampaignOwner && !isCharacterOwner) {
    throw forbidden("You do not have permission to update this character's status")
  }

  if (isCharacterOwner && !isCampaignOwner && characterStatus !== 'inactive') {
    throw forbidden('You can only set your character to inactive (leave campaign)')
  }

  const updated = await updateCharacterStatus(memberId, characterStatus as CampaignCharacterStatus)
  if (!updated) throw badRequest('Failed to update character status')

  const character = await getDb().collection('characters').findOne({ _id: m.characterId })
  const characterName = (character?.name as string) ?? 'Unknown'
  const campaignName = (campaign.identity?.name as string) ?? ''

  const approvedMembers = await getCampaignMembersByCampaign(m.campaignId.toString())
  const partyUserIds = (approvedMembers as { userId: mongoose.Types.ObjectId; status: string }[])
    .filter((mbr) => mbr.status === 'approved' && !mbr.userId.equals(toObjectId(userId)))
    .map((mbr) => mbr.userId)

  const notificationType = characterStatus === 'deceased' ? 'character.deceased' : 'character.left'
  for (const memberUserId of partyUserIds) {
    await notificationService.createNotification({
      userId: memberUserId,
      type: notificationType,
      requiresAction: false,
      context: { characterId: m.characterId, campaignId: m.campaignId },
      payload: { characterName, campaignName },
    })
  }

  return updated
}

export async function deleteCampaignMember(campaignId: string, characterId: string) {
  return campaignMembersCollection().deleteOne({
    campaignId: new mongoose.Types.ObjectId(campaignId),
    characterId: new mongoose.Types.ObjectId(characterId),
  })
}

// ---------------------------------------------------------------------------
// Pre-check and add member (for campaign add-member flow)
// ---------------------------------------------------------------------------

export type PreCheckMemberResult =
  | { status: 'no_account' }
  | { status: 'ok'; userName: string }
  | { status: 'active_character'; userName: string }
  | { status: 'already_member'; userName: string }

/**
 * Pre-check whether a user can be added to a campaign by email.
 * Returns status and userName for the controller response.
 */
export async function preCheckMember(
  campaignId: string,
  email: string,
): Promise<PreCheckMemberResult> {
  const db = getDb()
  const user = await db.collection('users').findOne({ email })

  if (!user) {
    return { status: 'no_account' }
  }

  const userName = (user.username as string) ?? email

  const member = await campaignMembersCollection().findOne({
    campaignId: toObjectId(campaignId),
    userId: user._id,
    status: { $in: ['pending', 'approved'] },
  })

  if (!member) {
    return { status: 'ok', userName }
  }

  const characterStatus = (member as { characterStatus?: string }).characterStatus ?? 'active'
  if (characterStatus === 'active') {
    return { status: 'active_character', userName }
  }

  return { status: 'already_member', userName }
}

export type AddMemberOrInviteResult =
  | { type: 'email_sent'; message: string }
  | { type: 'invite_created'; invite: unknown; message: string }

/**
 * Add a member by email: send invite email if no account, create invite if user exists.
 */
export async function addMemberOrInvite(
  campaignId: string,
  email: string,
  role: CampaignMemberStoredRole,
  invitedByUserId: string,
): Promise<AddMemberOrInviteResult> {
  const db = getDb()
  const user = await db.collection('users').findOne({ email })

  const validRoles: CampaignMemberStoredRole[] = ['dm', 'co_dm', 'pc']
  const memberRole = validRoles.includes(role) ? role : 'pc'

  const campaign = await getCampaignById(campaignId)
  if (!campaign) throw notFound('Campaign not found')

  const campaignName = (campaign.identity?.name as string) ?? ''
  const ownerId = campaign.membership?.ownerId ?? campaign.membership?.adminId
  const ownerUser = ownerId
    ? await db.collection('users').findOne({ _id: ownerId }, { projection: { username: 1 } })
    : null
  const invitedByName = (ownerUser?.username as string) ?? 'A dungeon master'

  if (!user) {
    const { createInviteToken } = await import('./invite.service')
    const { sendCampaignInvite } = await import('./email.service')

    const inviteToken = await createInviteToken({
      campaignId,
      email,
      invitedByUserId,
      role: memberRole,
    })

    await sendCampaignInvite({
      to: email,
      campaignName,
      invitedBy: invitedByName,
      inviteToken,
    })

    return { type: 'email_sent', message: `Invite email sent to ${email}` }
  }

  const { createInvite } = await import('./invite.service')
  const invite = await createInvite({
    campaignId,
    invitedUserId: user._id.toString(),
    invitedByUserId,
    role: memberRole,
    campaignName,
    invitedByName,
  })

  return { type: 'invite_created', invite, message: `Invite sent to ${email}` }
}

/** Returns the character IDs belonging to `userId` in the given campaign. */
export async function getUserCharacterIds(
  campaignId: string,
  userId: string,
): Promise<string[]> {
  const members = await campaignMembersCollection()
    .find({
      campaignId: new mongoose.Types.ObjectId(campaignId),
      userId: new mongoose.Types.ObjectId(userId),
      status: 'approved',
    })
    .toArray()

  return members.map((m) => (m.characterId as mongoose.Types.ObjectId).toString())
}

/**
 * Batch-resolves a user's campaign membership across multiple campaigns.
 *
 * Returns a map of campaignId → { campaignRole, characterIds } where
 * `campaignRole` is the effective CampaignRole ('dm' | 'pc').
 */
export async function getUserMembershipsMap(
  userId: string,
  campaignIds: string[],
): Promise<Map<string, { campaignRole: 'dm' | 'pc'; characterIds: string[] }>> {
  if (campaignIds.length === 0) return new Map()

  const members = await campaignMembersCollection()
    .find({
      userId: new mongoose.Types.ObjectId(userId),
      campaignId: { $in: campaignIds.map((id) => new mongoose.Types.ObjectId(id)) },
      status: 'approved',
    })
    .toArray()

  const map = new Map<string, { campaignRole: 'dm' | 'pc'; characterIds: string[] }>()
  for (const m of members) {
    const cid = (m.campaignId as mongoose.Types.ObjectId).toString()
    const charId = (m.characterId as mongoose.Types.ObjectId).toString()
    const storedRole = m.role as string
    const isDmLevel = storedRole === 'dm' || storedRole === 'co_dm'

    const existing = map.get(cid)
    if (existing) {
      existing.characterIds.push(charId)
      if (isDmLevel) existing.campaignRole = 'dm'
    } else {
      map.set(cid, {
        campaignRole: isDmLevel ? 'dm' : 'pc',
        characterIds: [charId],
      })
    }
  }
  return map
}
