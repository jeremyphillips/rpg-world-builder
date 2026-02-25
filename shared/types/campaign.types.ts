export type CampaignMemberStatus =
  | 'pending'
  | 'approved'
  | 'declined'

/** All assignable campaign roles */
export type CampaignRole = 'dm' | 'pc' | 'observer'

/** Roles stored on campaign member docs (observer is a computed state, not stored) */
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

export interface Campaign extends CampaignBase {
  membership: {
    adminId: string
  }
  rulesetId?: string
  rulesetVersion?: number
  configuration?: CampaignConfiguration
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
