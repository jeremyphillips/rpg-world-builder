import type { EncounterState } from '@/features/mechanics/domain/combat'
import type { Location } from '@/features/content/locations/domain/model/location'

/**
 * Building / floor hints for resolving vertical links (stairs, future portals).
 * Aligns with {@link GameSessionLocationContext} so live session can pass `session.location` directly.
 */
export type EncounterTransitionLocationContext = {
  locationId?: string | null
  buildingId?: string | null
  floorId?: string | null
}

/**
 * Normalized inputs for contextual encounter prompts (stairs, ladders, objectives, …).
 * Session and simulator each adapt their native data into this shape.
 */
export type EncounterContextPromptEnvironment = {
  campaignId: string | null
  locations: readonly Location[]
  locationContext: EncounterTransitionLocationContext
  encounterState: EncounterState | null
}

/** Entry-point hint for logging / future policy (optional). */
export type EncounterContextPromptEntryKind = 'game-session' | 'simulator'
