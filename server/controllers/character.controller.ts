import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import * as characterService from '../services/character.service'
import * as campaignMemberService from '../services/campaignMember.service'
import { getCampaignById } from '../services/campaign.service'
import * as notificationService from '../services/notification.service'
import { env } from '../config/env'

const db = () => mongoose.connection.useDb(env.DB_NAME)

export async function getCharacters(req: Request, res: Response) {
  const type = req.query.type as string | undefined
  const characters = await characterService.getCharactersByUser(req.userId!, type)
  res.json({ characters })
}

export async function getCharactersAvailableForCampaign(req: Request, res: Response) {
  try {
    const characters = await characterService.getCharactersAvailableForCampaign(req.userId!)
    res.json({ characters })
  } catch (err) {
    console.error('Failed to get available characters:', err)
    res.status(500).json({ error: 'Failed to load characters' })
  }
}

export async function getCharacter(req: Request, res: Response) {
  const character = await characterService.getCharacterById(req.params.id)

  if (!character) {
    res.status(404).json({ error: 'Character not found' })
    return
  }

  const isOwner = character.userId.equals(new mongoose.Types.ObjectId(req.userId!))
  const isPlatformAdmin = req.userRole === 'admin' || req.userRole === 'superadmin'

  // Platform admins can view any character; otherwise must be owner or campaign admin
  if (!isOwner && !isPlatformAdmin) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  // Campaign-scoped admin: is this user the DM/admin of a campaign the character belongs to?
  const isCampaignAdmin = await characterService.isCampaignAdminForCharacter(req.params.id, req.userId!)

  // Resolve character owner's display name (for non-owners viewing the page)
  let ownerName: string | undefined
  if (!isOwner) {
    const ownerUser = await mongoose.connection
      .useDb(process.env.DB_NAME || 'dnd')
      .collection('users')
      .findOne({ _id: character.userId }, { projection: { username: 1 } })
    ownerName = ownerUser?.username ?? undefined
  }

  // Also fetch campaigns this character's user belongs to
  const campaigns = await characterService.getCampaignsForCharacter(req.params.id)

  // Pending memberships this user can approve/reject (when they are campaign admin)
  const pendingMemberships = await characterService.getPendingMembershipsForAdmin(req.params.id, req.userId!)

  const normalizedCharacter = await characterService.getCharacterByIdNormalized(req.params.id)

  res.json({ character: normalizedCharacter, campaigns, isOwner, isAdmin: isCampaignAdmin, pendingMemberships, ownerName })
}

export async function createCharacter(req: Request, res: Response) {
  const { name, campaignId } = req.body

  if (!name) {
    res.status(400).json({ error: 'Character name is required' })
    return
  }

  try {
    const character = await characterService.createCharacter(req.userId!, req.body)

    // If campaignId provided, link character to the user's pending campaign membership
    if (campaignId && character?._id) {
      const mongoose = await import('mongoose')
      const { env } = await import('../config/env')
      const db = mongoose.default.connection.useDb(env.DB_NAME)
      const characterId = character._id.toString()

      // Find or create the campaign member record
      const campaignMemberService = await import('../services/campaignMember.service')
      const existing = await db.collection('campaignMembers').findOne({
        campaignId: new mongoose.default.Types.ObjectId(campaignId),
        userId: new mongoose.default.Types.ObjectId(req.userId!),
      })

      if (existing) {
        await db.collection('campaignMembers').updateOne(
          { _id: existing._id },
          { $set: { characterId: new mongoose.default.Types.ObjectId(characterId) } },
        )
      } else {
        await campaignMemberService.createCampaignMember({
          campaignId,
          characterId,
          userId: req.userId!,
          role: 'pc',
          status: 'pending',
        })
      }

      // Send pending-character notifications
      const notificationService = await import('../services/notification.service')
      const campaign = await db.collection('campaigns').findOne(
        { _id: new mongoose.default.Types.ObjectId(campaignId) },
        { projection: { identity: 1, membership: 1 } },
      )
      const user = await db.collection('users').findOne(
        { _id: new mongoose.default.Types.ObjectId(req.userId!) },
        { projection: { username: 1 } },
      )

      if (campaign && user) {
        const charCtrlOwnerId = campaign.membership?.ownerId ?? campaign.membership?.adminId
        const campaignName = campaign.identity?.name as string

        if (charCtrlOwnerId) {
          await notificationService.createNotification({
            userId: charCtrlOwnerId,
            type: 'character_pending_approval',
            requiresAction: true,
            context: {
              campaignId: new mongoose.default.Types.ObjectId(campaignId),
              characterId: new mongoose.default.Types.ObjectId(characterId),
            },
            payload: {
              characterName: name,
              userName: user.username,
              campaignName,
            },
          })
        }

        await notificationService.createNotification({
          userId: new mongoose.default.Types.ObjectId(req.userId!),
          type: 'character_pending_approval',
          requiresAction: false,
          context: {
            campaignId: new mongoose.default.Types.ObjectId(campaignId),
            characterId: new mongoose.default.Types.ObjectId(characterId),
          },
          payload: {
            characterName: name,
            campaignName,
          },
        })
      }
    }

    res.status(201).json({ character })
  } catch (err) {
    console.error('Failed to create character:', err)
    res.status(500).json({ error: 'Failed to create character' })
  }
}

export async function updateCharacter(req: Request, res: Response) {
  const character = await characterService.getCharacterById(req.params.id)

  if (!character) {
    res.status(404).json({ error: 'Character not found' })
    return
  }

  const isOwner = character.userId.equals(new mongoose.Types.ObjectId(req.userId!))
  const isPlatformAdmin = req.userRole === 'admin' || req.userRole === 'superadmin'
  const isCampaignAdmin = await characterService.isCampaignAdminForCharacter(req.params.id, req.userId!)

  if (!isOwner && !isPlatformAdmin && !isCampaignAdmin) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  // Campaign admins and platform admins can update all fields.
  // Character owners can only update name, imageKey, narrative, combat, and level-up completion fields.
  let updateData = req.body
  if (!isCampaignAdmin && !isPlatformAdmin) {
    const { name, imageKey, narrative, combat, totalLevel, classes, hitPoints, spells, levelUpPending, pendingLevel, classDefinitionId } = req.body
    updateData = {} as any
    if (name !== undefined) updateData.name = name
    if (imageKey !== undefined) updateData.imageKey = imageKey
    if (narrative !== undefined) updateData.narrative = narrative
    if (combat !== undefined) updateData.combat = combat
    // Allow character owners to complete a pending level-up
    if (character.levelUpPending) {
      if (totalLevel !== undefined) updateData.totalLevel = totalLevel
      if (classes !== undefined) updateData.classes = classes
      if (hitPoints !== undefined) updateData.hitPoints = hitPoints
      if (spells !== undefined) updateData.spells = spells
      if (levelUpPending !== undefined) updateData.levelUpPending = levelUpPending
      if (pendingLevel !== undefined) updateData.pendingLevel = pendingLevel
      if (classDefinitionId !== undefined) updateData.classDefinitionId = classDefinitionId
    }
  }

  try {
    const updated = await characterService.updateCharacter(req.params.id, updateData)

    // Detect level-up cancellation: pending was true, now cleared, and
    // totalLevel was NOT bumped (distinguishes cancel from completion)
    const wasPending = character.levelUpPending === true
    const isNowCleared = updateData.levelUpPending === false
    const levelNotBumped = updateData.totalLevel === undefined || updateData.totalLevel === character.totalLevel
    if (wasPending && isNowCleared && levelNotBumped) {
      await notificationService.createNotification({
        userId: character.userId,
        type: 'levelUp.cancelled',
        requiresAction: false,
        context: {
          characterId: character._id,
        },
        payload: {
          characterName: character.name,
          pendingLevel: character.pendingLevel,
        },
      })
    }

    res.json({ character: updated })
  } catch (err) {
    console.error('Failed to update character:', err)
    res.status(500).json({ error: 'Failed to update character' })
  }
}

export async function deleteCharacter(req: Request, res: Response) {
  const character = await characterService.getCharacterById(req.params.id)

  if (!character) {
    res.status(404).json({ error: 'Character not found' })
    return
  }

  const isOwner = character.userId.equals(new mongoose.Types.ObjectId(req.userId!))
  const isPlatformAdmin = req.userRole === 'admin' || req.userRole === 'superadmin'

  // Only the character owner or a platform admin can delete
  if (!isOwner && !isPlatformAdmin) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const characterId = req.params.id
  const userId = req.userId!
  const characterName = (character.name as string) ?? 'Unknown'

  // Check if the character is in any campaigns
  const memberships = await db()
    .collection('campaignMembers')
    .find({
      characterId: new mongoose.Types.ObjectId(characterId),
      status: 'approved',
    })
    .toArray() as {
      _id: mongoose.Types.ObjectId
      campaignId: mongoose.Types.ObjectId
      characterStatus?: string
      status: string
    }[]

  if (memberships.length === 0) {
    // No campaign memberships — hard delete
    await characterService.deleteCharacter(characterId)
    res.json({ message: 'Character deleted' })
    return
  }

  // Has campaign memberships — soft delete to preserve campaign history
  await characterService.softDeleteCharacter(characterId)

  // Set each active membership to inactive and notify party members
  for (const membership of memberships) {
    const charStatus = membership.characterStatus ?? 'active'
    if (charStatus === 'active') {
      await campaignMemberService.updateCharacterStatus(
        membership._id.toString(),
        'inactive',
      )

      const campaign = await getCampaignById(membership.campaignId.toString())
      if (!campaign) continue

      // Notify approved party members (excluding the deleting user)
      const allMembers = await campaignMemberService.getCampaignMembersByCampaign(
        membership.campaignId.toString(),
      )
      const partyUserIds = (allMembers as { userId: mongoose.Types.ObjectId; status: string }[])
        .filter(
          (mbr) =>
            mbr.status === 'approved' &&
            !mbr.userId.equals(new mongoose.Types.ObjectId(userId)),
        )
        .map((mbr) => mbr.userId)

      for (const memberUserId of partyUserIds) {
        await notificationService.createNotification({
          userId: memberUserId,
          type: 'character.left',
          requiresAction: false,
          context: {
            characterId: new mongoose.Types.ObjectId(characterId),
            campaignId: membership.campaignId,
          },
          payload: {
            characterName,
            campaignName: campaign.identity.name,
          },
        })
      }
    }
  }

  res.json({ message: 'Character deleted' })
}
