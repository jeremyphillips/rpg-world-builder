export interface Conversation {
  _id: string
  campaignId?: string
  participantIds: string[]
  name?: string
  createdAt: string
  updatedAt: string
  lastMessageAt: string
}

/** True if conversation has exactly 2 participants (direct message). */
export const isDirectConversation = (participantIds: string[]): boolean =>
  participantIds.length === 2

/** True if conversation has 3+ participants (group chat). */
export const isGroupConversation = (participantIds: string[]): boolean =>
  participantIds.length >= 3

export interface Message {
  _id: string
  conversationId: string
  senderId: string
  content: string
  readBy: string[]
  createdAt: string
}
  