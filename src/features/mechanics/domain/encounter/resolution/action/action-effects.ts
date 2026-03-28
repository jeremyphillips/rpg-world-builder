import {
  addConditionToCombatant,
  addDamageResistanceMarker,
  addRollModifierToCombatant,
  addStateToCombatant,
  addStatModifierToCombatant,
  applyDamageToCombatant,
  applyHealingToCombatant,
  appendEncounterNote,
  autoFailsSave,
  effectDurationToRuntimeDuration,
  getCombatantDisplayLabel,
  getEncounterCombatantLabel,
  getSaveModifiersFromConditions,
  removeStatesByClassification,
  updateEncounterCombatant,
  mergeCombatantsIntoEncounter,
  removeCombatantFromInitiativeOrder,
  type CombatantInstance,
} from '../../state'
import type { EffectDuration } from '../../../effects/timing.types'
import type { ConditionImmunityGrantEffect } from '../../../effects/effects.types'
import { getAbilityModifier } from '../../../abilities/getAbilityModifier'
import { abilityIdToKey, type AbilityRef } from '../../../character'
import type { Condition } from '../../../conditions/condition.types'
import { evaluateCondition } from '../../../conditions/evaluateCondition'
import type { Effect } from '../../../effects/effects.types'
import type { CombatActionDefinition } from '../combat-action.types'
import type { Monster } from '@/features/content/monsters/domain/types'
import { describeResolvedSpawn, resolveSpawnMonsterIds } from './spawn-resolution'
import type { CombatantRemainsKind } from '../../state/types/combatant.types'
import type { EncounterState } from '../../state/types'
import {
  resolveD20RollMode,
  rollD20WithRollMode,
  rollDamage,
  rollHealing,
} from '../../../resolution/engines/dice.engine'
import { inferStatModifierEligibilityFromEffect } from '../../state/equipment-eligibility'
import { combatantToCreatureSnapshot } from '../../state/combatant-evaluation-snapshot'
import { isImmuneToConditionIncludingScopedGrants } from '../../state/condition-immunity-resolution'
import { hasIntactRemainsForRevival } from '../../state/combatant-participation'
import {
  applyGridSpawnReplacementFromTarget,
  pickNearestOpenCellIds,
  placeCombatant,
} from '@/features/encounter/space'
import { effectiveSpawnPlacement } from './action-requirement-model'

function reviveBlockedReason(
  target: CombatantInstance,
  state: EncounterState,
  action: CombatActionDefinition,
): string | null {
  if (!hasIntactRemainsForRevival(target)) {
    return 'No intact body remains.'
  }
  const meta = action.displayMeta
  if (meta?.source === 'spell' && meta.spellId === 'revivify' && target.diedAtRound != null) {
    if (state.roundNumber > target.diedAtRound + 10) {
      return 'Target has been dead too long for Revivify (more than 1 minute).'
    }
  }
  return null
}

function damageRemainsOnKill(action: CombatActionDefinition): CombatantRemainsKind | undefined {
  if (action.displayMeta?.source === 'spell' && action.displayMeta.spellId === 'disintegrate') {
    return 'disintegrated'
  }
  return undefined
}

function modifierEffectAppliesToTarget(
  effect: Effect,
  actor: CombatantInstance,
  target: CombatantInstance,
): boolean {
  const cond = 'condition' in effect ? (effect as { condition?: Condition }).condition : undefined
  if (!cond) return true
  return evaluateCondition(cond, {
    self: combatantToCreatureSnapshot(target),
    source: combatantToCreatureSnapshot(actor),
  })
}

export function getSaveModifier(combatant: CombatantInstance, ability: AbilityRef): number {
  const abilityKey = abilityIdToKey(ability)
  return (
    combatant.stats.savingThrowModifiers?.[abilityKey] ??
    getAbilityModifier(combatant.stats.abilityScores?.[abilityKey] ?? 10)
  )
}

function resolveRepeatSaveDc(action: CombatActionDefinition): number | null {
  if (action.saveProfile?.dc != null) return action.saveProfile.dc
  const saveEffect = action.effects?.find((e) => e.kind === 'save' && typeof e.save.dc === 'number')
  if (saveEffect && saveEffect.kind === 'save' && typeof saveEffect.save.dc === 'number') {
    return saveEffect.save.dc
  }
  return null
}

export function getImmunityStateLabel(actionLabel: string): string {
  return `immune to ${actionLabel}`
}

export function formatMovementSummary(effect: {
  upToSpeed?: boolean
  upToSpeedFraction?: 0.5 | 1
  noOpportunityAttacks?: boolean
  canEnterCreatureSpaces?: boolean
  targetSizeMax?: string
  straightTowardVisibleEnemy?: boolean
  forced?: boolean
  toNearestUnoccupiedSpace?: boolean
  withinFeetOfSource?: number
  failIfNoSpace?: boolean
  movesWithSource?: boolean
}): string {
  const parts: string[] = []

  if (effect.upToSpeed) {
    parts.push('move up to its Speed')
  } else if (effect.upToSpeedFraction != null) {
    parts.push(`move up to ${effect.upToSpeedFraction * 100}% of its Speed`)
  }

  if (effect.noOpportunityAttacks) {
    parts.push('without provoking opportunity attacks')
  }

  if (effect.canEnterCreatureSpaces) {
    const sizeLimit = effect.targetSizeMax ? `${effect.targetSizeMax} or smaller` : 'eligible'
    parts.push(`may enter ${sizeLimit} creature spaces`)
  }

  if (effect.straightTowardVisibleEnemy) {
    parts.push('must move straight toward a visible enemy')
  }

  if (effect.movesWithSource) {
    parts.push('target moves with the source')
  }

  if (effect.forced) {
    parts.push('forced movement')
  }

  if (effect.withinFeetOfSource != null) {
    parts.push(`ends within ${effect.withinFeetOfSource} feet of the source`)
  }

  if (effect.toNearestUnoccupiedSpace) {
    parts.push('moves to the nearest unoccupied space')
  }

  if (effect.failIfNoSpace) {
    parts.push('fails if no space is available')
  }

  return parts.length > 0 ? `${parts.join('; ')}.` : 'Movement effect noted.'
}

function formatNestedEffectSummary(effect: Effect): string | null {
  if (effect.kind === 'condition') {
    return `Condition: ${effect.conditionId}.`
  }

  if (effect.kind === 'damage') {
    return `Damage: ${effect.damage}${effect.damageType ? ` ${effect.damageType}` : ''}.`
  }

  if (effect.kind === 'note') {
    return effect.text
  }

  if (effect.kind === 'move') {
    return formatMovementSummary(effect)
  }

  return null
}

export type ApplyEffectsResult = {
  state: EncounterState
  createdMarkerIds: string[]
}

export type ApplyActionEffectsOptions = {
  rng: () => number
  sourceLabel: string
  /** When set, `spawn` effects can resolve monster names and random pools. */
  monstersById?: Record<string, Monster>
  /** When set with resolvable spawn ids, creates party combatants and merges initiative. */
  buildSummonAllyCombatant?: (args: { monster: Monster; runtimeId: string }) => CombatantInstance
  /** Enum selections from the encounter UI (e.g. conjure tier, animate form). */
  casterOptions?: Record<string, string>
  /** When set with `single-cell` spawn placement, places summoned combatants on this grid cell. */
  singleCellPlacementCellId?: string
}

/** Spell duration as turn-count fixed duration for `activeEffects` (from `concentrationDurationTurns`). */
function spellTurnDurationFromAction(action: CombatActionDefinition): EffectDuration | undefined {
  const meta = action.displayMeta
  if (meta?.source !== 'spell') return undefined
  const turns = meta.concentrationDurationTurns
  if (turns == null || turns <= 0) return undefined
  return { kind: 'fixed', value: turns, unit: 'turn' }
}

export function applyActionEffects(
  state: EncounterState,
  actor: CombatantInstance,
  target: CombatantInstance,
  action: CombatActionDefinition,
  effects: Effect[] | undefined,
  options: ApplyActionEffectsOptions,
): ApplyEffectsResult {
  if (!effects || effects.length === 0) return { state, createdMarkerIds: [] }

  let nextState = state
  const markerIds: string[] = []

  effects.forEach((effect) => {
    if (effect.kind === 'save') {
      if (typeof effect.save.dc !== 'number') {
        nextState = appendEncounterNote(nextState, `${options.sourceLabel}: Unsupported save DC rule.`, {
          actorId: actor.instanceId,
          targetIds: [target.instanceId],
        })
        return
      }

      const ability = effect.save.ability
      let succeeded: boolean
      let saveDetail: string

      if (autoFailsSave(target, ability)) {
        succeeded = false
        saveDetail = `Auto-fail ${ability.toUpperCase()} save (condition).`
      } else if (
        effect.autoSuccessIfImmuneTo &&
        isImmuneToConditionIncludingScopedGrants(target, effect.autoSuccessIfImmuneTo, actor)
      ) {
        succeeded = true
        saveDetail = `Auto-success (immune to ${effect.autoSuccessIfImmuneTo}).`
      } else {
        const saveRollMod = resolveD20RollMode(getSaveModifiersFromConditions(target, ability))
        const { rawRoll, detail } = rollD20WithRollMode(saveRollMod, options.rng)
        const saveModifier = getSaveModifier(target, ability)
        const totalRoll = rawRoll + saveModifier
        succeeded = totalRoll >= effect.save.dc
        saveDetail = `Saving throw: ${detail} + ${saveModifier} = ${totalRoll} vs DC ${effect.save.dc}.`
      }

      nextState = appendEncounterNote(
        nextState,
        `${options.sourceLabel}: ${getEncounterCombatantLabel(nextState, target.instanceId)} ${succeeded ? 'succeeds' : 'fails'} the ${ability.toUpperCase()} save.`,
        {
          actorId: actor.instanceId,
          targetIds: [target.instanceId],
          details: saveDetail,
        },
      )

      const nested = applyActionEffects(
        nextState,
        actor,
        target,
        action,
        succeeded ? effect.onSuccess : effect.onFail,
        options,
      )
      nextState = nested.state
      markerIds.push(...nested.createdMarkerIds)
      return
    }

    if (effect.kind === 'damage') {
      const rolledDamage = rollDamage(String(effect.damage), options.rng)
      if (rolledDamage && rolledDamage.total > 0) {
        nextState = applyDamageToCombatant(nextState, target.instanceId, rolledDamage.total, {
          actorId: actor.instanceId,
          sourceLabel: options.sourceLabel,
          damageType: effect.damageType,
          remainsOnKill: damageRemainsOnKill(action),
          rng: options.rng,
          monstersById: options.monstersById,
        })
      }
      return
    }

    if (effect.kind === 'hit-points') {
      const resolved = rollHealing(String(effect.value), options.rng)
      if (resolved && resolved.total > 0) {
        if (effect.mode === 'heal') {
          const healTarget = nextState.combatantsById[target.instanceId] ?? target
          if (healTarget.stats.currentHitPoints <= 0) {
            const block = reviveBlockedReason(healTarget, nextState, action)
            if (block) {
              nextState = appendEncounterNote(nextState, `${options.sourceLabel}: ${block}`, {
                actorId: actor.instanceId,
                targetIds: [target.instanceId],
              })
              return
            }
          }
          nextState = applyHealingToCombatant(nextState, target.instanceId, resolved.total, {
            actorId: actor.instanceId,
            sourceLabel: options.sourceLabel,
          })
        } else {
          nextState = applyDamageToCombatant(nextState, target.instanceId, resolved.total, {
            actorId: actor.instanceId,
            sourceLabel: options.sourceLabel,
            remainsOnKill: damageRemainsOnKill(action),
          })
        }
      }
      return
    }

    if (effect.kind === 'condition') {
      nextState = addConditionToCombatant(nextState, target.instanceId, effect.conditionId, {
        sourceLabel: options.sourceLabel,
        sourceInstanceId: actor.instanceId,
        classification: effect.classification,
      })
      markerIds.push(effect.conditionId)
      if (effect.repeatSave) {
        const dc = resolveRepeatSaveDc(action)
        if (dc != null) {
          const hookId = `repeat-save-${effect.conditionId}-${action.id}-${target.instanceId}`
          nextState = updateEncounterCombatant(nextState, target.instanceId, (combatant) => ({
            ...combatant,
            turnHooks: [
              ...combatant.turnHooks,
              {
                id: hookId,
                label: `${options.sourceLabel}: repeat save (${effect.conditionId})`,
                boundary: effect.repeatSave!.timing === 'turn-start' ? 'start' as const : 'end' as const,
                effects: [],
                repeatSave: {
                  ability: effect.repeatSave!.ability,
                  dc,
                  removeCondition: effect.conditionId,
                  singleAttempt: effect.repeatSave!.singleAttempt,
                  onFail: effect.repeatSave!.onFail,
                  autoSuccessIfImmuneTo: effect.repeatSave!.autoSuccessIfImmuneTo,
                  casterInstanceId: actor.instanceId,
                  outcomeTrack: effect.repeatSave!.outcomeTrack,
                },
              },
            ],
          }))
          markerIds.push(hookId)
        }
      }
      return
    }

    if (effect.kind === 'state') {
      nextState = addStateToCombatant(nextState, target.instanceId, effect.stateId, {
        sourceLabel: options.sourceLabel,
        classification: effect.classification,
      })
      markerIds.push(effect.stateId)

      if (effect.repeatSave) {
        const dc = resolveRepeatSaveDc(action)
        if (dc != null) {
          const hookId = `repeat-save-${effect.stateId}-${action.id}-${target.instanceId}`
          nextState = updateEncounterCombatant(nextState, target.instanceId, (combatant) => ({
            ...combatant,
            turnHooks: [
              ...combatant.turnHooks,
              {
                id: hookId,
                label: `${options.sourceLabel}: repeat save (${effect.stateId})`,
                boundary: effect.repeatSave!.timing === 'turn-start' ? 'start' as const : 'end' as const,
                effects: [],
                repeatSave: {
                  ability: effect.repeatSave!.ability,
                  dc,
                  removeState: effect.stateId,
                  singleAttempt: effect.repeatSave!.singleAttempt,
                  onFail: effect.repeatSave!.onFail,
                  autoSuccessIfImmuneTo: effect.repeatSave!.autoSuccessIfImmuneTo,
                  casterInstanceId: actor.instanceId,
                  outcomeTrack: effect.repeatSave!.outcomeTrack,
                },
              },
            ],
          }))
          markerIds.push(hookId)
        }
      }

      if (effect.escape) {
        nextState = appendEncounterNote(
          nextState,
          `${options.sourceLabel}: Escape DC ${effect.escape.dc} ${effect.escape.ability?.toUpperCase() ?? ''}${effect.escape.skill ? ` (${effect.escape.skill})` : ''}${effect.escape.actionRequired ? ' as an action' : ''}.`
            .replace(/\s+/g, ' ')
            .trim(),
          {
            actorId: actor.instanceId,
            targetIds: [target.instanceId],
          },
        )
      }

      if (effect.notes) {
        nextState = appendEncounterNote(nextState, `${options.sourceLabel}: ${effect.notes}`, {
          actorId: actor.instanceId,
          targetIds: [target.instanceId],
        })
      }

      if (effect.ongoingEffects && effect.ongoingEffects.length > 0) {
        const hookId = `ongoing-${effect.stateId}-${action.id}-${target.instanceId}`
        nextState = updateEncounterCombatant(nextState, target.instanceId, (combatant) => ({
          ...combatant,
          turnHooks: [
            ...combatant.turnHooks,
            {
              id: hookId,
              label: `${options.sourceLabel}: ${effect.stateId} (ongoing)`,
              boundary: 'start' as const,
              effects: effect.ongoingEffects!,
            },
          ],
        }))
        markerIds.push(hookId)
        const ongoingSummary = effect.ongoingEffects
          .map((nestedEffect) => formatNestedEffectSummary(nestedEffect))
          .filter((summary): summary is string => Boolean(summary))
          .join(' ')
        if (ongoingSummary) {
          nextState = appendEncounterNote(nextState, `${options.sourceLabel}: Ongoing — ${ongoingSummary}`, {
            actorId: actor.instanceId,
            targetIds: [target.instanceId],
          })
        }
      }
      return
    }

    if (effect.kind === 'modifier' && effect.target === 'resistance' && typeof effect.value === 'string') {
      const runtimeDuration = effectDurationToRuntimeDuration(effect) ?? undefined
      const markerId = `dmg-res-${effect.value}-${action.id}-${target.instanceId}`
      nextState = addDamageResistanceMarker(
        nextState,
        target.instanceId,
        {
          id: markerId,
          damageType: effect.value,
          level: effect.mode === 'add' ? 'resistance' : 'resistance',
          sourceId: action.id,
          label: `resistance to ${effect.value}`,
          duration: runtimeDuration,
        },
        { sourceLabel: options.sourceLabel },
      )
      markerIds.push(markerId)
      return
    }

    if (effect.kind === 'modifier' && typeof effect.value === 'number' && (effect.mode === 'add' || effect.mode === 'set')) {
      if (!modifierEffectAppliesToTarget(effect, actor, target)) {
        nextState = appendEncounterNote(
          nextState,
          `${options.sourceLabel}: Modifier not applied (spell conditions not met for ${getEncounterCombatantLabel(nextState, target.instanceId)}).`,
          {
            actorId: actor.instanceId,
            targetIds: [target.instanceId],
          },
        )
        return
      }
      const runtimeDuration = effectDurationToRuntimeDuration(effect) ?? undefined
      const sign = effect.mode === 'add' && effect.value > 0 ? '+' : ''
      const modeLabel = effect.mode === 'set' ? `set ${effect.target} ${effect.value}` : `${sign}${effect.value} ${effect.target}`
      const markerId = `stat-mod-${effect.target}-${action.id}-${target.instanceId}`
      const eligibility = inferStatModifierEligibilityFromEffect(effect)
      const armorClassBeforeApply =
        effect.target === 'armor_class' &&
        effect.mode === 'set' &&
        eligibility?.requiresUnarmored === true
          ? target.stats.armorClass
          : undefined
      nextState = addStatModifierToCombatant(
        nextState,
        target.instanceId,
        {
          id: markerId,
          label: modeLabel,
          target: effect.target,
          mode: effect.mode,
          value: effect.value,
          duration: runtimeDuration,
          ...(eligibility ? { eligibility } : {}),
          ...(armorClassBeforeApply != null ? { armorClassBeforeApply } : {}),
        },
        { sourceLabel: options.sourceLabel },
      )
      markerIds.push(markerId)
      return
    }

    if (effect.kind === 'roll-modifier') {
      const runtimeDuration = effectDurationToRuntimeDuration(effect) ?? undefined
      const markerId = `roll-mod-${action.id}-${target.instanceId}`
      const cond = 'condition' in effect ? effect.condition : undefined
      nextState = addRollModifierToCombatant(
        nextState,
        target.instanceId,
        {
          id: markerId,
          label: `${effect.modifier} on ${Array.isArray(effect.appliesTo) ? effect.appliesTo.join(', ') : effect.appliesTo}`,
          appliesTo: effect.appliesTo,
          modifier: effect.modifier,
          duration: runtimeDuration,
          sourceInstanceId: actor.instanceId,
          ...(cond ? { condition: cond } : {}),
        },
        { sourceLabel: options.sourceLabel },
      )
      markerIds.push(markerId)
      return
    }

    if (effect.kind === 'immunity' && effect.scope === 'spell') {
      const runtimeDuration = effectDurationToRuntimeDuration(effect) ?? undefined
      const stateLabel = `Immune: ${effect.spellIds.join(', ')}`
      nextState = addStateToCombatant(nextState, target.instanceId, stateLabel, {
        duration: runtimeDuration,
        sourceLabel: options.sourceLabel,
      })
      markerIds.push(stateLabel)
      return
    }

    if (effect.kind === 'immunity' && effect.scope === 'source-action') {
      const stateLabel = getImmunityStateLabel(action.label)
      nextState = addStateToCombatant(nextState, target.instanceId, stateLabel, {
        sourceLabel: options.sourceLabel,
      })
      markerIds.push(stateLabel)
      return
    }

    // Death-outcome: does not deal damage or kill by itself; runs after lethal damage when
    // the target is already defeated (HP ≤ 0). Refines remains (e.g. turns-to-dust) while
    // leaving defeat + death metadata intact.
    if (effect.kind === 'death-outcome') {
      if (target.stats.currentHitPoints <= 0) {
        if (effect.outcome === 'turns-to-dust') {
          nextState = updateEncounterCombatant(nextState, target.instanceId, (c) => ({
            ...c,
            remains: 'dust',
            diedAtRound: c.diedAtRound ?? nextState.roundNumber,
          }))
        }
        nextState = appendEncounterNote(nextState, `${options.sourceLabel}: ${getEncounterCombatantLabel(nextState, target.instanceId)} ${effect.outcome.replaceAll('-', ' ')}.`, {
          actorId: actor.instanceId,
          targetIds: [target.instanceId],
        })
      }
      return
    }

    if (effect.kind === 'interval') {
      if (effect.every.unit !== 'turn') {
        nextState = appendEncounterNote(
          nextState,
          `${options.sourceLabel}: Interval effect ${effect.stateId} deferred — ${effect.every.value} ${effect.every.unit} cadence not tracked in encounter time.`,
          { actorId: actor.instanceId, targetIds: [target.instanceId] },
        )
        return
      }
      const boundary = 'start' as const
      const hookId = `interval-${effect.stateId}-${action.id}-${target.instanceId}`
      nextState = updateEncounterCombatant(nextState, target.instanceId, (combatant) => ({
        ...combatant,
        turnHooks: [
          ...combatant.turnHooks,
          {
            id: hookId,
            label: `${options.sourceLabel}: ${effect.stateId}`,
            boundary,
            effects: effect.effects,
          },
        ],
      }))
      markerIds.push(hookId)
      nextState = appendEncounterNote(nextState, `${options.sourceLabel}: Interval effect ${effect.stateId} registered (${boundary} of turn).`, {
        actorId: actor.instanceId,
        targetIds: [target.instanceId],
      })
      return
    }

    if (effect.kind === 'move') {
      nextState = appendEncounterNote(nextState, `${options.sourceLabel}: ${formatMovementSummary(effect)}`, {
        actorId: actor.instanceId,
        targetIds: [target.instanceId],
      })
      return
    }

    if (effect.kind === 'note') {
      nextState = appendEncounterNote(nextState, `${options.sourceLabel}: ${effect.text}`, {
        actorId: actor.instanceId,
        targetIds: [target.instanceId],
      })
      return
    }

    if (effect.kind === 'trigger') {
      nextState = appendEncounterNote(nextState, `${options.sourceLabel}: Trigger effect (${effect.trigger}) noted. Reactive effects require manual adjudication.`, {
        actorId: actor.instanceId,
        targetIds: [target.instanceId],
      })
      return
    }

    if (effect.kind === 'activation') {
      nextState = appendEncounterNote(nextState, `${options.sourceLabel}: Activation effect (${effect.activation}) noted for future use.`, {
        actorId: actor.instanceId,
        targetIds: [target.instanceId],
      })
      return
    }

    if (effect.kind === 'check') {
      nextState = appendEncounterNote(nextState, `${options.sourceLabel}: Check DC ${effect.check.dc} ${effect.check.ability.toUpperCase()}${effect.check.skill ? ` (${effect.check.skill})` : ''} required.`, {
        actorId: actor.instanceId,
        targetIds: [target.instanceId],
      })
      return
    }

    if (effect.kind === 'grant') {
      if (effect.grantType === 'proficiency') {
        nextState = appendEncounterNote(nextState, `${options.sourceLabel}: Grants ${effect.grantType}.`, {
          actorId: actor.instanceId,
          targetIds: [target.instanceId],
        })
        return
      }

      if (effect.grantType === 'condition-immunity') {
        const duration = effect.duration ?? spellTurnDurationFromAction(action)
        const meta = action.displayMeta
        const isConcentrationSpell = meta?.source === 'spell' && meta.concentration === true
        const concentrationLinkId = isConcentrationSpell
          ? `grant-ci-${action.id}-${target.instanceId}-${effect.value}`
          : undefined
        const grantPayload: ConditionImmunityGrantEffect = {
          ...effect,
          ...(duration ? { duration } : {}),
          source: effect.source ?? options.sourceLabel,
          ...(concentrationLinkId ? { concentrationLinkId } : {}),
        }
        nextState = updateEncounterCombatant(nextState, target.instanceId, (c) => ({
          ...c,
          activeEffects: [...c.activeEffects, grantPayload],
        }))
        if (concentrationLinkId) {
          markerIds.push(concentrationLinkId)
        }
        nextState = appendEncounterNote(nextState, `${options.sourceLabel}: Grants immunity (${effect.value}) on target — tracked for encounter UI.`, {
          actorId: actor.instanceId,
          targetIds: [target.instanceId],
        })
        return
      }

      const _exhaustiveGrant: never = effect
      return _exhaustiveGrant
    }

    if (effect.kind === 'form') {
      nextState = appendEncounterNote(nextState, `${options.sourceLabel}: Form change to ${effect.form}${effect.notes ? ` — ${effect.notes}` : ''}.`, {
        actorId: actor.instanceId,
        targetIds: [target.instanceId],
      })
      return
    }

    if (effect.kind === 'spawn') {
      const spawnTarget = nextState.combatantsById[target.instanceId] ?? target
      const ids = resolveSpawnMonsterIds(
        effect,
        options.monstersById,
        options.rng,
        options.casterOptions,
        spawnTarget,
      )
      const factory = options.buildSummonAllyCombatant
      if (ids.length > 0 && factory && options.monstersById) {
        const built: CombatantInstance[] = []
        for (let i = 0; i < ids.length; i++) {
          const mid = ids[i]!
          const monster = options.monstersById[mid]
          if (!monster) continue
          const runtimeId = `${actor.instanceId}-spawn-${mid}-${i}-${Math.floor(options.rng() * 1e9)}`
          built.push(factory({ monster, runtimeId }))
        }
        if (built.length > 0) {
          nextState = mergeCombatantsIntoEncounter(nextState, built, {
            rng: options.rng,
            initiativeMode: effect.initiativeMode,
            casterInstanceId: actor.instanceId,
            monstersById: options.monstersById,
          })
          if (effect.mapMonsterIdFromTargetRemains || effect.inheritGridCellFromTarget) {
            nextState = applyGridSpawnReplacementFromTarget(
              nextState,
              spawnTarget.instanceId,
              built.map((c) => c.instanceId),
            )
            const firstSpawnId = built[0]?.instanceId
            nextState = updateEncounterCombatant(nextState, spawnTarget.instanceId, (c) => ({
              ...c,
              remainsConsumed: {
                atRound: nextState.roundNumber,
                ...(firstSpawnId ? { spawnInstanceId: firstSpawnId } : {}),
              },
            }))
            nextState = removeCombatantFromInitiativeOrder(nextState, spawnTarget.instanceId)
          } else if (
            effectiveSpawnPlacement(effect).kind === 'single-cell' &&
            options.singleCellPlacementCellId
          ) {
            const anchor = options.singleCellPlacementCellId
            const spawnedIds = built.map((c) => c.instanceId)
            const [first, ...rest] = spawnedIds
            if (first) {
              let ns = placeCombatant(nextState, first, anchor)
              if (rest.length > 0 && ns.space && ns.placements) {
                const extraCells = pickNearestOpenCellIds(ns.space, ns.placements, anchor, rest.length)
                for (let i = 0; i < rest.length; i++) {
                  const cellId = extraCells[i]
                  const sid = rest[i]!
                  if (cellId) ns = placeCombatant(ns, sid, cellId)
                }
              }
              nextState = ns
            }
          }
          const roster = Object.values(nextState.combatantsById)
          const names = built.map((c) => getCombatantDisplayLabel(c, roster)).join(', ')
          nextState = appendEncounterNote(nextState, `${options.sourceLabel}: Summoned ${names} — joined initiative (party).`, {
            actorId: actor.instanceId,
            targetIds: [target.instanceId],
          })
          return
        }
      }

      const detail = describeResolvedSpawn(
        effect,
        options.monstersById,
        options.rng,
        options.casterOptions,
        spawnTarget,
      )
      nextState = appendEncounterNote(nextState, `${options.sourceLabel}: ${detail}`, {
        actorId: actor.instanceId,
        targetIds: [target.instanceId],
      })
      return
    }

    if (effect.kind === 'remove-classification') {
      nextState = removeStatesByClassification(nextState, target.instanceId, effect.classification, {
        sourceLabel: options.sourceLabel,
      })
      return
    }

    if (effect.kind === 'targeting') {
      return
    }

    if (effect.kind === 'regeneration') {
      nextState = appendEncounterNote(
        nextState,
        `${options.sourceLabel}: Regeneration effect noted — runtime adapter handles turn hook seeding.`,
        { actorId: actor.instanceId, targetIds: [target.instanceId] },
      )
      return
    }

    nextState = appendEncounterNote(nextState, `${options.sourceLabel}: Unsupported effect ${effect.kind}.`, {
      actorId: actor.instanceId,
      targetIds: [target.instanceId],
    })
  })

  return { state: nextState, createdMarkerIds: markerIds }
}
