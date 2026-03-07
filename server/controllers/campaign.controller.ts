import type { Request, Response } from 'express'
import type { CampaignMemberStoredRole } from '../../shared/types'
import { validateRequired } from '../shared/validators/common'
import * as campaignService from '../services/campaign.service'
import {
  preCheckMember as preCheckMemberService,
  addMemberOrInvite as addMemberOrInviteService,
} from '../services/campaignMember.service'

// ---------------------------------------------------------------------------
// Campaign CRUD
// ---------------------------------------------------------------------------

export async function getCampaigns(req: Request, res: Response) {
  const campaigns = await campaignService.getCampaignsForUser(req.userId!, req.userRole!)
  res.json({ campaigns })
}

export async function getCampaign(req: Request, res: Response) {
  const { campaign } = await campaignService.getCampaignWithViewerContext(
    req.params.id,
    req.userId!,
    req.userRole,
    { campaign: req.campaign, viewerContext: req.viewerContext },
  )
  res.json({ campaign })
}

export async function createCampaign(req: Request, res: Response) {
  const nameCheck = validateRequired(req.body.name, 'Campaign name')
  if (!nameCheck.valid) {
    res.status(400).json({ error: nameCheck.message })
    return
  }

  const { name, description } = req.body
  const campaign = await campaignService.createCampaign(req.userId!, { name, description })
  res.status(201).json({ campaign })
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
  const status = req.query.status as string | undefined
  const characters = await campaignService.getPartyCharacters(req.params.id, status)
  res.json({ characters })
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
  const emailCheck = validateRequired(req.body.email, 'email')
  if (!emailCheck.valid) {
    res.status(400).json({ error: emailCheck.message })
    return
  }

  const result = await preCheckMemberService(req.params.id, req.body.email)
  res.json(result)
}

export async function addMember(req: Request, res: Response) {
  const emailCheck = validateRequired(req.body.email, 'email')
  if (!emailCheck.valid) {
    res.status(400).json({ error: emailCheck.message })
    return
  }

  const { email, role } = req.body
  const validRoles: CampaignMemberStoredRole[] = ['dm', 'co_dm', 'pc']
  const memberRole = validRoles.includes(role) ? role : 'pc'

  const result = await addMemberOrInviteService(
    req.params.id,
    email,
    memberRole,
    req.userId!,
  )

  if (result.type === 'email_sent') {
    res.status(200).json({ message: result.message })
    return
  }

  res.status(201).json({ invite: result.invite, message: result.message })
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
