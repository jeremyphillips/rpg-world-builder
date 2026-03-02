import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import type { CampaignMemberStoredRole } from '../../shared/types'
import * as campaignService from '../services/campaign.service'
import {
  getViewerMembershipContext,
  hydrateMemberViews,
  type CampaignMemberDoc,
} from '../services/campaignMember.service'

// ---------------------------------------------------------------------------
// Campaign CRUD
// ---------------------------------------------------------------------------

export async function getCampaigns(req: Request, res: Response) {
  const campaigns = await campaignService.getCampaignsForUser(req.userId!, req.userRole!)
  res.json({ campaigns })
}

export async function getCampaign(req: Request, res: Response) {
  const raw = req.campaign!
  const viewerCtx = req.viewerContext!

  const memberCtx = await getViewerMembershipContext(req.params.id, req.userId!)

  // ------------------------------------------------------------------
  // Status counts (always computed from all members, regardless of
  // the viewer's privilege level — counts are non-sensitive metadata).
  // ------------------------------------------------------------------
  const counts = { pending: 0, approved: 0, declined: 0, total: memberCtx.allMembers.length }
  for (const m of memberCtx.allMembers) {
    const s = m.status as string
    if (s === 'pending') counts.pending++
    else if (s === 'approved') counts.approved++
    else if (s === 'declined') counts.declined++
  }

  // ------------------------------------------------------------------
  // Visibility-filtered member list
  // ------------------------------------------------------------------
  const canSeeAll = viewerCtx.isOwner || viewerCtx.isPlatformAdmin
  const uid = new mongoose.Types.ObjectId(req.userId!)

  const visibleMembers: CampaignMemberDoc[] = canSeeAll
    ? memberCtx.allMembers
    : memberCtx.allMembers.filter((m) => {
        const status = m.status as string
        if (status === 'approved') return true
        if (status === 'pending' && (m.userId as mongoose.Types.ObjectId).equals(uid))
          return true
        return false
      })

  const items = await hydrateMemberViews(visibleMembers)

  const campaign = {
    ...raw,
    viewer: {
      campaignRole: viewerCtx.isOwner ? 'owner' : viewerCtx.campaignRole,
      isPlatformAdmin: viewerCtx.isPlatformAdmin,
      isOwner: viewerCtx.isOwner,
    },
    members: {
      counts,
      items,
      viewerCharacterIds: viewerCtx.characterIds,
    },
  }

  res.json({ campaign })
}

export async function createCampaign(req: Request, res: Response) {
  const { name, setting, edition, description } = req.body

  if (!name) {
    res.status(400).json({ error: 'Campaign name is required' })
    return
  }

  if (!setting) {
    res.status(400).json({ error: 'Setting is required' })
    return
  }

  if (!edition) {
    res.status(400).json({ error: 'Edition is required' })
    return
  }

  try {
    const campaign = await campaignService.createCampaign(req.userId!, { name, setting, edition, description })
    res.status(201).json({ campaign })
  } catch (err) {
    console.error('Failed to create campaign:', err)
    res.status(500).json({ error: 'Failed to create campaign' })
  }
}

export async function updateCampaign(req: Request, res: Response) {
  const { name, description, imageKey } = req.body
  const updated = await campaignService.updateCampaign(req.params.id, {
    name,
    description,
    imageKey,
  })
  res.json({ campaign: updated })
}

export async function deleteCampaign(req: Request, res: Response) {
  await campaignService.deleteCampaign(req.params.id)
  res.json({ message: 'Campaign deleted' })
}

// ---------------------------------------------------------------------------
// Party (characters belonging to campaign members)
// ---------------------------------------------------------------------------

export async function getPartyCharacters(req: Request, res: Response) {
  try {
    const status = req.query.status as string | undefined
    const characters = await campaignService.getPartyCharacters(req.params.id, status)

    if (process.env.NODE_ENV === 'development') {
      console.log('[getPartyCharacters] character IDs returned', {
        campaignId: req.params.id,
        characters: characters.map((c: any) => ({
          _id: c._id?.toString(),
          campaignMemberId: c.campaignMemberId,
        })),
      })
    }

    res.json({ characters })
  } catch (err) {
    console.error('Failed to get party characters:', err)
    res.status(500).json({ error: 'Failed to load party characters' })
  }
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

export async function getMembers(req: Request, res: Response) {
  const members = await campaignService.getMembers(req.params.id)
  res.json({ members })
}

export async function getMembersForMessaging(req: Request, res: Response) {
  const members = await campaignService.getMembersForMessaging(req.params.id)
  res.json({ members })
}

export async function preCheckMember(req: Request, res: Response) {
  const campaign = req.campaign!
  const { email } = req.body

  if (!email) {
    res.status(400).json({ error: 'email is required' })
    return
  }

  const db = mongoose.connection.useDb(process.env.DB_NAME ?? 'dnd')
  const user = await db.collection('users').findOne({ email })

  if (!user) {
    res.json({ status: 'no_account' })
    return
  }

  const userName = (user.username as string) ?? email

  // Check if user is already a campaign member
  const member = await db.collection('campaignMembers').findOne({
    campaignId: new mongoose.Types.ObjectId(req.params.id),
    userId: user._id,
    status: { $in: ['pending', 'approved'] },
  })

  if (!member) {
    res.json({ status: 'ok', userName })
    return
  }

  // Check if their character is active in this campaign
  const characterStatus = (member as { characterStatus?: string }).characterStatus ?? 'active'
  if (characterStatus === 'active') {
    res.json({
      status: 'active_character',
      userName,
    })
    return
  }

  res.json({ status: 'already_member', userName })
}

export async function addMember(req: Request, res: Response) {
  const campaign = req.campaign!
  const { email, role } = req.body

  if (!email) {
    res.status(400).json({ error: 'email is required' })
    return
  }

  const validRoles: CampaignMemberStoredRole[] = ['dm', 'co_dm', 'pc']
  const memberRole = validRoles.includes(role) ? role : 'pc'

  // Look up user by email
  const db = mongoose.connection.useDb(process.env.DB_NAME ?? 'dnd')
  const user = await db.collection('users').findOne({ email })

  if (!user) {
    // User doesn't exist yet — generate invite token and send email
    const { createInviteToken } = await import('../services/invite.service')
    const { sendCampaignInvite } = await import('../services/email.service')

    const inviteToken = await createInviteToken({
      campaignId: req.params.id as string,
      email,
      invitedByUserId: req.userId!,
      role: memberRole,
    })

    const ownerUser = await db.collection('users').findOne(
      { _id: campaign.membership.ownerId },
      { projection: { username: 1 } },
    )
    await sendCampaignInvite({
      to: email,
      campaignName: campaign.identity.name as string,
      invitedBy: (ownerUser?.username as string) ?? 'A dungeon master',
      inviteToken,
    })
    res.status(200).json({ message: `Invite email sent to ${email}` })
    return
  }

  // User exists — create a campaign invite (with notification)
  try {
    const { createInvite } = await import('../services/invite.service')
    const ownerUser = await db.collection('users').findOne(
      { _id: campaign.membership.ownerId },
      { projection: { username: 1 } },
    )

    const invite = await createInvite({
      campaignId: req.params.id,
      invitedUserId: user._id.toString(),
      invitedByUserId: req.userId!,
      role: memberRole,
      campaignName: campaign.identity.name as string,
      invitedByName: (ownerUser?.username as string) ?? 'A dungeon master',
    })

    res.status(201).json({ invite, message: `Invite sent to ${email}` })
  } catch (err) {
    console.error('Failed to create invite:', err)
    res.status(500).json({ error: 'Failed to create invite' })
  }
}

export async function updateMember(req: Request, res: Response) {
  const { role } = req.body

  const validRoles: CampaignMemberStoredRole[] = ['dm', 'co_dm', 'pc']
  if (!role || !validRoles.includes(role)) {
    res.status(400).json({ error: `role must be one of: ${validRoles.join(', ')}` })
    return
  }

  const updated = await campaignService.updateMemberRole(req.params.id, req.params.userId, role)
  res.json({ campaign: updated })
}

export async function removeMember(req: Request, res: Response) {
  const updated = await campaignService.removeMember(req.params.id, req.params.userId)
  res.json({ campaign: updated })
}
