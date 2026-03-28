import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { TurnBoundary } from '@/features/mechanics/domain/effects/timing.types'
import { rollDie } from '@/features/mechanics/domain/resolution/engines/dice.engine'
import { canTakeActions, canTakeReactions, getSpeedConsequences } from './conditions/condition-rules'

import type {
  CombatantInstance,
  CombatantTurnContext,
  CombatantTurnResources,
  RuntimeEffectInstance,
  RuntimeMarker,
  RuntimeMarkerDuration,
  RuntimeTrackedPart,
  RuntimeTurnHook,
  RuntimeTurnHookRequirement,
} from './types'
import { createCombatTurnResources } from './types'
import type { EncounterState } from './types'
import type { BattlefieldSpellContext } from './battlefield/battlefield-spatial-movement-modifiers'
import { getEffectiveGroundMovementBudgetFt } from './battlefield/battlefield-spatial-movement-modifiers'
import { getCombatantBaseMovement } from './battlefield/combatant-movement-helpers'

export function indexCombatants(combatants: CombatantInstance[]): Record<string, CombatantInstance> {
  return Object.fromEntries(combatants.map((combatant) => [combatant.instanceId, combatant]))
}

export function buildRuntimeMarker(
  label: string,
  options?: {
    durationTurns?: number
    tickOn?: TurnBoundary
    duration?: RuntimeMarkerDuration
    sourceInstanceId?: string
    classification?: string[]
  },
): RuntimeMarker {
  const duration = options?.duration
  const durationTurns = options?.durationTurns
  const sourceInstanceId = options?.sourceInstanceId
  const classification = options?.classification && options.classification.length > 0 ? options.classification : undefined
  if (duration) {
    return {
      id: label,
      label,
      duration,
      sourceInstanceId,
      classification,
    }
  }

  if (!durationTurns || durationTurns <= 0) {
    return {
      id: label,
      label,
      sourceInstanceId,
      classification,
    }
  }

  return {
    id: label,
    label,
    duration: {
      remainingTurns: durationTurns,
      tickOn: options?.tickOn ?? 'end',
    },
    sourceInstanceId,
    classification,
  }
}

export function markerMatches(marker: RuntimeMarker, label: string): boolean {
  return marker.label === label
}

export function formatMarkerLabel(marker: RuntimeMarker): string {
  if (!marker.duration) return marker.label
  const suffix = `${marker.duration.remainingTurns} turn${marker.duration.remainingTurns === 1 ? '' : 's'} ${marker.duration.tickOn}`
  return `${marker.label} (${suffix})`
}

export function formatEffectLabel(effect: Effect): string {
  switch (effect.kind) {
    case 'condition':
      return `Condition: ${effect.conditionId}`
    case 'state':
      return `State: ${effect.stateId}`
    case 'immunity':
      return effect.notes ?? 'Immunity effect'
    case 'hold-breath':
      return 'Hold Breath'
    case 'grant':
      if (effect.grantType === 'condition-immunity') {
        return `Immunity: ${effect.value}`
      }
      return effect.text ?? 'Grant'
    case 'hide-eligibility-grant':
      return effect.text ?? 'Hide eligibility grant'
    default:
      return effect.text ?? effect.kind.replaceAll('_', ' ')
  }
}

export function effectDurationToRuntimeDuration(effect: Effect): RuntimeMarkerDuration | null {
  const duration = effect.duration
  if (!duration) return null

  if (duration.kind === 'until-turn-boundary') {
    return {
      remainingTurns: duration.turn === 'current' ? 0 : 1,
      tickOn: duration.boundary,
    }
  }

  if (duration.kind === 'fixed' && duration.unit === 'turn' && duration.value > 0) {
    return {
      remainingTurns: duration.value,
      tickOn: 'end',
    }
  }

  return null
}

export function deriveRuntimeEffects(combatant: CombatantInstance): RuntimeEffectInstance[] {
  return combatant.activeEffects.flatMap((effect, index) => {
    /** Shown via encounter defense badges; avoid duplicating in generic runtime effect rows. */
    if (effect.kind === 'grant' && effect.grantType === 'condition-immunity') {
      return []
    }
    const duration = effectDurationToRuntimeDuration(effect)
    if (!duration || duration.remainingTurns <= 0) return []

    return [
      {
        id: `${combatant.instanceId}-effect-${index}`,
        label: formatEffectLabel(effect),
        effectKind: effect.kind,
        duration,
      },
    ]
  })
}

export function deriveTrackedParts(combatant: CombatantInstance): RuntimeTrackedPart[] {
  return combatant.activeEffects.flatMap((effect) => {
    if (effect.kind !== 'tracked-part' || typeof effect.initialCount !== 'number') return []

    return [
      {
        part: effect.part,
        currentCount: effect.initialCount,
        initialCount: effect.initialCount,
        lostSinceLastTurn: 0,
        lossAppliedThisTurn: 0,
        damageTakenThisTurn: 0,
        damageTakenByTypeThisTurn: {},
        regrowthSuppressedByDamageTypes: [],
        loss: effect.loss,
        deathWhenCountReaches: effect.deathWhenCountReaches,
        regrowth: effect.regrowth,
      },
    ]
  })
}

export function formatRuntimeEffectLabel(effect: RuntimeEffectInstance): string {
  const suffix = `${effect.duration.remainingTurns} turn${effect.duration.remainingTurns === 1 ? '' : 's'} ${effect.duration.tickOn}`
  return `${effect.label} (${suffix})`
}

export function createEmptyTurnContext(): CombatantTurnContext {
  return {
    totalDamageTaken: 0,
    damageTakenByType: {},
    movementSpentThisTurn: 0,
  }
}

export { getCombatantBaseMovement } from './battlefield/combatant-movement-helpers'

export function getTrackedPartCount(combatant: CombatantInstance, part: 'head' | 'limb'): number {
  return combatant.trackedParts?.find((trackedPart) => trackedPart.part === part)?.currentCount ?? 0
}

export function getCombatantExtraOpportunityAttackReactions(combatant: CombatantInstance): number {
  return combatant.activeEffects.reduce((total, effect) => {
    if (effect.kind !== 'extra-reaction' || effect.appliesTo !== 'opportunity-attacks-only') {
      return total
    }

    return total + Math.max(0, getTrackedPartCount(combatant, effect.count.part) - effect.count.baseline)
  }, 0)
}

export function hasCondition(combatant: CombatantInstance, label: string): boolean {
  return combatant.conditions.some((m) => markerMatches(m, label))
}

export function hasState(combatant: CombatantInstance, label: string): boolean {
  return combatant.states.some((m) => markerMatches(m, label))
}

export function createCombatantTurnResources(
  combatant: CombatantInstance,
  opts?: { encounterState?: EncounterState; battlefieldSpell?: BattlefieldSpellContext },
): CombatantTurnResources {
  const baseMovement =
    opts?.encounterState && opts.battlefieldSpell?.spellLookup
      ? getEffectiveGroundMovementBudgetFt(combatant, opts.encounterState, opts.battlefieldSpell)
      : getCombatantBaseMovement(combatant)

  const resources = createCombatTurnResources(
    baseMovement,
    getCombatantExtraOpportunityAttackReactions(combatant),
  )

  if (!canTakeActions(combatant)) {
    resources.actionAvailable = false
    resources.bonusActionAvailable = false
  }

  if (!canTakeReactions(combatant)) {
    resources.reactionAvailable = false
  }

  if (getSpeedConsequences(combatant).speedBecomesZero) {
    resources.movementRemaining = 0
  }

  return resources
}

export function syncCombatantTurnResources(combatant: CombatantInstance): CombatantTurnResources {
  const extraOpportunityAttackReactions = getCombatantExtraOpportunityAttackReactions(combatant)
  const current = combatant.turnResources
  if (!current) {
    return createCombatantTurnResources(combatant)
  }

  return {
    ...current,
    opportunityAttackReactionsRemaining: Math.min(
      current.opportunityAttackReactionsRemaining,
      extraOpportunityAttackReactions,
    ),
  }
}

export function rollRechargeDie(rng: () => number): number {
  return rollDie(6, rng)
}

export function normalizeDamageType(damageType?: string): string | null {
  const trimmed = damageType?.trim().toLowerCase()
  return trimmed ? trimmed : null
}

export function getTurnKey(state: EncounterState): string {
  return `${state.roundNumber}:${state.turnIndex + 1}`
}

export function requirementLabel(requirement: RuntimeTurnHookRequirement): string {
  switch (requirement.kind) {
    case 'self-state':
      return requirement.state
    case 'damage-taken-this-turn':
      if (requirement.damageType && requirement.min) {
        return `${requirement.min}+ ${requirement.damageType} damage taken this turn`
      }
      if (requirement.damageType) {
        return `${requirement.damageType} damage taken this turn`
      }
      if (requirement.min) {
        return `${requirement.min}+ damage taken this turn`
      }
      return 'damage taken this turn'
    case 'hit-points-equals':
      return `hit points equal ${requirement.value}`
    case 'hit-points-above':
      return `hit points above ${requirement.value}`
  }
}

export function requirementMet(combatant: CombatantInstance, requirement: RuntimeTurnHookRequirement): boolean {
  switch (requirement.kind) {
    case 'self-state':
      return requirement.state === 'bloodied'
        ? combatant.stats.currentHitPoints <= combatant.stats.maxHitPoints / 2
        : false
    case 'hit-points-equals':
      return combatant.stats.currentHitPoints === requirement.value
    case 'hit-points-above':
      return combatant.stats.currentHitPoints > requirement.value
    case 'damage-taken-this-turn': {
      const turnContext = combatant.turnContext ?? createEmptyTurnContext()
      const damageAmount = requirement.damageType
        ? turnContext.damageTakenByType[normalizeDamageType(requirement.damageType) ?? ''] ?? 0
        : turnContext.totalDamageTaken
      return damageAmount >= (requirement.min ?? 1)
    }
  }
}

export function unmetHookRequirements(
  combatant: CombatantInstance,
  hook: RuntimeTurnHook,
): RuntimeTurnHookRequirement[] {
  return (hook.requirements ?? []).filter((requirement) => !requirementMet(combatant, requirement))
}

export function formatTurnHookNote(effect: Effect): string | null {
  switch (effect.kind) {
    case 'tracked-part': {
      const change = 'change' in effect ? effect.change : undefined
      if (change) {
        const verb = change.mode === 'sever' ? 'Sever' : 'Grow'
        return `${verb} ${change.count} ${effect.part}${change.count === 1 ? '' : 's'}.`
      }
      return `Track ${effect.part} count.`
    }
    case 'spawn':
      return `Spawn ${effect.count} ${effect.creature}${effect.count === 1 ? '' : 's'} at ${effect.location}.`
    case 'custom':
      return effect.text ?? `Custom effect: ${effect.id}.`
    case 'note':
      return effect.text
    default:
      return null
  }
}

export function seedRuntimeEffects(combatant: CombatantInstance): CombatantInstance {
  const trackedParts = combatant.trackedParts ?? deriveTrackedParts(combatant)
  return {
    ...combatant,
    actions: combatant.actions ?? [],
    trackedParts,
    turnResources: createCombatantTurnResources({
      ...combatant,
      trackedParts,
    }),
    runtimeEffects:
      combatant.runtimeEffects.length > 0 ? combatant.runtimeEffects : deriveRuntimeEffects(combatant),
  }
}

export function updateCombatant(
  state: EncounterState,
  combatantId: string,
  updater: (combatant: CombatantInstance) => CombatantInstance,
): EncounterState {
  const combatant = state.combatantsById[combatantId]
  if (!combatant) return state

  return {
    ...state,
    combatantsById: {
      ...state.combatantsById,
      [combatantId]: updater(combatant),
    },
  }
}
