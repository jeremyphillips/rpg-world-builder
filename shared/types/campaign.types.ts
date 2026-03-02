export type CampaignMemberStatus =
  | 'pending'
  | 'approved'
  | 'declined'

/** All campaign-scoped viewer roles (never includes platform-level concepts). */
export type CampaignRole = 'dm' | 'pc' | 'co_dm' | 'observer'

/**
 * Roles that may be stored on CampaignMember docs.
 * 'observer' is a computed state (pending member), not stored.
 * 'co_dm' enables future co-DM support.
 */
export type CampaignMemberStoredRole = Exclude<CampaignRole, 'observer'>

export type CampaignCharacterStatus =
  | 'active'
  | 'inactive'
  | 'deceased'

export type CampaignIdentity = {
  name: string
  setting?: string
  edition?: string
  description?: string
  /** @deprecated Use imageKey instead. **/
  imageUrl?: string
  imageKey?: string
}

export type CampaignConfiguration = {}

/** Fields common to both the full Campaign document and lightweight summaries. */
export interface CampaignBase {
  _id: string
  identity: CampaignIdentity
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Campaign role as seen by the viewer.
 *
 * 'owner' is a derived value — it is never stored on CampaignMember docs.
 * DM/co-DM derivation will be added in a later stage.
 */
export type ViewerCampaignRole = 'owner' | CampaignRole

/** Viewer-specific context attached by the API when fetching a campaign. */
export interface CampaignViewer {
  campaignRole: ViewerCampaignRole | null
  isPlatformAdmin: boolean
  isOwner: boolean
}

/** Hydrated member row for UI consumption. */
export interface CampaignMemberView {
  campaignMemberId: string
  status: CampaignMemberStatus
  characterStatus: CampaignCharacterStatus
  joinedAt: string | null
  user: {
    id: string
    name: string
    avatarUrl: string | null
  }
  character: {
    id: string
    name: string
    imageUrl: string | null
  }
}

/** Full members payload attached to the campaign response. */
export interface CampaignMembersPayload {
  counts: {
    pending: number
    approved: number
    declined: number
    total: number
  }
  items: CampaignMemberView[]
  viewerCharacterIds: string[]
}

export interface Campaign extends CampaignBase {
  membership: {
    ownerId: string
  }
  configuration?: CampaignConfiguration
  /** Populated by GET /api/campaigns/:id with the requesting user's context. */
  viewer?: CampaignViewer
  /** Hydrated member list derived from CampaignMember docs (not legacy fields). */
  members?: CampaignMembersPayload
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
