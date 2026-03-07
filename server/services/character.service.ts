import mongoose from 'mongoose'
import { env } from '../config/env'
import type { CharacterDoc } from '../../src/features/character/domain/types/characterDoc.types'
import { getPublicUrl } from '../services/image.service'
import {
  type CharacterCardSummary,
  type CharacterDetailDto,
  loadCharacterReadReferences,
  toCharacterCardSummary,
  toCharacterDetailDto,
  type CharacterDocForCard,
  type CharacterDocForDetail,
} from '../../src/features/character/read-model'

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

/**
 * Get character as CharacterDetailDto with resolved race/class/subclass/proficiency/equipment names.
 * Used by GET /characters/:id.
 */
export async function getCharacterDetail(characterId: string): Promise<CharacterDetailDto | null> {
  const character = await getCharacterById(characterId)
  if (!character) return null

  const campaigns = await getCampaignsForCharacter(characterId)
  const campaignsSimple = campaigns.map((c) => ({
    id: (c._id as mongoose.Types.ObjectId).toString(),
    name: (c.identity?.name as string) ?? '',
  }))

  const doc: CharacterDocForDetail = {
    _id: character._id as { toString(): string },
    name: character.name as string,
    type: character.type as string | undefined,
    imageKey: character.imageKey as string | null | undefined,
    race: character.race as string | undefined,
    alignment: character.alignment as string | undefined,
    classes: (character.classes as CharacterDocForDetail['classes']) ?? [],
    totalLevel: character.totalLevel as number | undefined,
    abilityScores: character.abilityScores as Record<string, number> | undefined,
    proficiencies: character.proficiencies as { skills?: string[] } | undefined,
    equipment: character.equipment as CharacterDocForDetail['equipment'] | undefined,
    wealth: character.wealth as CharacterDocForDetail['wealth'] | undefined,
    hitPoints: character.hitPoints as CharacterDocForDetail['hitPoints'] | undefined,
    armorClass: character.armorClass as CharacterDocForDetail['armorClass'] | undefined,
    combat: character.combat as CharacterDocForDetail['combat'] | undefined,
    spells: character.spells as string[] | undefined,
    narrative: character.narrative as CharacterDocForDetail['narrative'] | undefined,
    levelUpPending: character.levelUpPending as boolean | undefined,
    pendingLevel: character.pendingLevel as number | undefined,
    xp: character.xp as number | undefined,
  }

  const refs = await loadCharacterReadReferences({
    characters: [doc],
    include: { proficiencies: true, items: true },
  })
  return toCharacterDetailDto(doc, campaignsSimple, refs, getPublicUrl)
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

// Re-export read-model types for consumers
export type {
  CharacterCardSummary,
  CharacterCardClassSummary,
  CharacterDetailDto,
} from '../../src/features/character/read-model'

/**
 * Get user's characters with their current campaign (if any).
 * Returns card-ready summaries. Uses batch queries to avoid N+1.
 */
export async function getMyCharactersWithCampaign(userId: string, type?: string): Promise<CharacterCardSummary[]> {
  const characters = await getCharactersByUser(userId, type)
  const characterIds = characters.map((c) => c._id as mongoose.Types.ObjectId)

  if (characterIds.length === 0) return []

  const campaignMembersCol = db().collection('campaignMembers')
  const memberships = (await campaignMembersCol
    .find({
      characterId: { $in: characterIds },
      status: 'approved',
    })
    .toArray()) as unknown as { characterId: mongoose.Types.ObjectId; campaignId: mongoose.Types.ObjectId }[]

  const campaignIds = [...new Set(memberships.map((m) => m.campaignId))]
  const campaigns =
    campaignIds.length > 0
      ? await db()
          .collection('campaigns')
          .find({ _id: { $in: campaignIds } })
          .project({ _id: 1, 'identity.name': 1 })
          .toArray()
      : []

  const membershipByCharacterId = new Map<string, { campaignId: string }>()
  for (const m of memberships) {
    const cid = m.characterId.toString()
    if (!membershipByCharacterId.has(cid)) {
      membershipByCharacterId.set(cid, { campaignId: m.campaignId.toString() })
    }
  }

  const campaignById = new Map<string, { id: string; name: string }>()
  for (const c of campaigns as { _id: mongoose.Types.ObjectId; identity?: { name?: string } }[]) {
    campaignById.set(c._id.toString(), {
      id: c._id.toString(),
      name: (c.identity?.name as string) ?? '',
    })
  }

  const characterSources = characters.map((char) => ({
    race: char.race as string | undefined,
    classes: (char.classes as CharacterDocForCard['classes']) ?? [],
  }))
  const refs = await loadCharacterReadReferences({
    characters: characterSources,
    include: {},
  })

  return characters.map((char) => {
    const charId = (char._id as mongoose.Types.ObjectId).toString()
    const membership = membershipByCharacterId.get(charId)
    const campaign = membership ? campaignById.get(membership.campaignId) ?? null : null
    const doc: CharacterDocForCard = {
      _id: char._id as { toString(): string },
      name: char.name as string,
      type: char.type as string | undefined,
      imageKey: char.imageKey as string | null | undefined,
      race: char.race as string | undefined,
      classes: (char.classes as CharacterDocForCard['classes']) ?? [],
    }
    return toCharacterCardSummary(doc, campaign, refs, getPublicUrl)
  })
}

/**
 * Get user's characters that are not in any campaign (available for invite accept).
 * Returns card-ready summaries with resolved race/class/subclass names.
 * Uses batch queries to avoid N+1.
 */
export async function getCharactersAvailableForCampaign(userId: string): Promise<CharacterCardSummary[]> {
  const characters = await getCharactersByUser(userId)
  if (characters.length === 0) return []

  const characterIds = characters.map((c) => c._id as mongoose.Types.ObjectId)
  const campaignMembersCol = db().collection('campaignMembers')
  const memberships = (await campaignMembersCol
    .find({
      characterId: { $in: characterIds },
      status: { $in: ['pending', 'approved'] },
    })
    .project({ characterId: 1 })
    .toArray()) as unknown as { characterId: mongoose.Types.ObjectId }[]

  const characterIdsInCampaign = new Set(memberships.map((m) => m.characterId.toString()))
  const availableCharacters = characters.filter((c) => !characterIdsInCampaign.has((c._id as mongoose.Types.ObjectId).toString()))
  if (availableCharacters.length === 0) return []

  const characterSources = availableCharacters.map((char) => ({
    race: char.race as string | undefined,
    classes: (char.classes as CharacterDocForCard['classes']) ?? [],
  }))
  const refs = await loadCharacterReadReferences({
    characters: characterSources,
    include: {},
  })

  return availableCharacters.map((char) => {
    const doc: CharacterDocForCard = {
      _id: char._id as { toString(): string },
      name: char.name as string,
      type: char.type as string | undefined,
      imageKey: char.imageKey as string | null | undefined,
      race: char.race as string | undefined,
      classes: (char.classes as CharacterDocForCard['classes']) ?? [],
    }
    return toCharacterCardSummary(doc, null, refs, getPublicUrl)
  })
}
