import type { Monster } from '@/features/content/monsters/domain/types'
import type {
  MonsterTrait,
  MonsterTraitRequirement,
  MonsterTraitTrigger,
} from '@/features/content/monsters/domain/types/monster-traits.types'
import type { Effect, EmanationEffect, RegenerationEffect } from '@/features/mechanics/domain/effects/effects.types'
import type { EffectDuration, TurnBoundary } from '@/features/mechanics/domain/effects/timing.types'

import { attachedAuraInstanceId } from '../state/auras/attached-battlefield-source'
import type { BattlefieldEffectInstance } from '../state/types/encounter-state.types'
import type { CombatantInstance } from '../state/types/combatant.types'
import type { RuntimeTurnHook, RuntimeTurnHookRequirement } from '../state/types/combatant.types'
import {
  DEFAULT_MANUAL_MONSTER_TRIGGER_CONTEXT,
  type ManualMonsterTriggerContext,
  type MonsterContextTriggerStatus,
  type MonsterRuntimeContext,
} from './monster-runtime.types'

export type { ManualMonsterTriggerContext, MonsterContextTriggerStatus, MonsterRuntimeContext } from './monster-runtime.types'
export { DEFAULT_MANUAL_MONSTER_TRIGGER_CONTEXT } from './monster-runtime.types'

/** Default context when seeding trait attached auras at encounter start (matches summon-ally baseline). */
export const DEFAULT_MONSTER_RUNTIME_CONTEXT_FOR_ENCOUNTER: MonsterRuntimeContext = {
  environment: 'none',
  form: 'true-form',
  manual: DEFAULT_MANUAL_MONSTER_TRIGGER_CONTEXT,
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
    if (trigger.kind === 'in-environment') return context.environment === trigger.environment
    if (trigger.kind === 'in-form') return context.form === trigger.form
    if (trigger.kind === 'contact') return context.manual.contact
    if (trigger.kind === 'ally-near-target') return context.manual.allyNearTarget
    if (trigger.kind === 'while-moving-grappled-creature') return context.manual.movingGrappledCreature
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

function traitContributesAtRuntime(trait: MonsterTrait, context: MonsterRuntimeContext): boolean {
  if (!trait.effects?.length) return false
  const triggers = monsterTriggersArray(trait.trigger)
  if (triggers.length === 0) return true
  return areSupportedContextTriggersMatched(triggers, context)
}

/** Save DC for trait-attached auras (`save` with numeric `dc`, including nested under `interval`). */
export function resolveTraitSaveDcFromEffects(effects: Effect[]): number | undefined {
  for (const e of effects) {
    if (e.kind === 'save' && typeof e.save?.dc === 'number') return e.save.dc
    if (e.kind === 'interval') {
      const nested = resolveTraitSaveDcFromEffects(e.effects)
      if (nested != null) return nested
    }
  }
  return undefined
}

/**
 * Persistent self-centered sphere emanations from traits that are active for the given context
 * (same trigger gating as {@link buildActiveMonsterEffects}).
 */
export function buildAttachedAuraInstancesFromMonsterTraits(
  monster: Monster,
  context: MonsterRuntimeContext,
  combatantInstanceId: string,
): BattlefieldEffectInstance[] {
  const traits = monster.mechanics.traits ?? []
  const out: BattlefieldEffectInstance[] = []

  traits.forEach((trait, traitIndex) => {
    if (!traitContributesAtRuntime(trait, context)) return

    const effects = trait.effects ?? []
    const emanations = effects.filter((e): e is EmanationEffect => e.kind === 'emanation')
    if (emanations.length === 0) return

    const saveDc = resolveTraitSaveDcFromEffects(effects)

    for (const em of emanations) {
      if (em.attachedTo !== 'self' || em.area.kind !== 'sphere') continue

      const source = { kind: 'monster-trait' as const, monsterId: monster.id, traitIndex }
      out.push({
        id: attachedAuraInstanceId(source, combatantInstanceId),
        casterCombatantId: combatantInstanceId,
        source,
        anchor: { kind: 'creature', combatantId: combatantInstanceId },
        area: { kind: 'sphere', size: em.area.size },
        unaffectedCombatantIds: [],
        ...(typeof saveDc === 'number' ? { saveDc } : {}),
      })
    }
  })

  return out
}

/** Collect trait-sourced attached auras for monster combatants when `monstersById` is available. */
export function collectMonsterTraitAttachedAuras(
  combatants: CombatantInstance[],
  monstersById: Record<string, Monster> | undefined,
  context: MonsterRuntimeContext,
): BattlefieldEffectInstance[] {
  if (!monstersById) return []
  const out: BattlefieldEffectInstance[] = []
  for (const c of combatants) {
    if (c.source.kind !== 'monster') continue
    const monster = monstersById[c.source.sourceId]
    if (!monster) continue
    out.push(...buildAttachedAuraInstancesFromMonsterTraits(monster, context, c.instanceId))
  }
  return out
}

function toRuntimeTurnDuration(duration: EffectDuration): { remainingTurns: number; tickOn: TurnBoundary } | undefined {
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

function buildRegenerationHook(
  monsterId: string,
  traitName: string,
  effect: RegenerationEffect,
  hookIndex: string,
): RuntimeTurnHook {
  const requirements: RuntimeTurnHookRequirement[] = []
  if (effect.disabledAtZeroHp) {
    requirements.push({ kind: 'hit-points-above', value: 0 })
  }

  return {
    id: `${monsterId}-regen-${hookIndex}`,
    label: traitName,
    boundary: effect.trigger.kind === 'turn-start' ? 'start' : 'end',
    effects: [{ kind: 'hit-points', mode: 'heal', value: effect.amount }],
    requirements: requirements.length > 0 ? requirements : undefined,
    suppression: effect.suppressedByDamageTypes
      ? {
          damageTypes: effect.suppressedByDamageTypes,
          duration: effect.suppressionDuration
            ? toRuntimeTurnDuration(effect.suppressionDuration)
            : undefined,
        }
      : undefined,
  }
}

export function buildMonsterTurnHooks(monster: Monster): RuntimeTurnHook[] {
  return (monster.mechanics.traits ?? []).flatMap((trait, traitIndex) => {
    const hooks: RuntimeTurnHook[] = []

    const regenEffects = (trait.effects ?? []).filter(
      (e): e is RegenerationEffect => e.kind === 'regeneration',
    )
    for (let i = 0; i < regenEffects.length; i++) {
      hooks.push(buildRegenerationHook(monster.id, trait.name, regenEffects[i], `${traitIndex}-${i}`))
    }

    const triggers = monsterTriggersArray(trait.trigger)
    for (let triggerIndex = 0; triggerIndex < triggers.length; triggerIndex++) {
      const trigger = triggers[triggerIndex]
      if (trigger.kind !== 'turn-start' && trigger.kind !== 'turn-end') continue

      const nonRegenEffects = (trait.effects ?? []).filter((e) => e.kind !== 'regeneration')
      if (nonRegenEffects.length === 0) continue

      hooks.push({
        id: `${monster.id}-trait-${traitIndex}-${triggerIndex}`,
        label: trait.name,
        boundary: trigger.kind === 'turn-start' ? 'start' : 'end',
        effects: nonRegenEffects,
        requirements: toRuntimeTurnHookRequirements(trait.requirements),
        suppression: trait.suppression?.ifTookDamageTypes
          ? {
              damageTypes: trait.suppression.ifTookDamageTypes,
              duration: toRuntimeTurnDuration(trait.suppression.duration),
            }
          : undefined,
      })
    }

    return hooks
  })
}

export function formatMonsterTriggerLabel(trigger: MonsterTraitTrigger): string {
  switch (trigger.kind) {
    case 'ally-near-target':
      return `Ally within ${trigger.withinFeet} ft of target${trigger.allyConditionNot ? ` and not ${trigger.allyConditionNot}` : ''}`
    case 'contact':
      return 'Contact'
    case 'in-environment':
      return `In ${trigger.environment}`
    case 'in-form':
      return `In ${trigger.form}`
    case 'reduced-to-0-hp':
      return 'Reduced to 0 HP'
    case 'turn-end':
      return 'Turn End'
    case 'turn-start':
      return 'Turn Start'
    case 'while-moving-grappled-creature':
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
      if (trigger.kind === 'turn-start' || trigger.kind === 'turn-end') return []

      const status =
        trigger.kind === 'in-environment'
          ? context.environment === trigger.environment
            ? 'matched'
            : 'inactive'
          : trigger.kind === 'in-form'
            ? context.form === trigger.form
              ? 'matched'
              : 'inactive'
            : trigger.kind === 'contact'
              ? context.manual.contact
                ? 'matched'
                : 'inactive'
              : trigger.kind === 'ally-near-target'
                ? context.manual.allyNearTarget
                  ? 'matched'
                  : 'inactive'
                : trigger.kind === 'while-moving-grappled-creature'
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
    monsterTriggersArray(trait.trigger).some((trigger) => trigger.kind === 'reduced-to-0-hp'),
  )
}

export function monsterHasFormTriggers(monster: Monster): boolean {
  return (monster.mechanics.traits ?? []).some((trait) =>
    monsterTriggersArray(trait.trigger).some((trigger) => trigger.kind === 'in-form'),
  )
}

export function monsterSupportedManualTriggers(
  monster: Monster,
): Array<keyof ManualMonsterTriggerContext> {
  const triggerSet = new Set<keyof ManualMonsterTriggerContext>()

  ;(monster.mechanics.traits ?? []).forEach((trait) => {
    monsterTriggersArray(trait.trigger).forEach((trigger) => {
      if (trigger.kind === 'contact') triggerSet.add('contact')
      if (trigger.kind === 'ally-near-target') triggerSet.add('allyNearTarget')
      if (trigger.kind === 'while-moving-grappled-creature') triggerSet.add('movingGrappledCreature')
    })
  })

  return Array.from(triggerSet)
}
