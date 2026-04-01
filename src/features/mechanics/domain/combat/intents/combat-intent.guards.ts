import type {
  CombatIntent,
  EndTurnIntent,
  MoveCombatantIntent,
  PlaceAreaIntent,
  ResolveActionIntent,
  ChooseSpawnCellIntent,
} from './combat-intent.types'

export function isEndTurnIntent(intent: CombatIntent): intent is EndTurnIntent {
  return intent.kind === 'end-turn'
}

export function isMoveCombatantIntent(intent: CombatIntent): intent is MoveCombatantIntent {
  return intent.kind === 'move-combatant'
}

export function isResolveActionIntent(intent: CombatIntent): intent is ResolveActionIntent {
  return intent.kind === 'resolve-action'
}

export function isPlaceAreaIntent(intent: CombatIntent): intent is PlaceAreaIntent {
  return intent.kind === 'place-area'
}

export function isChooseSpawnCellIntent(intent: CombatIntent): intent is ChooseSpawnCellIntent {
  return intent.kind === 'choose-spawn-cell'
}
