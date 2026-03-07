import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { env } from '../shared/config/env'
import { validateRequired, validateOneOf } from '../shared/validators/common'
import * as inviteService from '../services/invite.service'

const db = () => mongoose.connection.useDb(env.DB_NAME)

export async function getInvite(req: Request, res: Response) {
  const inviteId =
    typeof req.params.inviteId === 'string' ? req.params.inviteId : req.params.inviteId?.[0]
  const invite = await inviteService.getInviteEnriched(inviteId!, req.userId!)
  res.json({ invite })
}

export async function respondToInvite(req: Request, res: Response) {
  const actionCheck = validateOneOf(req.body.action, ['accept', 'decline'], 'action')
  if (!actionCheck.valid) {
    res.status(400).json({ error: actionCheck.message })
    return
  }

  const { action, characterId } = req.body

  if (action === 'accept') {
    const characterIdCheck = validateRequired(characterId, 'characterId')
    if (!characterIdCheck.valid) {
      res.status(400).json({ error: 'characterId is required when accepting an invite' })
      return
    }

    // Validate character belongs to user
    const character = await db().collection('characters').findOne({
      _id: new mongoose.Types.ObjectId(characterId),
      userId: new mongoose.Types.ObjectId(req.userId!),
    })
    if (!character) {
      res.status(400).json({ error: 'Character not found or does not belong to you' })
      return
    }

    // Validate character is not already in a campaign
    const campaignMemberService = await import('../services/campaignMember.service')
    const alreadyInCampaign = await campaignMemberService.isCharacterInCampaign(characterId)
    if (alreadyInCampaign) {
      res.status(400).json({ error: 'Character is already in a campaign' })
      return
    }
  }

  const inviteIdParam = typeof req.params.inviteId === 'string' ? req.params.inviteId : req.params.inviteId?.[0]
  const invite = await inviteService.respondToInvite(
      inviteIdParam!,
      req.userId!,
      action === 'accept',
      action === 'accept' ? characterId : undefined,
    )

  if (!invite) {
    res.status(404).json({ error: 'Invite not found or not yours' })
    return
  }

  res.json({ invite })
}

export async function getMyInvites(req: Request, res: Response) {
  const invites = await inviteService.getInvitesForUser(req.userId!)
  res.json({ invites })
}
