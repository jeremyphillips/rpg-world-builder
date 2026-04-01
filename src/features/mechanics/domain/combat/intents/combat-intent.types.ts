import type { ResolveCombatActionSelection } from '../resolution/action-resolution.types'

/**
 * Truth-changing combat requests. Serializable, UI-agnostic.
 * UI-local preview/hover/modal state must not appear here — see docs/reference/combat/engine/intents-and-events.md.
 */
export type EndTurnIntent = {
  kind: 'end-turn'
  /** When set, must match the encounter’s active combatant id or dispatch fails. */
  actorId?: string
}

export type MoveCombatantIntent = {
  kind: 'move-combatant'
  combatantId: string
  destinationCellId: string
}

/** Mirrors `ResolveCombatActionSelection` plus discriminant (engine DTO, not drawer props). */
export type ResolveActionIntent = { kind: 'resolve-action' } & ResolveCombatActionSelection

/** Confirms an area placement (AoE origin / place-anchored sphere center). Phase 4B+ wiring. */
export type PlaceAreaIntent = {
  kind: 'place-area'
  actorId: string
  actionId: string
  originCellId: string
}

/** Confirms spawn / single-cell placement. Phase 4B+ wiring. */
export type ChooseSpawnCellIntent = {
  kind: 'choose-spawn-cell'
  actorId: string
  actionId: string
  cellId: string
}

export type CombatIntent =
  | EndTurnIntent
  | MoveCombatantIntent
  | ResolveActionIntent
  | PlaceAreaIntent
  | ChooseSpawnCellIntent

export type CombatIntentKind = CombatIntent['kind']
