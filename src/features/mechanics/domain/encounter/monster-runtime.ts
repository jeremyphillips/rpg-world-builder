import type { Monster } from '@/features/content/monsters/domain/types'
import type {
  MonsterTraitRequirement,
  MonsterTraitTrigger,
} from '@/features/content/monsters/domain/types/monster-traits.types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'

import type { RuntimeTurnHook } from './combatant.types'

export type ManualEnvironmentContext = 'none' | 'sunlight'
export type MonsterFormContext = 'object' | 'true-form'

export type ManualMonsterTriggerContext = {
  contact: boolean
  allyNearTarget: boolean
  movingGrappledCreature: boolean
}

export type MonsterRuntimeContext = {
  environment: ManualEnvironmentContext
  form: MonsterFormContext
  manual: ManualMonsterTriggerContext
}

export type MonsterContextTriggerStatus = {
  id: string
  traitName: string
  label: string
  status: 'matched' | 'inactive' | 'manual'
}

export const DEFAULT_MANUAL_MONSTER_TRIGGER_CONTEXT: ManualMonsterTriggerContext = {
  contact: false,
  allyNearTarget: false,
  movingGrappledCreature: false,
}

export function monsterTriggersArray(
  triggers?: MonsterTraitTrigger | MonsterTraitTrigger[],
): MonsterTraitTrigger[] {
  return Array.isArray(triggers) ? triggers : triggers ? [triggers] : []
}

function areSupportedContextTriggersMatched(
  triggers: MonsterTraitTrigger[],
  context: MonsterRuntimeContext,
): boolean {
  if (triggers.length === 0) return true

  return triggers.every((trigger) => {
    if (trigger.kind === 'in_environment') return context.environment === trigger.environment
    if (trigger.kind === 'in_form') return context.form === trigger.form
    if (trigger.kind === 'contact') return context.manual.contact
    if (trigger.kind === 'ally_near_target') return context.manual.allyNearTarget
    if (trigger.kind === 'while_moving_grappled_creature') return context.manual.movingGrappledCreature
    return false
  })
}

export function buildActiveMonsterEffects(
  monster: Monster,
  context: MonsterRuntimeContext,
): Effect[] {
  return (monster.mechanics.traits ?? []).flatMap((trait) => {
    if (!trait.effects || trait.effects.length === 0) return []

    const triggers = monsterTriggersArray(trait.trigger)
    if (triggers.length === 0) return trait.effects

    return areSupportedContextTriggersMatched(triggers, context) ? trait.effects : []
  })
}

function toRuntimeTurnDuration(duration: {
  kind: 'instant'
} | {
  kind: 'fixed'
  value: number
  unit: 'turn' | 'round' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'
} | {
  kind: 'until_turn_boundary'
  subject: 'self' | 'source' | 'target'
  turn: 'current' | 'next'
  boundary: 'start' | 'end'
}): { remainingTurns: number; tickOn: 'start' | 'end' } | undefined {
  if (duration.kind === 'until_turn_boundary') {
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

  return undefined
}

function toRuntimeTurnHookRequirements(
  requirements?: MonsterTraitRequirement[],
): RuntimeTurnHook['requirements'] {
  return requirements?.map((requirement) => {
    switch (requirement.kind) {
      case 'self-state':
        return requirement
      case 'damage-taken-this-turn':
        return requirement
      case 'hit-points-equals':
        return requirement
    }
  })
}

export function buildMonsterTurnHooks(monster: Monster): RuntimeTurnHook[] {
  return (monster.mechanics.traits ?? []).flatMap((trait, traitIndex) => {
    const triggers = monsterTriggersArray(trait.trigger)

    return triggers.flatMap((trigger, triggerIndex) => {
      if (trigger.kind !== 'turn_start' && trigger.kind !== 'turn_end') return []
      if (!trait.effects || trait.effects.length === 0) return []

      return [
        {
          id: `${monster.id}-trait-${traitIndex}-${triggerIndex}`,
          label: trait.name,
          boundary: trigger.kind === 'turn_start' ? 'start' : 'end',
          effects: trait.effects,
          requirements: toRuntimeTurnHookRequirements(trait.requirements),
          suppression: trait.suppression?.ifTookDamageTypes
            ? {
                damageTypes: trait.suppression.ifTookDamageTypes,
                duration: toRuntimeTurnDuration(trait.suppression.duration),
              }
            : undefined,
        },
      ]
    })
  })
}

export function formatMonsterTriggerLabel(trigger: MonsterTraitTrigger): string {
  switch (trigger.kind) {
    case 'ally_near_target':
      return `Ally within ${trigger.withinFeet} ft of target${trigger.allyConditionNot ? ` and not ${trigger.allyConditionNot}` : ''}`
    case 'contact':
      return 'Contact'
    case 'in_environment':
      return `In ${trigger.environment}`
    case 'in_form':
      return `In ${trigger.form}`
    case 'reduced_to_0_hp':
      return 'Reduced to 0 HP'
    case 'turn_end':
      return 'Turn End'
    case 'turn_start':
      return 'Turn Start'
    case 'while_moving_grappled_creature':
      return 'While moving grappled creature'
  }
}

export function buildMonsterContextTriggers(
  monster: Monster,
  context: MonsterRuntimeContext,
): MonsterContextTriggerStatus[] {
  return (monster.mechanics.traits ?? []).flatMap((trait, traitIndex) => {
    const triggers = monsterTriggersArray(trait.trigger)

    return triggers.flatMap((trigger, triggerIndex) => {
      if (trigger.kind === 'turn_start' || trigger.kind === 'turn_end') return []

      const status =
        trigger.kind === 'in_environment'
          ? context.environment === trigger.environment
            ? 'matched'
            : 'inactive'
          : trigger.kind === 'in_form'
            ? context.form === trigger.form
              ? 'matched'
              : 'inactive'
            : trigger.kind === 'contact'
              ? context.manual.contact
                ? 'matched'
                : 'inactive'
              : trigger.kind === 'ally_near_target'
                ? context.manual.allyNearTarget
                  ? 'matched'
                  : 'inactive'
                : trigger.kind === 'while_moving_grappled_creature'
                  ? context.manual.movingGrappledCreature
                    ? 'matched'
                    : 'inactive'
                  : 'manual'

      return [
        {
          id: `${monster.id}-context-trigger-${traitIndex}-${triggerIndex}`,
          traitName: trait.name,
          label: formatMonsterTriggerLabel(trigger),
          status,
        },
      ]
    })
  })
}

export function buildReducedToZeroTraits(monster: Monster) {
  return (monster.mechanics.traits ?? []).filter((trait) =>
    monsterTriggersArray(trait.trigger).some((trigger) => trigger.kind === 'reduced_to_0_hp'),
  )
}

export function monsterHasFormTriggers(monster: Monster): boolean {
  return (monster.mechanics.traits ?? []).some((trait) =>
    monsterTriggersArray(trait.trigger).some((trigger) => trigger.kind === 'in_form'),
  )
}

export function monsterSupportedManualTriggers(
  monster: Monster,
): Array<keyof ManualMonsterTriggerContext> {
  const triggerSet = new Set<keyof ManualMonsterTriggerContext>()

  ;(monster.mechanics.traits ?? []).forEach((trait) => {
    monsterTriggersArray(trait.trigger).forEach((trigger) => {
      if (trigger.kind === 'contact') triggerSet.add('contact')
      if (trigger.kind === 'ally_near_target') triggerSet.add('allyNearTarget')
      if (trigger.kind === 'while_moving_grappled_creature') triggerSet.add('movingGrappledCreature')
    })
  })

  return Array.from(triggerSet)
}
