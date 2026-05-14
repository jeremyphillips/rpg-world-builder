/**
 * Canonical source of truth for campaign-scoped viewer identity
 * (owner / platform admin / campaign role / character ids).
 */
import mongoose from 'mongoose'
import { env } from '../config/env'
import { getCampaignById } from '../../features/campaign/services/campaign.service'
import { isPlatformAdmin as checkPlatformAdmin } from './platformAdmin'
import type { CampaignRole, CampaignMemberStoredRole } from '../../../shared/types'

const db = () => mongoose.connection.useDb(env.DB_NAME)
const campaignMembersCollection = () => db().collection('campaignMembers')

export interface CampaignViewerContext {
  campaignRole: CampaignRole | null
  isOwner: boolean
  isPlatformAdmin: boolean
  characterIds: string[]
}

/** Map stored member roles to the campaign-scoped viewer hierarchy. */
const STORED_ROLE_TO_CAMPAIGN_ROLE: Record<CampaignMemberStoredRole, CampaignRole> = {
  dm: 'dm',
  co_dm: 'dm',
  pc: 'pc',
}

export function resolveHighestRole(roles: string[]): CampaignRole {
  for (const stored of roles) {
    const mapped = STORED_ROLE_TO_CAMPAIGN_ROLE[stored as CampaignMemberStoredRole]
    if (mapped === 'dm') return 'dm'
  }
  return 'pc'
}

export async function resolveCampaignViewerContext(args: {
  campaignId: string
  userId: string
  userRole?: string | null
  campaignDoc?: any
}): Promise<CampaignViewerContext> {
  const { campaignId, userId, userRole, campaignDoc } = args

  const campaign = campaignDoc ?? (await getCampaignById(campaignId))
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`)
  }

  const isPlatformAdmin = checkPlatformAdmin(userRole)

  const uid = new mongoose.Types.ObjectId(userId)
  const ownerId = campaign.membership?.ownerId
  const isOwner = ownerId ? ownerId.equals(uid) : false

  const members = await campaignMembersCollection()
    .find({
      campaignId: new mongoose.Types.ObjectId(campaignId),
      userId: uid,
    })
    .toArray()

  const memberDocs = members as unknown as {
    role: string
    status: string
    characterId?: mongoose.Types.ObjectId
  }[]
  const approvedMembers = memberDocs.filter((m) => m.status === 'approved')
  const hasAnyMember = memberDocs.length > 0

  let campaignRole: CampaignRole | null = null

  if (approvedMembers.length > 0) {
    campaignRole = resolveHighestRole(approvedMembers.map((m) => m.role))
  } else if (hasAnyMember) {
    campaignRole = 'observer'
  }

  if (isOwner && !campaignRole) {
    campaignRole = 'dm'
  }

  if (isPlatformAdmin && !campaignRole) {
    campaignRole = 'dm'
  }

  const characterIds = [
    ...new Set(
      approvedMembers
        .map((m) => m.characterId?.toString())
        .filter((id): id is string => Boolean(id)),
    ),
  ]

  return { campaignRole, isOwner, isPlatformAdmin, characterIds }
}
