import type { CombatIntent } from '@rpg-world-builder/mechanics'
import type { EncounterState } from '@rpg-world-builder/mechanics'
import {
  inferPlayerCharacterIdFromEncounterOwnership,
  resolveSessionControlledCombatantIds,
} from '@rpg-world-builder/mechanics'

import type { GameSessionApi, GameSessionParticipantRole } from '../../gameSession/services/gameSession.service'

/**
 * Resolves session seat from game session + user (mirrors client `resolveGameSessionEncounterSeat`).
 */
export function resolveGameSessionEncounterSeat(
  session: GameSessionApi,
  userId: string,
  options?: {
    encounterState?: EncounterState
    partyRoster?: readonly { id: string; ownerUserId: string }[]
  },
): { viewerRole: GameSessionParticipantRole; playerCharacterId: string | null } {
  const participant = session.participants.find((p) => p.userId === userId)
  if (participant) {
    return {
      viewerRole: participant.role,
      playerCharacterId: participant.characterId ?? null,
    }
  }
  if (session.dmUserId === userId) {
    return { viewerRole: 'dm', playerCharacterId: null }
  }
  const encounter = options?.encounterState
  const roster = options?.partyRoster
  if (encounter && roster?.length) {
    const inferred = inferPlayerCharacterIdFromEncounterOwnership(userId, encounter, roster)
    if (inferred != null) {
      return { viewerRole: 'player', playerCharacterId: inferred }
    }
  }
  return { viewerRole: 'observer', playerCharacterId: null }
}

/**
 * When a combat session is **not** linked to a game session (Encounter Simulator, tests),
 * any **authenticated** user may submit intents; enforce auth at the route.
 *
 * When **linked**, only viewers who control the relevant combatant(s) may submit turn intents
 * (same rules as `resolveSessionControlledCombatantIds` + client `deriveEncounterCapabilities`).
 */
export function authorizeCombatIntentForGameSession(params: {
  userId: string
  state: EncounterState
  intent: CombatIntent
  gameSession: GameSessionApi
  /** Campaign roster ownership — required for correct player seat when `participants` omits non-DM users. */
  partyRoster?: readonly { id: string; ownerUserId: string }[]
}): { allowed: true } | { allowed: false } {
  const { viewerRole, playerCharacterId } = resolveGameSessionEncounterSeat(
    params.gameSession,
    params.userId,
    { encounterState: params.state, partyRoster: params.partyRoster },
  )

  const controlled = resolveSessionControlledCombatantIds(params.state, {
    viewerRole,
    playerCharacterId,
  })

  if (viewerRole === 'observer') {
    return { allowed: false }
  }

  const { intent, state } = params

  switch (intent.kind) {
    case 'end-turn': {
      const actor = intent.actorId ?? state.activeCombatantId
      if (actor == null || state.activeCombatantId == null) return { allowed: false }
      if (!controlled.includes(actor)) return { allowed: false }
      return { allowed: true }
    }
    case 'move-combatant':
    case 'stair-traversal':
    case 'open-door': {
      if (!controlled.includes(intent.combatantId)) return { allowed: false }
      return { allowed: true }
    }
    case 'resolve-action': {
      if (!controlled.includes(intent.actorId)) return { allowed: false }
      return { allowed: true }
    }
    case 'place-area':
    case 'choose-spawn-cell': {
      if (!controlled.includes(intent.actorId)) return { allowed: false }
      return { allowed: true }
    }
    default: {
      const _exhaustive: never = intent
      return _exhaustive
    }
  }
}
