import mongoose from 'mongoose'
import { env } from '../config/env'
import type { CharacterDoc } from '../../src/features/character/domain/types/characterDoc.types'; 
import { getPublicUrl } from '../services/image.service'

const db = () => mongoose.connection.useDb(env.DB_NAME)
const charactersCollection = () => db().collection('characters')

/** Add resolved imageUrl from imageKey for API responses. */
function normalizeCharacter(doc: any) {
  if (!doc) return doc
  return { ...doc, imageUrl: getPublicUrl(doc.imageKey) }
}

export async function getCharactersByUser(userId: string, type?: string) {
  const allowedTypes = ['pc', 'npc']
  const filter: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
    deletedAt: { $exists: false },
  }
  if (type && allowedTypes.includes(type)) {
    filter.type = type
  }

  const docs = await charactersCollection()
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray()
  return docs.map(normalizeCharacter)
}

export async function getCharacterById(id: string) {
  return charactersCollection().findOne({ _id: new mongoose.Types.ObjectId(id) })
}

export function getCharacterByIdNormalized(id: string) {
  return getCharacterById(id).then(normalizeCharacter)
}

export async function createCharacter(userId: string, data: CharacterDoc) {
  const now = new Date()
  const result = await charactersCollection().insertOne({
    userId: new mongoose.Types.ObjectId(userId),
    name: data.name,
    type: data.type ?? 'pc',
    imageKey: data.imageKey ?? null,
    race: data.race ?? '',
    classes: data.classes ?? [],
    totalLevel: data.totalLevel ?? 1,
    alignment: data.alignment ?? '',
    xp: data.xp ?? 0,
    equipment: data.equipment ?? { armor: [], weapons: [], gear: [], weight: 0 },
    wealth: data.wealth ?? { gp: 0, sp: 0, cp: 0 },
    abilityScores: data.abilityScores ?? {},
    hitPoints: data.hitPoints ?? {},
    armorClass: data.armorClass ?? {},
    proficiencies: data.proficiencies ?? [],
    narrative: data.narrative ?? {},
    ai: data.ai ?? {},
    generation: data.generation ?? {},
    createdAt: now,
    updatedAt: now,
  })

  const created = await charactersCollection().findOne({ _id: result.insertedId })
  return normalizeCharacter(created)
}

export async function updateCharacter(id: string, data: Partial<CharacterData>) {
  // Strip out undefined values so we don't overwrite with undefined
  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  )
  const doc = await charactersCollection().findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set: { ...cleaned, updatedAt: new Date() } },
    { returnDocument: 'after' },
  )
  return normalizeCharacter(doc)
}

export async function deleteCharacter(id: string) {
  return charactersCollection().deleteOne({ _id: new mongoose.Types.ObjectId(id) })
}

export async function softDeleteCharacter(id: string) {
  return charactersCollection().findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set: { deletedAt: new Date() } },
    { returnDocument: 'after' },
  )
}

/**
 * Get campaigns a character is part of (via CampaignMember) or owner's campaigns.
 */
export async function getCampaignsForCharacter(characterId: string) {
  const character = await getCharacterById(characterId)
  if (!character) return []

  const userId = character.userId as mongoose.Types.ObjectId
  const campaignMembersCol = db().collection('campaignMembers')

  // Fetch campaign member docs for this character
  const memberDocs = await campaignMembersCol
    .find({
      characterId: new mongoose.Types.ObjectId(characterId),
      status: { $in: ['pending', 'approved'] },
    })
    .toArray() as { _id: mongoose.Types.ObjectId; campaignId: mongoose.Types.ObjectId; characterStatus?: string }[]

  const memberCampaignIds = memberDocs.map(m => m.campaignId)

  const campaigns = await db()
    .collection('campaigns')
    .find({
      $or: [
        { 'membership.ownerId': userId },
        { _id: { $in: memberCampaignIds } },
      ],
    })
    .project({ identity: 1, 'membership.ownerId': 1 })
    .toArray()

  const resolveOwner = (m: any) => m?.ownerId ?? m?.adminId
  const ownerIds = [...new Set(campaigns.map(c => resolveOwner(c.membership)?.toString()).filter(Boolean))]
  const usersCol = db().collection('users')
  const owners = ownerIds.length > 0
    ? await usersCol.find({ _id: { $in: ownerIds.map(id => new mongoose.Types.ObjectId(id)) } }).project({ username: 1 }).toArray()
    : []
  const ownerNameMap = new Map(owners.map(u => [u._id.toString(), u.username]))

  // Build member lookup by campaignId
  const memberByCampaignId = new Map(
    memberDocs.map(m => [m.campaignId.toString(), m]),
  )

  // Batch-count approved members per campaign
  const campaignIds = campaigns.map(c => c._id)
  const memberCounts = campaignIds.length > 0
    ? await campaignMembersCol
        .aggregate([
          { $match: { campaignId: { $in: campaignIds }, status: 'approved' } },
          { $group: { _id: '$campaignId', count: { $sum: 1 } } },
        ])
        .toArray()
    : []
  const countMap = new Map(memberCounts.map(mc => [mc._id.toString(), mc.count as number]))

  return campaigns.map(c => {
    const member = memberByCampaignId.get(c._id.toString())
    const { imageKey: campImageKey, ...identityRest } = c.identity ?? {}
    return {
      _id: c._id,
      identity: { ...identityRest, imageUrl: getPublicUrl(campImageKey) },
      dmName: ownerNameMap.get(resolveOwner(c.membership)?.toString()) ?? undefined,
      campaignMemberId: member?._id?.toString(),
      characterStatus: (member?.characterStatus ?? 'active') as string,
      memberCount: countMap.get(c._id.toString()) ?? 0,
    }
  })
}

/**
 * Get pending campaign memberships for a character that the given user (as campaign admin) can approve/reject.
 */
export async function getPendingMembershipsForAdmin(
  characterId: string,
  adminUserId: string
): Promise<{ campaignId: string; campaignName: string; campaignMemberId: string }[]> {
  const campaignMembersCol = db().collection('campaignMembers')
  const campaignsCol = db().collection('campaigns')

  const members = await campaignMembersCol
    .find({
      characterId: new mongoose.Types.ObjectId(characterId),
      status: 'pending',
    })
    .toArray()

  const result: { campaignId: string; campaignName: string; campaignMemberId: string }[] = []
  for (const m of members as { _id: mongoose.Types.ObjectId; campaignId: mongoose.Types.ObjectId }[]) {
    const campaign = await campaignsCol.findOne({ _id: m.campaignId })
    const campaignOwnerId = campaign?.membership?.ownerId ?? campaign?.membership?.adminId
    const isAdmin = campaignOwnerId?.equals(new mongoose.Types.ObjectId(adminUserId))
    if (isAdmin && campaign) {
      result.push({
        campaignId: m.campaignId.toString(),
        campaignName: campaign.identity?.name as string,
        campaignMemberId: m._id.toString(),
      })
    }
  }
  return result
}

/**
 * Check whether a user is the campaign admin (DM) for any campaign
 * this character belongs to.
 */
export async function isCampaignAdminForCharacter(
  characterId: string,
  userId: string,
): Promise<boolean> {
  const uid = new mongoose.Types.ObjectId(userId)
  const campaignMembersCol = db().collection('campaignMembers')

  // Find campaigns this character is a member of
  const campaignIds = await campaignMembersCol.distinct('campaignId', {
    characterId: new mongoose.Types.ObjectId(characterId),
    status: { $in: ['pending', 'approved'] },
  })

  if (campaignIds.length === 0) return false

  const match = await db()
    .collection('campaigns')
    .findOne({
      _id: { $in: campaignIds },
      $or: [{ 'membership.ownerId': uid }],
    })

  return match !== null
}

/**
 * Get user's characters that are not in any campaign (available for invite accept).
 */
export async function getCharactersAvailableForCampaign(userId: string) {
  const characters = await getCharactersByUser(userId)
  const campaignMemberService = await import('./campaignMember.service')

  const available: typeof characters = []
  for (const c of characters) {
    const inCampaign = await campaignMemberService.isCharacterInCampaign(c._id.toString())
    if (!inCampaign) available.push(c)
  }
  return available
}
