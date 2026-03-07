import mongoose from 'mongoose'
import { env } from '../shared/config/env'

const db = () => mongoose.connection.useDb(env.DB_NAME)
const conversationsCollection = () => db().collection('conversations')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationDoc {
  _id: mongoose.Types.ObjectId
  campaignId?: mongoose.Types.ObjectId
  participantIds: mongoose.Types.ObjectId[]
  name?: string
  createdAt: Date
  updatedAt: Date
  lastMessageAt: Date
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getConversationById(id: string) {
  return conversationsCollection().findOne({
    _id: new mongoose.Types.ObjectId(id),
  })
}

export async function getConversationsForUser(userId: string, campaignId?: string) {
  const query: Record<string, unknown> = {
    participantIds: new mongoose.Types.ObjectId(userId),
  }
  if (campaignId) {
    query.campaignId = new mongoose.Types.ObjectId(campaignId)
  }
  return conversationsCollection()
    .find(query)
    .sort({ lastMessageAt: -1 })
    .toArray()
}

export async function findConversationBetween(
  campaignId: string,
  userId1: string,
  userId2: string
) {
  const oid1 = new mongoose.Types.ObjectId(userId1)
  const oid2 = new mongoose.Types.ObjectId(userId2)
  return conversationsCollection().findOne({
    campaignId: new mongoose.Types.ObjectId(campaignId),
    participantIds: { $all: [oid1, oid2] },
    $expr: { $eq: [{ $size: '$participantIds' }, 2] },
  })
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export async function createConversation(data: {
  campaignId: string
  participantIds: string[]
  name?: string
}) {
  const now = new Date()
  const doc: Record<string, unknown> = {
    campaignId: new mongoose.Types.ObjectId(data.campaignId),
    participantIds: data.participantIds.map((id) => new mongoose.Types.ObjectId(id)),
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
  }
  if (data.name?.trim()) {
    doc.name = data.name.trim()
  }
  const result = await conversationsCollection().insertOne(doc)
  return conversationsCollection().findOne({ _id: result.insertedId })
}

export async function updateConversationLastMessage(conversationId: string) {
  const now = new Date()
  return conversationsCollection().findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(conversationId) },
    { $set: { updatedAt: now, lastMessageAt: now } },
    { returnDocument: 'after' }
  )
}
