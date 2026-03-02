import mongoose from 'mongoose'
import { env } from '../config/env'
import type { CampaignMemberStoredRole } from '../../shared/types'
import { getPublicUrl } from '../services/image.service'

const db = () => mongoose.connection.useDb(env.DB_NAME)
const campaignsCollection = () => db().collection('campaigns')
const campaignMembersCollection = () => db().collection('campaignMembers')

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/** Resolve the campaign owner ID, preferring ownerId with adminId as migration fallback. */
function resolveOwnerId(membership: any) {
  return membership?.ownerId ?? membership?.adminId
}

export function normalizeCampaign(campaign: any, memberCount?: number) {
  if (!campaign) return null

  const { imageKey, ...identityRest } = campaign.identity ?? {}

  return {
    _id: campaign._id,

    identity: {
      ...identityRest,
      imageUrl: getPublicUrl(imageKey),
    },
    configuration: campaign.configuration,
    membership: {
      ownerId: resolveOwnerId(campaign.membership),
    },
    participation: campaign.participation,
    memberCount: memberCount ?? 0,

    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
  }
}

// ---------------------------------------------------------------------------
// Campaign CRUD
// ---------------------------------------------------------------------------

export async function getCampaignsForUser(userId: string, role: string) {
  const oid = new mongoose.Types.ObjectId(userId)

  // Get campaign IDs from CampaignMembers where user is a member
  const memberCampaignIds = await campaignMembersCollection()
    .distinct('campaignId', { userId: oid })

  const campaigns = await campaignsCollection()
    .find({
      $or: [
        { 'membership.ownerId': oid },
        { _id: { $in: memberCampaignIds } },
      ],
    })
    .toArray()

  // Batch-count approved members per campaign
  const campaignIds = campaigns.map((c) => c._id)
  const memberCounts = await campaignMembersCollection()
    .aggregate([
      { $match: { campaignId: { $in: campaignIds }, status: 'approved' } },
      { $group: { _id: '$campaignId', count: { $sum: 1 } } },
    ])
    .toArray()

  const countMap = new Map(memberCounts.map((mc) => [mc._id.toString(), mc.count as number]))

  return campaigns.map((c) => normalizeCampaign(c, countMap.get(c._id.toString()) ?? 0))
}

/** Returns the set of campaign IDs (from `campaignIds`) that `userId` owns. */
export async function getOwnedCampaignIds(
  userId: string,
  campaignIds: string[],
): Promise<Set<string>> {
  if (campaignIds.length === 0) return new Set()
  const oid = new mongoose.Types.ObjectId(userId)
  const campaigns = await campaignsCollection()
    .find({
      _id: { $in: campaignIds.map((id) => new mongoose.Types.ObjectId(id)) },
      $or: [{ 'membership.ownerId': oid }],
    })
    .project({ _id: 1 })
    .toArray()
  return new Set(campaigns.map((c) => c._id.toString()))
}

export async function getCampaignById(id: string) {
  const campaignId = new mongoose.Types.ObjectId(id)
  const campaign = await campaignsCollection().findOne({ _id: campaignId })
  if (!campaign) return null

  const memberCount = await campaignMembersCollection().countDocuments({
    campaignId,
    status: 'approved',
  })

  return normalizeCampaign(campaign, memberCount)
}

export async function createCampaign(
  ownerId: string,
  data: { name: string; setting: string; edition: string; description?: string }
) {
  const now = new Date()
  const ownerOid = new mongoose.Types.ObjectId(ownerId)

  const result = await campaignsCollection().insertOne({
    identity: {
      name: data.name,
      description: data.description ?? '',
      setting: data.setting,
      edition: data.edition
    },
    configuration: {
      rules: {}
    },
    membership: {
      ownerId: ownerOid,
    },
    participation: {
      characters: []
    },
    createdAt: now,
    updatedAt: now,
  })

  const campaign = await campaignsCollection().findOne({ _id: result.insertedId })
  return normalizeCampaign(campaign)
}

export async function updateCampaign(
  id: string,
  data: {
    name?: string
    setting?: string
    edition?: string
    description?: string
    imageKey?: string | null
  }
) {
  const $set: Record<string, unknown> = { updatedAt: new Date() }

  if (data.name !== undefined) {
    $set['identity.name'] = data.name
  }
  if (data.description !== undefined) {
    $set['identity.description'] = data.description
  }
  if (data.setting !== undefined) {
    $set['identity.setting'] = data.setting
  }
  if (data.edition !== undefined) {
    $set['identity.edition'] = data.edition
  }
  if (data.imageKey !== undefined) {
    $set['identity.imageKey'] = data.imageKey
  }

  const campaign = await campaignsCollection().findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set },
    { returnDocument: 'after' },
  )
  return normalizeCampaign(campaign)
}

export async function deleteCampaign(id: string) {
  return campaignsCollection().deleteOne({ _id: new mongoose.Types.ObjectId(id) })
}

// ---------------------------------------------------------------------------
// Members — subdocument { userId, role, joinedAt }
// ---------------------------------------------------------------------------

export async function getMembers(campaignId: string) {
  const usersCollection = () => db().collection('users')
  const members = await campaignMembersCollection()
    .find({ campaignId: new mongoose.Types.ObjectId(campaignId) })
    .toArray()

  if (members.length === 0) return []

  const memberUserIds = (members as unknown as { userId: mongoose.Types.ObjectId }[]).map((m) => m.userId)
  const uniqueUserIds = [...new Map(memberUserIds.map((id) => [id.toString(), id])).values()]

  const users = await usersCollection()
    .find(
      { _id: { $in: uniqueUserIds } },
      { projection: { passwordHash: 0 } },
    )
    .toArray()

  return users.map((u) => {
    const membership = (members as unknown as { userId: mongoose.Types.ObjectId; role: string; joinedAt: Date }[]).find(
      (m) => m.userId.equals(u._id),
    )
    return {
      ...u,
      campaignRole: membership?.role ?? 'pc',
      joinedAt: membership?.joinedAt ?? null,
    }
  })
}

export async function getMembersForMessaging(campaignId: string) {
  const campaign = await getCampaignById(campaignId)
  if (!campaign) return []

  const usersCollection = () => db().collection('users')
  const ownerId = resolveOwnerId(campaign.membership) as mongoose.Types.ObjectId

  const approvedMembers = await campaignMembersCollection()
    .find({
      campaignId: new mongoose.Types.ObjectId(campaignId),
      status: 'approved',
    })
    .toArray()

  const memberUserIds = new Set<string>()
  memberUserIds.add(ownerId.toString())
  ;(approvedMembers as { userId: mongoose.Types.ObjectId }[]).forEach((m) =>
    memberUserIds.add(m.userId.toString())
  )

  const users = await usersCollection()
    .find(
      { _id: { $in: [...memberUserIds].map((id) => new mongoose.Types.ObjectId(id)) } },
      { projection: { _id: 1, username: 1 } },
    )
    .toArray()

  return users.map((u) => ({
    _id: (u._id as mongoose.Types.ObjectId).toString(),
    username: u.username as string,
  }))
}

export async function getPartyCharacters(campaignId: string, status?: string) {
  const usersCol = () => db().collection('users')
  const charsCol = () => db().collection('characters')

  const campaign = await getCampaignById(campaignId)
  if (!campaign) return []

  const allowedStatuses = ['pending', 'approved']
  const statusFilter =
    status && allowedStatuses.includes(status) ? status : { $in: allowedStatuses }

  const members = await campaignMembersCollection()
    .find({
      campaignId: new mongoose.Types.ObjectId(campaignId),
      status: statusFilter,
    })
    .sort({ joinedAt: 1, requestedAt: 1 })
    .toArray()

  const memberDocs = members as unknown as {
    _id: mongoose.Types.ObjectId
    characterId: mongoose.Types.ObjectId
    status: string
    joinedAt?: Date
    requestedAt?: Date
  }[]

  const characterIds = memberDocs.map((m) => m.characterId)
  if (characterIds.length === 0) return []

  const characters = await charsCol()
    .find({ _id: { $in: characterIds } })
    .toArray()

  const memberByCharId = new Map(
    memberDocs.map((m) => [m.characterId.toString(), m])
  )

  const userIds = [...new Set(characters.map((c) => (c.userId as mongoose.Types.ObjectId).toString()))]
  const users = await usersCol()
    .find(
      { _id: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) } },
      { projection: { username: 1, avatarKey: 1 } },
    )
    .toArray()

  const userMap = new Map(
    users.map((u) => [
      u._id.toString(),
      { username: u.username as string, avatarUrl: getPublicUrl(u.avatarKey as string) },
    ]),
  )

  return characters.map((c) => {
    const m = memberByCharId.get(c._id.toString())
    const status = (m?.status ?? 'approved') as 'pending' | 'approved'
    const owner = userMap.get((c.userId as mongoose.Types.ObjectId).toString())
    return {
      ...c,
      ownerName: owner?.username ?? 'Unknown',
      ownerAvatarUrl: owner?.avatarUrl,
      status,
      campaignMemberId: m?._id?.toString(),
    }
  })
}

export async function updateMemberRole(
  campaignId: string,
  userId: string,
  role: CampaignMemberStoredRole
) {
  const uid = new mongoose.Types.ObjectId(userId)
  await campaignMembersCollection().updateMany(
    {
      campaignId: new mongoose.Types.ObjectId(campaignId),
      userId: uid,
    },
    { $set: { role } },
  )
  return getCampaignById(campaignId)
}

export async function removeMember(campaignId: string, userId: string) {
  const uid = new mongoose.Types.ObjectId(userId)
  await campaignMembersCollection().deleteMany({
    campaignId: new mongoose.Types.ObjectId(campaignId),
    userId: uid,
  })
  return getCampaignById(campaignId)
}
