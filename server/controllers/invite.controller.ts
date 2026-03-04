import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { env } from '../config/env'
import * as inviteService from '../services/invite.service'

const db = () => mongoose.connection.useDb(env.DB_NAME)

export async function getInvite(req: Request, res: Response) {
  try {
    const inviteId = typeof req.params.inviteId === 'string' ? req.params.inviteId : req.params.inviteId?.[0]
    const invite = await inviteService.getInviteById(inviteId!)
    if (!invite) {
      res.status(404).json({ error: 'Invite not found' })
      return
    }

    // Only the invited user can view the invite
    if (invite.invitedUserId.toString() !== req.userId!) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    // Enrich with campaign & inviter details
    const campaign = await db().collection('campaigns').findOne(
      { _id: invite.campaignId },
      { projection: { identity: 1 } },
    )

    const invitedBy = await db().collection('users').findOne(
      { _id: invite.invitedByUserId },
      { projection: { username: 1 } },
    )

    res.json({
      invite: {
        ...invite,
        campaign: campaign ? {
          _id: campaign._id,
          name: campaign.identity?.name,
          description: campaign.identity?.description,
        } : null,
        invitedByName: invitedBy?.username ?? 'Unknown',
      },
    })
  } catch (err) {
    console.error('Failed to get invite:', err)
    res.status(500).json({ error: 'Failed to load invite' })
  }
}

export async function respondToInvite(req: Request, res: Response) {
  try {
    const { action, characterId } = req.body

    if (action !== 'accept' && action !== 'decline') {
      res.status(400).json({ error: 'action must be "accept" or "decline"' })
      return
    }

    if (action === 'accept') {
      if (!characterId) {
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
  } catch (err) {
    console.error('Failed to respond to invite:', err)
    const message = err instanceof Error ? err.message : 'Failed to respond to invite'
    res.status(500).json({ error: message })
  }
}

export async function getMyInvites(req: Request, res: Response) {
  try {
    const invites = await inviteService.getInvitesForUser(req.userId!)
    res.json({ invites })
  } catch (err) {
    console.error('Failed to get invites:', err)
    res.status(500).json({ error: 'Failed to load invites' })
  }
}
