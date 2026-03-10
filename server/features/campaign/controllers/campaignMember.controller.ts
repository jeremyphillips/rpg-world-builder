import type { Request, Response } from 'express'
import * as campaignMemberService from '../services/campaignMember.service'

export async function approveCampaignMember(req: Request, res: Response) {
  const updated = await campaignMemberService.approveMemberWithNotifications(
    req.params.id,
    req.userId!,
  )
  res.json({ campaignMember: updated })
}

export async function rejectCampaignMember(req: Request, res: Response) {
  const updated = await campaignMemberService.rejectMemberWithNotifications(
    req.params.id,
    req.userId!,
  )
  res.json({ campaignMember: updated })
}

export async function updateCharacterStatus(req: Request, res: Response) {
  const { characterStatus } = req.body as { characterStatus?: string }
  const updated = await campaignMemberService.updateCharacterStatusWithNotifications(
    req.params.id,
    req.userId!,
    characterStatus ?? '',
  )
  res.json({ campaignMember: updated })
}
