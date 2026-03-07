import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import * as conversationService from '../services/conversation.service'
import * as messageService from '../services/message.service'
import * as campaignMemberService from '../services/campaignMember.service'
import { getCampaignById } from '../services/campaign.service'
import { env } from '../shared/config/env'
import { canMessageUser, canMessageUsers } from '../../src/features/messaging'

const db = () => mongoose.connection.useDb(env.DB_NAME)

async function enrichConversation(
  conv: unknown,
  currentUserId: string,
  usersCol: ReturnType<typeof db>['collection']
) {
  const c = conv as { participantIds: mongoose.Types.ObjectId[]; campaignId?: mongoose.Types.ObjectId; name?: string }
  const participants = await Promise.all(
    c.participantIds.map(async (id) => {
      const u = await usersCol.findOne({ _id: id }, { projection: { username: 1, _id: 1 } })
      return u ? { _id: u._id.toString(), username: u.username } : null
    })
  )
  const filtered = participants.filter(Boolean) as { _id: string; username: string }[]
  const otherParticipant = c.participantIds.length === 2
    ? filtered.find((p) => p._id !== currentUserId) ?? null
    : null
  const isDirect = c.participantIds.length === 2

  return {
    _id: (conv as { _id: mongoose.Types.ObjectId })._id.toString(),
    campaignId: c.campaignId?.toString(),
    participantIds: c.participantIds.map((id) => id.toString()),
    name: c.name,
    lastMessageAt: (conv as { lastMessageAt: Date }).lastMessageAt,
    isDirect,
    otherParticipant,
    participants: isDirect ? undefined : filtered,
  }
}

async function getCampaignMemberUserIds(campaignId: string): Promise<string[]> {
  const campaign = await getCampaignById(campaignId)
  const ownerId = (campaign?.membership?.ownerId)
    ? (campaign.membership.ownerId).toString()
    : null
  const members = await campaignMemberService.getCampaignMembersByCampaign(campaignId)
  const memberIds = (
    members as { userId: mongoose.Types.ObjectId; status: string }[]
  )
    .filter((m) => m.status === 'approved')
    .map((m) => m.userId.toString())
  const all = new Set(memberIds)
  if (ownerId) all.add(ownerId)
  return [...all]
}

export async function getConversations(req: Request, res: Response) {
  const userId = req.userId!
  const campaignId = req.query.campaignId as string | undefined

  if (!campaignId) {
    res.status(400).json({ error: 'campaignId is required' })
    return
  }

  const memberUserIds = await getCampaignMemberUserIds(campaignId)
  const isMember = memberUserIds.includes(userId)
  if (!isMember) {
    res.status(403).json({ error: 'You are not a member of this campaign' })
    return
  }

  const conversations = await conversationService.getConversationsForUser(userId, campaignId)
  const usersCol = db().collection('users')

  const enriched = await Promise.all(
    conversations.map(async (conv) => enrichConversation(conv, userId, usersCol))
  )

  res.json({ conversations: enriched })
}

export async function createConversation(req: Request, res: Response) {
  const userId = req.userId!
  const { campaignId, targetUserId, participantIds: bodyParticipantIds, name } = req.body

  if (!campaignId) {
    res.status(400).json({ error: 'campaignId is required' })
    return
  }

  const memberUserIds = await getCampaignMemberUserIds(campaignId)
  const usersCol = db().collection('users')

  if (targetUserId) {
    if (!canMessageUser(userId, targetUserId, memberUserIds)) {
      res.status(403).json({ error: 'You cannot message this user in this campaign' })
      return
    }

    const existing = await conversationService.findConversationBetween(
      campaignId,
      userId,
      targetUserId
    )
    if (existing) {
      const enriched = await enrichConversation(existing, userId, usersCol)
      return res.json({ conversation: enriched })
    }

    const conversation = await conversationService.createConversation({
      campaignId,
      participantIds: [userId, targetUserId],
    })
    const enriched = await enrichConversation(conversation, userId, usersCol)
    return res.status(201).json({ conversation: enriched })
  }

  if (!bodyParticipantIds || !Array.isArray(bodyParticipantIds) || bodyParticipantIds.length < 1) {
    res.status(400).json({ error: 'For group chat, participantIds (array of 1+ user IDs) is required' })
    return
  }

  const allIds = [...new Set([userId, ...bodyParticipantIds])]
  if (!canMessageUsers(userId, bodyParticipantIds, memberUserIds)) {
    res.status(403).json({ error: 'All participants must be campaign members' })
    return
  }

  const conversation = await conversationService.createConversation({
    campaignId,
    participantIds: allIds,
    name,
  })
  const enriched = await enrichConversation(conversation, userId, usersCol)
  return res.status(201).json({ conversation: enriched })
}

export async function getConversation(req: Request, res: Response) {
  const userId = req.userId!
  const { conversationId } = req.params

  const conversation = await conversationService.getConversationById(conversationId)
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' })
    return
  }

  const conv = conversation as { participantIds: mongoose.Types.ObjectId[] }
  const isParticipant = conv.participantIds.some((id) => id.toString() === userId)
  if (!isParticipant) {
    res.status(403).json({ error: 'You are not a participant in this conversation' })
    return
  }

  const usersCol = db().collection('users')
  const enriched = await enrichConversation(conversation, userId, usersCol)
  res.json({ conversation: enriched })
}

export async function getMessages(req: Request, res: Response) {
  const userId = req.userId!
  const { conversationId } = req.params
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
  const before = req.query.before ? new Date(req.query.before as string) : undefined

  const conversation = await conversationService.getConversationById(conversationId)
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' })
    return
  }

  const conv = conversation as { participantIds: mongoose.Types.ObjectId[] }
  const isParticipant = conv.participantIds.some((id) => id.toString() === userId)
  if (!isParticipant) {
    res.status(403).json({ error: 'You are not a participant in this conversation' })
    return
  }

  const messages = await messageService.getMessagesByConversation(
    conversationId,
    limit,
    before
  )

  const formatted = messages.map((m) => {
    const msg = m as MessageDocShape
    return {
      _id: msg._id.toString(),
      conversationId: msg.conversationId.toString(),
      senderId: msg.senderId.toString(),
      content: msg.content,
      readBy: msg.readBy.map((id) => id.toString()),
      createdAt: msg.createdAt,
    }
  })

  res.json({ messages: formatted })
}

interface MessageDocShape {
  _id: mongoose.Types.ObjectId
  conversationId: mongoose.Types.ObjectId
  senderId: mongoose.Types.ObjectId
  content: string
  readBy: mongoose.Types.ObjectId[]
  createdAt: Date
}

export async function createMessage(req: Request, res: Response) {
  const userId = req.userId!
  const { conversationId } = req.params
  const { content } = req.body

  if (!content || typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ error: 'content is required' })
    return
  }

  const conversation = await conversationService.getConversationById(conversationId)
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' })
    return
  }

  const conv = conversation as { participantIds: mongoose.Types.ObjectId[] }
  const isParticipant = conv.participantIds.some((id) => id.toString() === userId)
  if (!isParticipant) {
    res.status(403).json({ error: 'You are not a participant in this conversation' })
    return
  }

  const message = await messageService.createMessage({
    conversationId,
    senderId: userId,
    content: content.trim(),
  })

  const msg = message as MessageDocShape
  res.status(201).json({
    message: {
      _id: msg._id.toString(),
      conversationId: msg.conversationId.toString(),
      senderId: msg.senderId.toString(),
      content: msg.content,
      readBy: msg.readBy.map((id) => id.toString()),
      createdAt: msg.createdAt,
    },
  })
}
