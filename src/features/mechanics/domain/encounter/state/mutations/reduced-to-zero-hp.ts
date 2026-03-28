import type { Monster } from '@/features/content/monsters/domain/types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import { getAbilityModifier } from '@/features/mechanics/domain/abilities/getAbilityModifier'
import { abilityIdToKey, type AbilityRef } from '@/features/mechanics/domain/character'
import { rollD20WithRollMode } from '@/features/mechanics/domain/resolution/engines/dice.engine'
import { buildReducedToZeroTraits } from '../../runtime/monster-runtime'
import type { CombatLogEvent } from '../types'
import type { CombatantDeathRecord, CombatantInstance, CombatantRemainsKind } from '../types/combatant.types'
import { getCombatantDisplayLabel } from '../combatants/combatant-display-label'
import { normalizeDamageType } from '../shared'

function displayNameForCombatant(
  combatant: CombatantInstance,
  options: { allCombatants?: readonly CombatantInstance[] },
): string {
  if (options.allCombatants && options.allCombatants.length > 0) {
    return getCombatantDisplayLabel(combatant, options.allCombatants)
  }
  return combatant.source.label
}

function saveModifierForAbility(combatant: CombatantInstance, ability: AbilityRef): number {
  const abilityKey = abilityIdToKey(ability)
  return (
    combatant.stats.savingThrowModifiers?.[abilityKey] ??
    getAbilityModifier(combatant.stats.abilityScores?.[abilityKey] ?? 10)
  )
}

function shouldSkipSaveFromExceptionEffects(
  effects: Effect[],
  damageType: string | undefined,
  criticalHit: boolean | undefined,
): { skip: boolean; reason?: string } {
  for (const e of effects) {
    if (e.kind !== 'custom' || e.id !== 'monster.save_exception' || !e.params || typeof e.params !== 'object') {
      continue
    }
    const p = e.params as { damageTypes?: string[]; criticalHit?: boolean }
    if (damageType && p.damageTypes?.length) {
      const n = normalizeDamageType(damageType)
      if (p.damageTypes.some((dt) => normalizeDamageType(dt) === n)) {
        return { skip: true, reason: `${damageType.trim()} damage bypasses Undead Fortitude` }
      }
    }
    if (criticalHit && p.criticalHit) {
      return { skip: true, reason: 'critical hit bypasses Undead Fortitude' }
    }
  }
  return { skip: false }
}

/**
 * Result of Undead Fortitude–style resolution when damage would take HP from above 0 to 0.
 * `defeatOutcome` is set only when the creature ends at **0 HP** (killed / defeated), not when stabilized at 1 HP.
 */
export type ReducedToZeroHpResult = {
  newHp: number
  defeatOutcome:
    | {
        /** No longer in initiative — HP is 0 after this resolution. */
        participation: 'defeated'
        /** Death record applied with remains + round (revival / aftermath). */
        death: CombatantDeathRecord
      }
    | undefined
  logEvents: Omit<CombatLogEvent, 'id' | 'timestamp'>[]
}

/**
 * When damage would reduce a monster from above 0 to 0 HP, resolve Undead Fortitude–style traits.
 * Returns `null` to use default HP math (no matching trait / not applicable).
 */
export function resolveReducedToZeroHpTrait(
  combatant: CombatantInstance,
  prevHp: number,
  effectiveAmount: number,
  fatalTrackedPart: boolean,
  round: number,
  turn: number,
  options: {
    damageType?: string
    criticalHit?: boolean
    monstersById?: Record<string, Monster>
    rng: () => number
    remainsOnKill?: CombatantRemainsKind
    /** When set, log lines use duplicate-aware display names (same rules as encounter UI). */
    allCombatants?: readonly CombatantInstance[]
  },
): ReducedToZeroHpResult | null {
  if (fatalTrackedPart) return null
  if (prevHp <= 0 || prevHp - effectiveAmount > 0) return null
  if (combatant.source.kind !== 'monster' || !options.monstersById) return null

  const monster = options.monstersById[combatant.source.sourceId]
  if (!monster) return null

  const traits = buildReducedToZeroTraits(monster)
  if (traits.length === 0) return null

  const trait = traits[0]!
  const effects = trait.effects ?? []
  const skip = shouldSkipSaveFromExceptionEffects(effects, options.damageType, options.criticalHit)

  const defaultDeath: CombatantDeathRecord = {
    remains: (options.remainsOnKill ?? combatant.remains ?? 'corpse') as CombatantRemainsKind,
    diedAtRound: combatant.diedAtRound ?? round,
  }

  const baseDebug = [`trigger: reduced-to-0-hp`, `trait: ${trait.name}`, `damage taken (for DC): ${effectiveAmount}`]

  if (skip.skip) {
    const debugDetails = [...baseDebug, `skip: ${skip.reason ?? 'save exception'}`]
    return {
      newHp: 0,
      defeatOutcome: { participation: 'defeated', death: defaultDeath },
      logEvents: [
        {
          type: 'hook-triggered',
          actorId: combatant.instanceId,
          targetIds: [combatant.instanceId],
          round,
          turn,
          summary: `${displayNameForCombatant(combatant, options)} hook fires: ${trait.name}.`,
          details: skip.reason,
          debugDetails,
        },
      ],
    }
  }

  const saveEffect = effects.find((e): e is Extract<Effect, { kind: 'save' }> => e.kind === 'save')
  const dcSpec = saveEffect?.save.dc
  if (
    !saveEffect ||
    dcSpec === undefined ||
    typeof dcSpec === 'number' ||
    dcSpec.kind !== '5-plus-damage-taken'
  ) {
    return null
  }

  const dc = 5 + effectiveAmount
  const ability = saveEffect.save.ability
  const mod = saveModifierForAbility(combatant, ability)
  const { rawRoll, detail } = rollD20WithRollMode('normal', options.rng)
  const total = rawRoll + mod
  const success = total >= dc

  const debugDetails = [
    ...baseDebug,
    `DC: ${dc} (5 + ${effectiveAmount})`,
    `${ability.toUpperCase()} save: ${detail} + ${mod} = ${total}`,
    success ? 'outcome: success → 1 HP' : 'outcome: failure → 0 HP',
  ]

  const hookEvent: Omit<CombatLogEvent, 'id' | 'timestamp'> = {
    type: 'hook-triggered',
    actorId: combatant.instanceId,
    targetIds: [combatant.instanceId],
    round,
    turn,
    summary: `${displayNameForCombatant(combatant, options)} hook fires: ${trait.name}.`,
    details: `${ability.toUpperCase()} save ${success ? 'succeeds' : 'fails'} (DC ${dc}).`,
    debugDetails,
  }

  if (success) {
    return {
      newHp: 1,
      defeatOutcome: undefined,
      logEvents: [
        hookEvent,
        {
          type: 'note',
          actorId: combatant.instanceId,
          targetIds: [combatant.instanceId],
          round,
          turn,
          summary: `${displayNameForCombatant(combatant, options)} drops to 1 hit point instead (Undead Fortitude).`,
        },
      ],
    }
  }

  return {
    newHp: 0,
    defeatOutcome: { participation: 'defeated', death: defaultDeath },
    logEvents: [hookEvent],
  }
}
