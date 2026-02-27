import type { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { env } from '../config/env'
import { getCampaignById } from '../services/campaign.service'
import type { CampaignRole, CampaignMemberStoredRole } from '../../shared/types'

const db = () => mongoose.connection.useDb(env.DB_NAME)
const campaignMembersCollection = () => db().collection('campaignMembers')
const isDev = env.NODE_ENV === 'development'

/** Map stored member roles to the campaign-scoped viewer hierarchy. */
const STORED_ROLE_TO_CAMPAIGN_ROLE: Record<CampaignMemberStoredRole, CampaignRole> = {
  dm: 'dm',
  co_dm: 'dm',
  pc: 'pc',
}

const ROLE_HIERARCHY: CampaignRole[] = ['observer', 'pc', 'dm']

/**
 * Campaign-scoped authorization middleware.
 *
 * Fetches the campaign from `req.params.id`, determines the user's
 * campaign-level role, and checks it against the required roles.
 *
 * The campaign owner and platform admins always bypass the role hierarchy.
 *
 * Attaches `req.campaign`, `req.campaignRole`, and `req.isOwner`
 * for downstream use.
 *
 * Usage:
 *   requireCampaignRole('dm')        — owner, platform admin, or DMs
 *   requireCampaignRole('pc')        — any approved member (owner/dm/pc pass)
 *   requireCampaignRole('observer')  — anyone with access (all roles pass)
 */
export function requireCampaignRole(...requiredRoles: CampaignRole[]) {
  const minLevel = Math.min(...requiredRoles.map((r) => ROLE_HIERARCHY.indexOf(r)))

  return async (req: Request, res: Response, next: NextFunction) => {
    const campaignId = req.params.id

    if (!campaignId) {
      res.status(400).json({ error: 'Campaign ID is required' })
      return
    }

    const campaign = await getCampaignById(campaignId)

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' })
      return
    }

    const uid = new mongoose.Types.ObjectId(req.userId!)
    const ownerId = campaign.membership.ownerId
    const isOwner = ownerId?.equals(uid) ?? false
    const isPlatformAdmin = req.userRole === 'admin' || req.userRole === 'superadmin'

    let campaignRole: CampaignRole | null = null

    // Look up the user's membership regardless of ownership so the owner
    // gets their real campaign-scoped role (e.g. 'dm').
    const members = await campaignMembersCollection()
      .find({
        campaignId: new mongoose.Types.ObjectId(campaignId),
        userId: uid,
      })
      .toArray()

    const memberDocs = members as unknown as { role: string; status: string }[]
    const approvedMembers = memberDocs.filter((m) => m.status === 'approved')
    const hasAnyMember = memberDocs.length > 0

    if (approvedMembers.length > 0) {
      const highestStored = resolveHighestRole(approvedMembers.map((m) => m.role))
      campaignRole = highestStored
    } else if (hasAnyMember) {
      campaignRole = 'observer'
    }

    // Owner defaults to 'dm' when they don't have an explicit membership doc
    if (isOwner && !campaignRole) {
      campaignRole = 'dm'
    }

    // Platform admins can access any campaign even without membership
    if (isPlatformAdmin && !campaignRole) {
      campaignRole = 'dm'
    }

    if (!campaignRole && !isOwner && !isPlatformAdmin) {
      res.status(403).json({ error: 'You are not a member of this campaign' })
      return
    }

    // Owner and platform admin always bypass the hierarchy check
    if (!isOwner && !isPlatformAdmin) {
      const userLevel = ROLE_HIERARCHY.indexOf(campaignRole!)
      if (userLevel < minLevel) {
        res.status(403).json({ error: 'Insufficient campaign permissions' })
        return
      }
    }

    req.campaign = campaign
    req.campaignRole = campaignRole ?? undefined
    req.isOwner = isOwner

    if (isDev) {
      const viewerCharacterIds = await campaignMembersCollection()
        .find({
          campaignId: new mongoose.Types.ObjectId(campaignId),
          userId: uid,
          status: 'approved',
        })
        .project({ characterId: 1 })
        .toArray()
        .then((docs) => docs.map((d) => d.characterId?.toString()).filter(Boolean))

      console.log('[requireCampaignRole] viewer context', {
        userId: req.userId,
        userRole: req.userRole,
        campaignRole,
        isPlatformAdmin,
        isOwner,
        campaignId,
        ownerId: ownerId?.toString(),
        viewerCharacterIds,
      })
    }

    next()
  }
}

/**
 * Middleware that requires the requesting user to be the campaign owner
 * (or a platform admin). Must be chained after requireCampaignRole.
 */
export function requireCampaignOwner() {
  return (req: Request, res: Response, next: NextFunction) => {
    const isPlatformAdmin = req.userRole === 'admin' || req.userRole === 'superadmin'
    if (!req.isOwner && !isPlatformAdmin) {
      res.status(403).json({ error: 'Only the campaign owner can perform this action' })
      return
    }
    next()
  }
}

function resolveHighestRole(roles: string[]): CampaignRole {
  for (const stored of roles) {
    const mapped = STORED_ROLE_TO_CAMPAIGN_ROLE[stored as CampaignMemberStoredRole]
    if (mapped === 'dm') return 'dm'
  }
  return 'pc'
}
