/**
 * Domain logic for messages.
 * Pure functions, no side effects.
 */

import type { Message } from './types'

/**
 * Check if a message has been read by a specific user.
 */
export function isMessageReadBy(message: Message, userId: string): boolean {
  return message.readBy.includes(userId)
}
