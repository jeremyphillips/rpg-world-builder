import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import * as campaignMemberService from '../services/campaignMember.service'
import { getCampaignById } from '../services/campaign.service'
import * as notificationService from '../services/notification.service'
import { env } from '../config/env'
import type { CampaignCharacterStatus } from '../../shared/types'

const db = () => mongoose.connection.useDb(env.DB_NAME)

export async function approveCampaignMember(req: Request, res: Response) {
  const memberId = req.params.id
  const userId = req.userId!

  const member = await campaignMemberService.getCampaignMemberById(memberId)
  if (!member) {
    res.status(404).json({ error: 'Campaign member not found' })
    return
  }

  const m = member as { status: string; campaignId: mongoose.Types.ObjectId }
  if (m.status !== 'pending') {
    res.status(400).json({ error: 'Campaign member is not pending approval' })
    return
  }

  const campaign = await getCampaignById(m.campaignId.toString())
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' })
    return
  }

  const ownerId = campaign.membership.ownerId
  const isOwner = ownerId?.equals(new mongoose.Types.ObjectId(userId)) ?? false
  if (!isOwner) {
    res.status(403).json({ error: 'Only the campaign owner can approve characters' })
    return
  }

  const updated = await campaignMemberService.approveCampaignMember(memberId, userId)
  if (!updated) {
    res.status(400).json({ error: 'Failed to approve' })
    return
  }

  const u = updated as { userId: mongoose.Types.ObjectId; characterId: mongoose.Types.ObjectId }
  const character = await db().collection('characters').findOne({ _id: u.characterId })

  await notificationService.createNotification({
    userId: u.userId,
    type: 'character_approved',
    requiresAction: false,
    context: {
      campaignId: m.campaignId,
      characterId: u.characterId,
    },
    payload: {
      characterName: character?.name,
      campaignName: campaign.identity.name,
    },
  })

  const approvedMembers = await campaignMemberService.getCampaignMembersByCampaign(m.campaignId.toString())
  const partyMemberUserIds = (approvedMembers as { userId: mongoose.Types.ObjectId; status: string }[])
    .filter((mbr) => mbr.status === 'approved' && !mbr.userId.equals(u.userId))
    .map((mbr) => mbr.userId)

  for (const memberUserId of partyMemberUserIds) {
    await notificationService.createNotification({
      userId: memberUserId,
      type: 'newPartyMember',
      requiresAction: false,
      context: {
        characterId: u.characterId,
        campaignId: m.campaignId,
      },
      payload: {
        characterName: character?.name,
        campaignName: campaign.identity.name,
      },
    })
  }

  res.json({ campaignMember: updated })
}

export async function rejectCampaignMember(req: Request, res: Response) {
  const memberId = req.params.id
  const userId = req.userId!

  const member = await campaignMemberService.getCampaignMemberById(memberId)
  if (!member) {
    res.status(404).json({ error: 'Campaign member not found' })
    return
  }

  const m = member as { status: string; campaignId: mongoose.Types.ObjectId }
  if (m.status !== 'pending') {
    res.status(400).json({ error: 'Campaign member is not pending approval' })
    return
  }

  const campaign = await getCampaignById(m.campaignId.toString())
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' })
    return
  }

  const rejectOwnerId = campaign.membership.ownerId
  const isRejectOwner = rejectOwnerId?.equals(new mongoose.Types.ObjectId(userId)) ?? false
  if (!isRejectOwner) {
    res.status(403).json({ error: 'Only the campaign owner can reject characters' })
    return
  }

  const updated = await campaignMemberService.rejectCampaignMember(memberId)
  if (!updated) {
    res.status(400).json({ error: 'Failed to reject' })
    return
  }

  const u = updated as { userId: mongoose.Types.ObjectId; characterId: mongoose.Types.ObjectId }
  const character = await db().collection('characters').findOne({ _id: u.characterId })

  await notificationService.createNotification({
    userId: u.userId,
    type: 'character_rejected',
    requiresAction: false,
    context: {
      campaignId: m.campaignId,
      characterId: u.characterId,
    },
    payload: {
      characterName: character?.name,
      campaignName: campaign.identity.name,
    },
  })

  res.json({ campaignMember: updated })
}

// ---------------------------------------------------------------------------
// Update character status (active / inactive / deceased)
// ---------------------------------------------------------------------------

const VALID_CHARACTER_STATUSES: CampaignCharacterStatus[] = ['active', 'inactive', 'deceased']

export async function updateCharacterStatus(req: Request, res: Response) {
  const memberId = req.params.id
  const userId = req.userId!
  const { characterStatus } = req.body as { characterStatus?: string }

  if (!characterStatus || !VALID_CHARACTER_STATUSES.includes(characterStatus as CampaignCharacterStatus)) {
    res.status(400).json({ error: `Invalid characterStatus. Must be one of: ${VALID_CHARACTER_STATUSES.join(', ')}` })
    return
  }

  const member = await campaignMemberService.getCampaignMemberById(memberId)
  if (!member) {
    res.status(404).json({ error: 'Campaign member not found' })
    return
  }

  const m = member as {
    campaignId: mongoose.Types.ObjectId
    characterId: mongoose.Types.ObjectId
    userId: mongoose.Types.ObjectId
    status: string
    characterStatus?: string
  }

  const campaign = await getCampaignById(m.campaignId.toString())
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' })
    return
  }

  const statusOwnerId = campaign.membership.ownerId
  const isCampaignOwner = statusOwnerId?.equals(new mongoose.Types.ObjectId(userId)) ?? false
  const isCharacterOwner = m.userId.equals(new mongoose.Types.ObjectId(userId))

  // Campaign owner can set any status; character owner can only set 'inactive' (leave)
  if (!isCampaignOwner && !isCharacterOwner) {
    res.status(403).json({ error: 'You do not have permission to update this character\'s status' })
    return
  }

  if (isCharacterOwner && !isCampaignOwner && characterStatus !== 'inactive') {
    res.status(403).json({ error: 'You can only set your character to inactive (leave campaign)' })
    return
  }

  const updated = await campaignMemberService.updateCharacterStatus(
    memberId,
    characterStatus as CampaignCharacterStatus,
  )
  if (!updated) {
    res.status(400).json({ error: 'Failed to update character status' })
    return
  }

  const character = await db().collection('characters').findOne({ _id: m.characterId })
  const characterName = (character?.name as string) ?? 'Unknown'

  // Notify all approved party members (excluding the user who initiated)
  const approvedMembers = await campaignMemberService.getCampaignMembersByCampaign(m.campaignId.toString())
  const partyMemberUserIds = (approvedMembers as { userId: mongoose.Types.ObjectId; status: string }[])
    .filter((mbr) => mbr.status === 'approved' && !mbr.userId.equals(new mongoose.Types.ObjectId(userId)))
    .map((mbr) => mbr.userId)

  const notificationType = characterStatus === 'deceased'
    ? 'character.deceased'
    : 'character.left'

  for (const memberUserId of partyMemberUserIds) {
    await notificationService.createNotification({
      userId: memberUserId,
      type: notificationType,
      requiresAction: false,
      context: {
        characterId: m.characterId,
        campaignId: m.campaignId,
      },
      payload: {
        characterName,
        campaignName: campaign.identity.name,
      },
    })
  }

  res.json({ campaignMember: updated })
}
