import type { Character } from "./character.core"

/** API/document shape for a character (extends CharacterSheet with stored fields). */
export type CharacterDoc = Character & {
  _id: string
  userId?: string
  imageKey?: string | null

  ai?: Record<string, unknown>

  generation?: {
    model?: string
    promptVersion?: string
    messageId?: string
    createdAt?: string
  }

  createdAt: string
  updatedAt: string
}

