import type { CampaignRole } from '../../shared/types'

declare namespace Express {
  interface Request {
    userId?: string
    userRole?: 'superadmin' | 'admin' | 'user'

    /** Attached by requireCampaignRole middleware */
    campaign?: import('mongodb').WithId<import('mongodb').Document>
    /** The user's effective campaign-scoped role (never includes platform concepts) */
    campaignRole?: CampaignRole
    /** True when the requesting user is the campaign owner (set by requireCampaignRole) */
    isOwner?: boolean
  }
}
