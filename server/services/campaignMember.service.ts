import mongoose from 'mongoose'
import { env } from '../config/env'
import type { CampaignMemberStatus, CampaignMemberStoredRole, CampaignCharacterStatus } from '../../shared/types'
const db = () => mongoose.connection.useDb(env.DB_NAME)
const campaignMembersCollection = () => db().collection('campaignMembers')

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

export async function getCampaignMemberByCharacter(characterId: string) {
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

export async function deleteCampaignMember(campaignId: string, characterId: string) {
  return campaignMembersCollection().deleteOne({
    campaignId: new mongoose.Types.ObjectId(campaignId),
    characterId: new mongoose.Types.ObjectId(characterId),
  })
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
