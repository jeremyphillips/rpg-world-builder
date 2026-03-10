/**
 * Domain logic for conversations.
 * Pure functions, no side effects.
 */

import type { Conversation } from './types'

/**
 * Get the other participant's ID in a 1:1 conversation.
 */
export function getOtherParticipantId(
  conversation: Conversation,
  currentUserId: string
): string | undefined {
  return conversation.participantIds.find((id) => id !== currentUserId)
}

/**
 * Get all participant IDs except the current user.
 */
export function getOtherParticipantIds(
  conversation: Conversation,
  currentUserId: string
): string[] {
  return conversation.participantIds.filter((id) => id !== currentUserId)
}

/**
 * Create a deterministic sort key for a 1:1 conversation between two users.
 * Ensures the same order regardless of who created the conversation.
 */
export function getConversationPartnerKey(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_')
}

export interface ParticipantInfo {
  _id: string
  username: string
}

/**
 * Get display name for a conversation (for list/header).
 * Direct: other user's username. Group: custom name or comma-separated participant names.
 */
export function getConversationDisplayName(
  conversation: {
    name?: string
    otherParticipant?: ParticipantInfo
    participants?: ParticipantInfo[]
  },
  currentUserId: string
): string {
  if (conversation.name?.trim()) return conversation.name.trim()
  if (conversation.otherParticipant) return conversation.otherParticipant.username
  if (conversation.participants?.length) {
    const names = conversation.participants
      .filter((p) => p._id !== currentUserId)
      .map((p) => p.username)
    return names.length > 0 ? names.join(', ') : 'Group'
  }
  return 'Unknown'
}
