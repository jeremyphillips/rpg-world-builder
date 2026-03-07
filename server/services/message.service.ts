import mongoose from 'mongoose'
import { env } from '../shared/config/env'
import * as conversationService from './conversation.service'
import * as notificationService from './notification.service'
import { emitNewMessage } from '../socket'

const db = () => mongoose.connection.useDb(env.DB_NAME)

const messagesCollection = () => db().collection('messages')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MessageDoc {
  _id: mongoose.Types.ObjectId
  conversationId: mongoose.Types.ObjectId
  senderId: mongoose.Types.ObjectId
  content: string
  readBy: mongoose.Types.ObjectId[]
  createdAt: Date
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getMessagesByConversation(
  conversationId: string,
  limit = 50,
  before?: Date
) {
  const query: Record<string, unknown> = {
    conversationId: new mongoose.Types.ObjectId(conversationId),
  }
  if (before) {
    query.createdAt = { $lt: before }
  }
  return messagesCollection()
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()
    .then((docs) => docs.reverse())
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export async function createMessage(data: {
  conversationId: string
  senderId: string
  content: string
}) {
  const doc = {
    conversationId: new mongoose.Types.ObjectId(data.conversationId),
    senderId: new mongoose.Types.ObjectId(data.senderId),
    content: data.content,
    readBy: [new mongoose.Types.ObjectId(data.senderId)],
    createdAt: new Date(),
  }
  const result = await messagesCollection().insertOne(doc)
  const message = await messagesCollection().findOne({ _id: result.insertedId })

  await conversationService.updateConversationLastMessage(data.conversationId)

  const conversation = await conversationService.getConversationById(data.conversationId)
  if (conversation) {
    const conv = conversation as { participantIds: mongoose.Types.ObjectId[] }
    const otherParticipantIds = conv.participantIds.filter(
      (id) => !id.equals(new mongoose.Types.ObjectId(data.senderId))
    )
    const convWithCampaign = conversation as { campaignId?: mongoose.Types.ObjectId }
    for (const userId of otherParticipantIds) {
      await notificationService.createNotification({
        userId,
        type: 'new_message',
        requiresAction: true,
        context: {
          conversationId: new mongoose.Types.ObjectId(data.conversationId),
          campaignId: convWithCampaign.campaignId,
        },
        payload: {},
      })
    }
  }

  emitNewMessage(data.conversationId, {
    _id: (message as { _id: mongoose.Types.ObjectId })._id.toString(),
    conversationId: data.conversationId,
    senderId: data.senderId,
    content: data.content,
    readBy: [data.senderId],
    createdAt: (message as { createdAt: Date }).createdAt,
  })

  return message
}

export async function markMessageAsRead(messageId: string, userId: string) {
  return messagesCollection().findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(messageId) },
    { $addToSet: { readBy: new mongoose.Types.ObjectId(userId) } },
    { returnDocument: 'after' }
  )
}
