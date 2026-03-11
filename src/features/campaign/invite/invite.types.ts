export type InviteTokenStatus = 'invalid' | 'used' | 'expired' | 'valid'

export interface ResolveInviteResponse {
  status: InviteTokenStatus
  /** Whether an account with the invited email exists. */
  userExists?: boolean
  /** Whether the caller is currently logged in. */
  loggedIn?: boolean
  email?: string
  isMember?: boolean
  hasCharacter?: boolean
  campaignId?: string
  campaignName?: string
  campaignEdition?: string
  campaignSetting?: string
}

export interface AcceptInviteResponse {
  campaignId: string
  campaignName: string
  campaignEdition: string
  campaignSetting: string
}

/** State passed via location.state between invite-aware routes. */
export interface InviteCampaignState {
  campaignName?: string
  campaignEdition?: string
  campaignSetting?: string
}
