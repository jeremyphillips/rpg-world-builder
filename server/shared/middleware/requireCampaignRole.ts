import type { Request, Response, NextFunction } from 'express'
import { env } from '../config/env'
import { getCampaignById } from '../../services/campaign.service'
import { resolveCampaignViewerContext } from '../auth/resolveCampaignViewerContext'
import type { CampaignRole } from '../../shared/types'

const isDev = env.NODE_ENV === 'development'

const ROLE_HIERARCHY: CampaignRole[] = ['observer', 'pc', 'dm']

/**
 * Campaign-scoped authorization middleware.
 *
 * Fetches the campaign from `req.params.id`, determines the user's
 * campaign-level role, and checks it against the required roles.
 *
 * The campaign owner and platform admins always bypass the role hierarchy.
 *
 * Attaches `req.campaign`, `req.campaignRole`, `req.isOwner`, and
 * `req.viewerContext` for downstream use.
 *
 * Usage:
 *   requireCampaignRole('dm')        — owner, platform admin, or DMs
 *   requireCampaignRole('pc')        — any approved member (owner/dm/pc pass)
 *   requireCampaignRole('observer')  — anyone with access (all roles pass)
 *
 * Regression checklist:
 *   - Owner without membership doc => ctx.campaignRole 'dm'
 *   - Approved pc => 'pc'
 *   - Pending member only => 'observer'
 *   - Platform admin no membership => 'dm'
 *   - Co-DM resolves correctly
 *   - Non-member non-admin => 403
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

    const ctx = await resolveCampaignViewerContext({
      campaignId,
      userId: req.userId!,
      userRole: req.userRole,
      campaignDoc: campaign,
    })

    if (!ctx.campaignRole && !ctx.isOwner && !ctx.isPlatformAdmin) {
      res.status(403).json({ error: 'You are not a member of this campaign' })
      return
    }

    if (!ctx.isOwner && !ctx.isPlatformAdmin) {
      const userLevel = ROLE_HIERARCHY.indexOf(ctx.campaignRole!)
      if (userLevel < minLevel) {
        res.status(403).json({ error: 'Insufficient campaign permissions' })
        return
      }
    }

    req.campaign = campaign
    req.campaignRole = ctx.campaignRole ?? undefined
    req.isOwner = ctx.isOwner
    req.viewerContext = ctx

    if (isDev) {
      console.log('[requireCampaignRole] viewer context', {
        userId: req.userId,
        userRole: req.userRole,
        campaignRole: ctx.campaignRole,
        isPlatformAdmin: ctx.isPlatformAdmin,
        isOwner: ctx.isOwner,
        campaignId,
        ownerId: campaign.membership?.ownerId?.toString(),
        viewerCharacterIds: ctx.characterIds,
      })
    }

    next()
  }
}

/**
 * Middleware that requires the requesting user to be the campaign owner
 * (or a platform superadmin). Must be chained after requireCampaignRole.
 */
export function requireCampaignOwner() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isOwner && !req.viewerContext?.isPlatformAdmin) {
      res.status(403).json({ error: 'Only the campaign owner can perform this action' })
      return
    }
    next()
  }
}
