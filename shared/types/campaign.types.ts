export type CampaignMemberStatus =
  | 'pending'
  | 'approved'
  | 'declined'

/** All campaign-scoped viewer roles (never includes platform-level concepts). */
export type CampaignRole = 'dm' | 'pc' | 'observer'

/**
 * Roles that may be stored on CampaignMember docs.
 * 'observer' is a computed state (pending member), not stored.
 * 'co_dm' enables future co-DM support.
 */
export type CampaignMemberStoredRole = 'dm' | 'co_dm' | 'pc'

/** @deprecated Use CampaignMemberStoredRole instead. Kept for backward compat. */
export type CampaignMemberRole = Exclude<CampaignRole, 'observer'>

export type CampaignCharacterStatus =
  | 'active'
  | 'inactive'
  | 'deceased'

export type CampaignIdentity = {
  name: string
  setting?: string
  edition?: string
  description?: string
  imageUrl?: string
}

export type CampaignConfiguration = {
  allowLegacyEditionNpcs?: boolean
}

/** Fields common to both the full Campaign document and lightweight summaries. */
export interface CampaignBase {
  _id: string
  identity: CampaignIdentity
  createdAt?: Date
  updatedAt?: Date
}

/** Viewer-specific context attached by the API when fetching a campaign. */
export interface CampaignViewer {
  campaignRole: CampaignRole | null
  isPlatformAdmin: boolean
  isOwner: boolean
}

export interface Campaign extends CampaignBase {
  membership: {
    ownerId: string
  }
  rulesetId?: string
  rulesetVersion?: number
  configuration?: CampaignConfiguration
  /** Populated by GET /api/campaigns/:id with the requesting user's context. */
  viewer?: CampaignViewer
  createdAt: Date
  updatedAt: Date
}

export interface CampaignSummary extends CampaignBase {
  dmName?: string
  campaignMemberId?: string
  characterStatus?: string
  memberCount?: number
}

export interface PendingMembership {
  campaignId: string
  campaignName: string
  campaignMemberId: string
}
