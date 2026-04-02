/**
 * Player-facing live-play container (Campaign → GameSession → optional Encounter).
 * Distinct from the Encounter Simulator (`/encounter`) and calendar Sessions (`/sessions`).
 */

export type GameSessionStatus =
  | 'draft'
  | 'scheduled'
  | 'lobby'
  | 'active'
  | 'completed'
  | 'cancelled'

export type GameSessionParticipantRole = 'dm' | 'player' | 'observer'

export type GameSessionParticipant = {
  userId: string
  characterId?: string | null
  role: GameSessionParticipantRole
  /** Reserved for future join / presence */
  joinedAt?: string | null
}

export type GameSessionLocationContext = {
  locationId?: string | null
  buildingId?: string | null
  floorId?: string | null
  /** Human-readable place line for lobby/setup */
  label?: string | null
}

export type GameSession = {
  id: string
  campaignId: string
  status: GameSessionStatus
  dmUserId: string
  title: string
  /**
   * Planned start (ISO datetime), for display and planning only.
   * Lifecycle `status` is authoritative; this does not auto-open the lobby.
   */
  scheduledFor: string | null
  location: GameSessionLocationContext
  /**
   * Planned opponent references (`monster:id` / `npc:id`), aligned with encounter opponent picker keys.
   */
  opponentRefKeys: string[]
  participants: GameSessionParticipant[]
  /**
   * Active encounter subsystem owned by this session (child), when live combat exists.
   * Not wired in the MVP shell.
   */
  activeEncounterId?: string | null
  createdAt?: string
  updatedAt?: string
}
