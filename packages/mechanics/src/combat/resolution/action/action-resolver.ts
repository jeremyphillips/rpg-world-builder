import {
  stealthHiddenSnapshot,
  isStealthRuntimeTraceEnabled,
  stealthTraceLog,
} from '../../state/stealth/stealth-runtime-trace'
import {
  applyDamageToCombatant,
  appendEncounterLogEvent,
  appendEncounterNote,
  getEncounterCombatantLabel,
  setConcentration,
  updateEncounterCombatant,
  getIncomingAttackModifiersForAttack,
  getOutgoingAttackModifiersForAttack,
  autoFailsSave,
  getSaveModifiersFromConditions,
  type CombatantInstance,
  type RollModifierMarker,
  addAttachedAuraInstance,
  getAttackVisibilityRollModifiersFromPair,
  resolveCombatantPairVisibilityForAttackRoll,
  applyNoiseAwarenessForSubject,
  breakStealthOnAttack,
  getStealthCheckModifier,
  reconcileStealthHiddenForPerceivedObservers,
  resolveDefaultHideObservers,
  resolveHideWithPassivePerception,
  appendStealthBrokenOnAttackNote,
} from '../../state'
import type { EncounterViewerPerceptionCapabilities } from '@/features/mechanics/domain/perception/perception.types'
import {
  attachedAuraInstanceId,
  concentrationLinkedMarkerIdForSpellAttachedEmanation,
} from '../../state/auras/attached-battlefield-source'
import {
  formatAttackRollDebug,
  formatAutoFailDebug,
  formatSaveDebug,
  formatTurnResourceDebug,
} from './resolution-debug'
import type { CombatActionDefinition } from '../combat-action.types'
import type { EncounterState } from '../../state/types'
import type { ResolveCombatActionSelection, ResolveCombatActionOptions } from '../action-resolution.types'
import { resolveAttachedEmanationAnchorModeFromSelection } from './area-grid-action'
import { findGridObjectById } from '@/features/mechanics/domain/combat/space/space.helpers'
import { formatCasterOptionSummary } from '../../../spells/caster-options'
import {
  rollDamage,
  resolveD20RollMode,
  rollD20WithRollMode,
  type D20RollMode,
} from '../../../resolution/engines/dice.engine'
import {
  spendActionCost,
  getCombatantTurnResources,
  canSpendActionCost,
  canUseCombatAction,
  spendCombatActionUsage,
} from './action-cost'
import { evaluateCondition } from '../../../conditions/evaluateCondition'
import { combatantToCreatureSnapshot } from '../../state/combatants/combatant-evaluation-snapshot'
import { getActionTargets, getSequenceStepCount, type ActionTargetingResolveOptions } from './action-targeting'
import { applyActionEffects, formatMovementSummary, getImmunityStateLabel, getSaveModifier } from './action-effects'

export type { ResolveCombatActionSelection, ResolveCombatActionOptions } from '../action-resolution.types'

type RollModifierResult = {
  rollMod: D20RollMode
  attackerMarkers: RollModifierMarker[]
  defenderMarkers: RollModifierMarker[]
  /** Present when `encounterState` was passed; drives unseen-target / unseen-attacker from occupant perception. */
  pairVisibility?: {
    attackerCanSeeDefenderOccupant: boolean
    defenderCanSeeAttackerOccupant: boolean
  }
}

/** Canonical tokens for `RollModifierMarker.appliesTo` (hyphenated). */
const ROLL_CONTEXT_ATTACK_ROLLS = 'attack-rolls'
const ROLL_CONTEXT_INCOMING_ATTACKS = 'incoming-attacks'

function normalizeRollAppliesToken(t: string): string {
  return t.trim().toLowerCase().replace(/\s+/g, '-')
}

function rollModifierConditionApplies(
  marker: RollModifierMarker,
  holder: 'attacker' | 'defender',
  attacker: CombatantInstance,
  defender: CombatantInstance,
): boolean {
  if (!marker.condition) return true
  if (holder === 'attacker') {
    return evaluateCondition(marker.condition, {
      self: combatantToCreatureSnapshot(attacker),
      source: combatantToCreatureSnapshot(defender),
    })
  }
  return evaluateCondition(marker.condition, {
    self: combatantToCreatureSnapshot(defender),
    source: combatantToCreatureSnapshot(attacker),
  })
}

/** Exported for tests — combines spell `RollModifierMarker`s with condition-based attack mods and optional pair visibility. */
export function resolveRollModifier(
  attacker: CombatantInstance,
  defender: CombatantInstance,
  attackRange: 'melee' | 'ranged' = 'melee',
  encounterState?: EncounterState,
  visibilityOptions?: { capabilities?: EncounterViewerPerceptionCapabilities },
): RollModifierResult {
  const rawAttacker = (attacker.rollModifiers ?? []).filter((m) =>
    matchesRollContext(m, ROLL_CONTEXT_ATTACK_ROLLS),
  )
  const rawDefender = (defender.rollModifiers ?? []).filter((m) =>
    matchesRollContext(m, ROLL_CONTEXT_INCOMING_ATTACKS),
  )

  const attackerMarkers = rawAttacker.filter((m) =>
    rollModifierConditionApplies(m, 'attacker', attacker, defender),
  )
  const defenderMarkers = rawDefender.filter((m) =>
    rollModifierConditionApplies(m, 'defender', attacker, defender),
  )

  const markerModifiers = [...attackerMarkers, ...defenderMarkers].map((m) => m.modifier)

  const conditionModifiers = [
    ...getOutgoingAttackModifiersForAttack(attacker, defender, attackRange),
    ...getIncomingAttackModifiersForAttack(attacker, defender, attackRange),
  ]

  const pairVisibility =
    encounterState != null
      ? resolveCombatantPairVisibilityForAttackRoll(
          encounterState,
          attacker.instanceId,
          defender.instanceId,
          visibilityOptions,
        )
      : undefined

  const visibilityModifiers =
    pairVisibility != null ? getAttackVisibilityRollModifiersFromPair(pairVisibility) : []

  const rollMod = resolveD20RollMode([...markerModifiers, ...conditionModifiers, ...visibilityModifiers])

  return { rollMod, attackerMarkers, defenderMarkers, pairVisibility }
}

function matchesRollContext(marker: RollModifierMarker, context: string): boolean {
  const targets = Array.isArray(marker.appliesTo) ? marker.appliesTo : [marker.appliesTo]
  const ctx = normalizeRollAppliesToken(context)
  return targets.some((t) => {
    const tt = normalizeRollAppliesToken(t)
    return tt === 'all' || tt === ctx
  })
}

function deriveAttackRange(action: CombatActionDefinition): 'melee' | 'ranged' {
  if (!action.displayMeta) return 'melee'
  if (action.displayMeta.source === 'natural') return 'melee'
  if (action.displayMeta.source === 'spell') {
    const range = action.displayMeta.range?.toLowerCase() ?? ''
    return range === 'touch' || range === 'self' ? 'melee' : 'ranged'
  }
  if (action.displayMeta.source === 'weapon') {
    const range = action.displayMeta.range?.toLowerCase() ?? ''
    return range.includes('ranged') ? 'ranged' : 'melee'
  }
  return 'melee'
}

function getActionLabel(action: CombatActionDefinition): string {
  return action.label || action.id
}

function getCombatantActions(combatant: CombatantInstance): CombatActionDefinition[] {
  return combatant.actions ?? []
}

export function getCombatantAvailableActions(
  state: EncounterState,
  actorId: string,
): CombatActionDefinition[] {
  const combatant = state.combatantsById[actorId]
  if (!combatant) return []

  const resources = getCombatantTurnResources(combatant)
  return getCombatantActions(combatant).filter(
    (action) => canSpendActionCost(resources, action.cost) && canUseCombatAction(action),
  )
}

function isConcentrationAction(action: CombatActionDefinition | undefined): boolean {
  return Boolean(
    action && action.displayMeta?.source === 'spell' && action.displayMeta.concentration === true,
  )
}

export function resolveCombatAction(
  state: EncounterState,
  selection: ResolveCombatActionSelection,
  options: ResolveCombatActionOptions = {},
): EncounterState {
  const actor = state.combatantsById[selection.actorId]
  const action = actor ? getCombatantActions(actor).find((a) => a.id === selection.actionId) : undefined

  const result = resolveCombatActionInternal(state, selection, options, { skipCost: false })
  let finalState = result.state

  const meta = action?.displayMeta as { source: 'spell'; spellId: string; concentrationDurationTurns?: number } | undefined
  const needsConcFromAttachedEmanation =
    Boolean(action?.attachedEmanation) && isConcentrationAction(action) && result.createdMarkerIds.length === 0
  const linkedForConc =
    result.createdMarkerIds.length > 0
      ? result.createdMarkerIds
      : needsConcFromAttachedEmanation && action?.attachedEmanation?.source.kind === 'spell'
        ? [concentrationLinkedMarkerIdForSpellAttachedEmanation(action.attachedEmanation.source.spellId)]
        : []

  if (action && isConcentrationAction(action) && linkedForConc.length > 0 && meta?.source === 'spell') {
    const durationTurns = meta.concentrationDurationTurns
    finalState = setConcentration(finalState, selection.actorId, {
      spellId: meta.spellId,
      spellLabel: action.label,
      linkedMarkerIds: linkedForConc,
      remainingTurns: durationTurns,
      totalTurns: durationTurns,
    })
  }

  return finalState
}

type InternalResolutionResult = {
  state: EncounterState
  createdMarkerIds: string[]
}

function resolveTargetingOptions(options: ResolveCombatActionOptions): ActionTargetingResolveOptions {
  return { suppressSameSideHostileActions: options.suppressSameSideHostileActions !== false }
}

function resolveCombatActionInternal(
  initialState: EncounterState,
  selection: ResolveCombatActionSelection,
  options: ResolveCombatActionOptions,
  behavior: { skipCost: boolean },
): InternalResolutionResult {
  const noOp: InternalResolutionResult = { state: initialState, createdMarkerIds: [] }
  let actor = initialState.combatantsById[selection.actorId]
  if (!actor || initialState.activeCombatantId !== selection.actorId) return noOp

  const action = getCombatantActions(actor).find((candidate) => candidate.id === selection.actionId)
  if (!action) return noOp

  const targetingOptions = resolveTargetingOptions(options)

  const resources = getCombatantTurnResources(actor)
  if (!behavior.skipCost && !canSpendActionCost(resources, action.cost)) {
    const resourceDebug = formatTurnResourceDebug(actor, action.cost)
    if (resourceDebug.length > 0) {
      return {
        state: appendEncounterNote(initialState, `${action.label || action.id} blocked: insufficient turn resources.`, {
          actorId: actor.instanceId,
          debugDetails: resourceDebug,
        }),
        createdMarkerIds: [],
      }
    }
    return noOp
  }
  if (!behavior.skipCost && !canUseCombatAction(action)) return noOp

  const state = reconcileStealthHiddenForPerceivedObservers(initialState, {
    perceptionCapabilities: options.perceptionCapabilities,
  })
  if (isStealthRuntimeTraceEnabled()) {
    const before = stealthHiddenSnapshot(initialState)
    const after = stealthHiddenSnapshot(state)
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      stealthTraceLog('reconcileStealthHiddenForPerceivedObservers (start of resolveCombatAction)', {
        actorId: selection.actorId,
        actionId: selection.actionId,
        before,
        after,
      })
    }
  }
  actor = state.combatantsById[selection.actorId]!

  const targets = getActionTargets(state, actor, selection, action, targetingOptions)
  const target = targets[0]
  if (action.resolutionMode === 'attack-roll') {
    if (!target) {
      return noOp
    }
  }

  const rng = options.rng ?? Math.random
  const actionLabel = getActionLabel(action)
  const applyEffectsOpts = {
    rng,
    sourceLabel: actionLabel,
    monstersById: options.monstersById,
    buildSummonAllyCombatant: options.buildSummonAllyCombatant,
    casterOptions: selection.casterOptions,
    singleCellPlacementCellId: selection.singleCellPlacementCellId,
    perceptionCapabilities: options.perceptionCapabilities,
  }
  const targetLabel = target ? getEncounterCombatantLabel(state, target.instanceId) : 'no target'
  const casterSummary = formatCasterOptionSummary(action.casterOptions, selection.casterOptions)
  const allMarkerIds: string[] = []

  let nextState = appendEncounterLogEvent(state, {
    type: 'action-declared',
    actorId: actor.instanceId,
    targetIds: target ? [target.instanceId] : undefined,
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getEncounterCombatantLabel(state, actor.instanceId)} uses ${actionLabel}${casterSummary}${target ? ` against ${targetLabel}` : ''}.`,
  })

  if (action.movement) {
    nextState = appendEncounterNote(
      nextState,
      `${actionLabel}: ${formatMovementSummary(action.movement)}${
        action.targeting?.kind === 'entered-during-move'
          ? ' Resolution uses the selected target as the creature crossed during movement.'
          : ''
      }`,
      {
        actorId: actor.instanceId,
        targetIds: target ? [target.instanceId] : undefined,
      },
    )
  }

  if (action.sequence && action.sequence.length > 0) {
    for (const step of action.sequence) {
      const iterationCount = getSequenceStepCount(nextState, actor.instanceId, step)
      const childAction = getCombatantActions(nextState.combatantsById[actor.instanceId] ?? actor).find(
        (candidate) => candidate.label === step.actionLabel,
      )
      if (!childAction) continue

      for (let index = 0; index < iterationCount; index += 1) {
        const childResult = resolveCombatActionInternal(
          nextState,
          {
            actorId: actor.instanceId,
            targetId: selection.targetId,
            actionId: childAction.id,
            casterOptions: selection.casterOptions,
            aoeOriginCellId: selection.aoeOriginCellId,
            singleCellPlacementCellId: selection.singleCellPlacementCellId,
          },
          options,
          { skipCost: true },
        )
        nextState = childResult.state
        allMarkerIds.push(...childResult.createdMarkerIds)
      }
    }

    nextState = appendEncounterLogEvent(nextState, {
      type: 'action-resolved',
      actorId: actor.instanceId,
      targetIds: target ? [target.instanceId] : undefined,
      round: state.roundNumber,
      turn: state.turnIndex + 1,
      summary: `${actionLabel} resolves its action sequence.`,
      details: action.logText,
    })

    if (!behavior.skipCost && action.kind === 'spell' && action.usage?.uses && action.displayMeta?.source === 'spell') {
      options.onSpellSlotSpent?.(actor.source.sourceId, action.displayMeta.spellId)
    }
    const finalState = behavior.skipCost
      ? nextState
      : updateEncounterCombatant(nextState, actor.instanceId, (combatant) => ({
          ...combatant,
          actions: getCombatantActions(combatant).map((candidate) =>
            candidate.id === action.id ? spendCombatActionUsage(candidate) : candidate,
          ),
          turnResources: spendActionCost(getCombatantTurnResources(combatant), action.cost),
        }))
    return { state: finalState, createdMarkerIds: allMarkerIds }
  }

  if (action.resolutionMode === 'hide') {
    const hidePerceptionOpts = { perceptionCapabilities: options.perceptionCapabilities }
    const hideCandidates = resolveDefaultHideObservers(nextState, actor.instanceId, hidePerceptionOpts)
    if (hideCandidates.length === 0) {
      nextState = appendEncounterLogEvent(nextState, {
        type: 'action-resolved',
        actorId: actor.instanceId,
        round: state.roundNumber,
        turn: state.turnIndex + 1,
        summary: `${getEncounterCombatantLabel(state, actor.instanceId)} attempts to hide but has no eligible observers (concealment / eligibility).`,
        details:
          'No Stealth roll — no opposing observer passed hide eligibility for this attempt (see getStealthHideAttemptDenialReason / sight-hide-rules).',
      })
    } else {
      const stealthMod = action.hideProfile?.stealthModifier ?? getStealthCheckModifier(actor)
      const { rawRoll, detail: stealthRollDetail } = rollD20WithRollMode(resolveD20RollMode([]), rng)
      const stealthTotal = rawRoll + stealthMod
      const hideResolved = resolveHideWithPassivePerception(nextState, actor.instanceId, stealthTotal, hidePerceptionOpts)
      nextState = hideResolved.state
      const { outcome } = hideResolved
      if (isStealthRuntimeTraceEnabled()) {
        stealthTraceLog('after resolveHideWithPassivePerception', {
          hiderId: actor.instanceId,
          outcome,
          stealthSnapshot: stealthHiddenSnapshot(nextState),
        })
      }
      let details = `Stealth: ${stealthRollDetail} + ${stealthMod} = ${stealthTotal}.`
      let summary: string
      if (outcome.kind === 'no-eligible-observers') {
        summary = `${getEncounterCombatantLabel(state, actor.instanceId)} attempts to hide but has no eligible observers (concealment / eligibility).`
      } else {
        const beatLabels = outcome.beatenObserverIds.map((id) => getEncounterCombatantLabel(nextState, id))
        const failLabels = outcome.failedObserverIds.map((id) => getEncounterCombatantLabel(nextState, id))
        details += ` Beat passive Perception: ${beatLabels.join(', ') || 'none'}. Did not beat: ${failLabels.join(', ') || 'none'}.`
        summary = `${getEncounterCombatantLabel(state, actor.instanceId)} attempts to hide (Stealth ${stealthTotal}).`
      }
      nextState = appendEncounterLogEvent(nextState, {
        type: 'action-resolved',
        actorId: actor.instanceId,
        round: state.roundNumber,
        turn: state.turnIndex + 1,
        summary,
        details,
      })
    }
  } else if (action.resolutionMode === 'attack-roll') {
    const attackBonus = action.attackProfile?.attackBonus
    if (target == null || attackBonus == null) return { state: nextState, createdMarkerIds: [] }

    const attackRange = deriveAttackRange(action)
    const { rollMod, attackerMarkers, defenderMarkers, pairVisibility } = resolveRollModifier(
      actor,
      target,
      attackRange,
      nextState,
    )
    const { rawRoll, detail: rollDetail } = rollD20WithRollMode(rollMod, rng)
    const totalRoll = rawRoll + attackBonus
    const isNaturalTwenty = rawRoll === 20
    const isNaturalOne = rawRoll === 1
    const hit = isNaturalTwenty || (!isNaturalOne && totalRoll >= target.stats.armorClass)
    const isCritical = isNaturalTwenty

    const hadStealthBeforeAttack = nextState.combatantsById[actor.instanceId]?.stealth != null
    nextState = breakStealthOnAttack(nextState, actor.instanceId)
    if (hadStealthBeforeAttack) {
      nextState = appendStealthBrokenOnAttackNote(nextState, actor.instanceId)
    }
    nextState = applyNoiseAwarenessForSubject(nextState, actor.instanceId, { kind: 'attack' })

    const hitSuffix = isCritical ? ' (critical hit)' : ''
    const missSuffix = isNaturalOne ? ' (natural 1)' : ''
    const attackDebug = formatAttackRollDebug(
      actor,
      target,
      attackerMarkers,
      defenderMarkers,
      attackRange,
      rollMod,
      pairVisibility,
    )
    nextState = appendEncounterLogEvent(nextState, {
      type: hit ? 'attack-hit' : 'attack-missed',
      actorId: actor.instanceId,
      targetIds: [target.instanceId],
      round: state.roundNumber,
      turn: state.turnIndex + 1,
      summary: hit
        ? `${getEncounterCombatantLabel(state, actor.instanceId)} hits ${targetLabel} with ${actionLabel}${hitSuffix}.`
        : `${getEncounterCombatantLabel(state, actor.instanceId)} misses ${targetLabel} with ${actionLabel}${missSuffix}.`,
      details: `Attack roll: ${rollDetail} + ${attackBonus} = ${totalRoll} vs AC ${target.stats.armorClass}.`,
      debugDetails: attackDebug.length > 0 ? attackDebug : undefined,
    })

    if (hit) {
      const damage = rollDamage(action.attackProfile?.damage, rng, { critical: isCritical })
      if (damage && damage.total > 0) {
        nextState = applyDamageToCombatant(nextState, target.instanceId, damage.total, {
          actorId: actor.instanceId,
          sourceLabel: actionLabel,
          damageType: action.attackProfile?.damageType,
          criticalHit: isCritical,
          rng,
          monstersById: options.monstersById,
        })
        nextState = appendEncounterLogEvent(nextState, {
          type: 'action-resolved',
          actorId: actor.instanceId,
          targetIds: [target.instanceId],
          round: state.roundNumber,
          turn: state.turnIndex + 1,
          summary: `${actionLabel} resolves for ${damage.total} damage.`,
          details: damage.details,
        })
      } else {
        nextState = appendEncounterLogEvent(nextState, {
          type: 'action-resolved',
          actorId: actor.instanceId,
          targetIds: [target.instanceId],
          round: state.roundNumber,
          turn: state.turnIndex + 1,
          summary: `${actionLabel} resolves with no damage roll.`,
        })
      }

      const hitResult = applyActionEffects(
        nextState,
        actor,
        nextState.combatantsById[target.instanceId] ?? target,
        action,
        action.onHitEffects,
        applyEffectsOpts,
      )
      nextState = hitResult.state
      allMarkerIds.push(...hitResult.createdMarkerIds)
    } else {
      nextState = appendEncounterLogEvent(nextState, {
        type: 'action-resolved',
        actorId: actor.instanceId,
        targetIds: [target.instanceId],
        round: state.roundNumber,
        turn: state.turnIndex + 1,
        summary: `${actionLabel} resolves with no damage dealt.`,
      })
    }
  } else if (action.resolutionMode === 'saving-throw') {
    if (targets.length === 0 || !action.saveProfile) return { state: nextState, createdMarkerIds: [] }

    for (const saveTarget of targets) {
      if (saveTarget.states.some((stateMarker) => stateMarker.label === getImmunityStateLabel(action.label))) {
        nextState = appendEncounterNote(
          nextState,
          `${getEncounterCombatantLabel(nextState, saveTarget.instanceId)} ignores ${actionLabel}.`,
          {
            actorId: actor.instanceId,
            targetIds: [saveTarget.instanceId],
            details: `Target is already immune to ${actionLabel}.`,
          },
        )
        continue
      }

      const saveAbility = action.saveProfile.ability

      if (autoFailsSave(saveTarget, saveAbility)) {
        const autoFailDebug = formatAutoFailDebug(saveTarget, saveAbility)
        nextState = appendEncounterLogEvent(nextState, {
          type: 'action-resolved',
          actorId: actor.instanceId,
          targetIds: [saveTarget.instanceId],
          round: state.roundNumber,
          turn: state.turnIndex + 1,
          summary: `${getEncounterCombatantLabel(nextState, saveTarget.instanceId)} automatically fails the ${saveAbility.toUpperCase()} save against ${actionLabel}.`,
          details: `Auto-fail: condition prevents ${saveAbility.toUpperCase()} saving throw.`,
          debugDetails: autoFailDebug.length > 0 ? autoFailDebug : undefined,
        })

        const saveEffectResult = applyActionEffects(
          nextState,
          actor,
          saveTarget,
          action,
          action.onFailEffects,
          applyEffectsOpts,
        )
        nextState = saveEffectResult.state
        allMarkerIds.push(...saveEffectResult.createdMarkerIds)

        if (action.damage) {
          const rolledDamage = rollDamage(action.damage, rng)
          if (rolledDamage && rolledDamage.total > 0) {
            nextState = applyDamageToCombatant(nextState, saveTarget.instanceId, rolledDamage.total, {
              actorId: actor.instanceId,
              sourceLabel: actionLabel,
              damageType: action.damageType,
              rng,
              monstersById: options.monstersById,
            })
          }
        }
        continue
      }

      const saveRollMod = resolveD20RollMode(getSaveModifiersFromConditions(saveTarget, saveAbility))

      const { rawRoll, detail: saveRollDetail } = rollD20WithRollMode(saveRollMod, rng)
      const saveModifier = getSaveModifier(saveTarget, saveAbility)
      const totalRoll = rawRoll + saveModifier
      const succeeded = totalRoll >= action.saveProfile.dc

      const saveDebug = formatSaveDebug(saveTarget, saveAbility, saveRollMod)
      nextState = appendEncounterLogEvent(nextState, {
        type: 'action-resolved',
        actorId: actor.instanceId,
        targetIds: [saveTarget.instanceId],
        round: state.roundNumber,
        turn: state.turnIndex + 1,
        summary: `${getEncounterCombatantLabel(nextState, saveTarget.instanceId)} ${succeeded ? 'succeeds' : 'fails'} the ${saveAbility.toUpperCase()} save against ${actionLabel}.`,
        details: `Saving throw: ${saveRollDetail} + ${saveModifier} = ${totalRoll} vs DC ${action.saveProfile.dc}.`,
        debugDetails: saveDebug,
      })

      if (action.damage) {
        const rolledDamage = rollDamage(action.damage, rng)
        if (rolledDamage && rolledDamage.total > 0) {
          const damageTotal =
            succeeded && action.saveProfile.halfDamageOnSave
              ? Math.floor(rolledDamage.total / 2)
              : succeeded
                ? 0
                : rolledDamage.total

          if (damageTotal > 0) {
            nextState = applyDamageToCombatant(nextState, saveTarget.instanceId, damageTotal, {
              actorId: actor.instanceId,
              sourceLabel: actionLabel,
              damageType: action.damageType,
              rng,
              monstersById: options.monstersById,
            })
          }
        }
      }

      const saveEffectResult = applyActionEffects(
        nextState,
        actor,
        saveTarget,
        action,
        succeeded ? action.onSuccessEffects : action.onFailEffects,
        applyEffectsOpts,
      )
      nextState = saveEffectResult.state
      allMarkerIds.push(...saveEffectResult.createdMarkerIds)
    }
  } else if (action.resolutionMode === 'effects') {
    const em = action.attachedEmanation
    const emMode =
      em?.anchorMode === 'place-or-object'
        ? resolveAttachedEmanationAnchorModeFromSelection(action, selection.casterOptions)
        : em?.anchorMode
    const effectTargets =
      em && action.effects?.length
        ? emMode === 'creature'
          ? targets.length > 0
            ? targets
            : []
          : emMode === 'object'
            ? [actor]
            : [actor]
        : targets.length > 0
          ? targets
          : action.targeting?.kind === 'none'
            ? [actor]
            : []

    if (effectTargets.length === 0 && action.effects?.length) {
      nextState = appendEncounterLogEvent(nextState, {
        type: 'action-resolved',
        actorId: actor.instanceId,
        round: state.roundNumber,
        turn: state.turnIndex + 1,
        summary: `${actionLabel} resolves with no valid targets.`,
      })
    } else {
      for (const effectTarget of effectTargets) {
        const resolvedTarget = nextState.combatantsById[effectTarget.instanceId] ?? effectTarget
        const effectPayload =
          action.hpThreshold != null
            ? resolvedTarget.stats.currentHitPoints <= action.hpThreshold.maxHp
              ? action.effects
              : action.aboveThresholdEffects ?? []
            : action.effects
        const effectResult = applyActionEffects(
          nextState,
          actor,
          resolvedTarget,
          action,
          effectPayload,
          applyEffectsOpts,
        )
        nextState = effectResult.state
        allMarkerIds.push(...effectResult.createdMarkerIds)
      }

      nextState = appendEncounterLogEvent(nextState, {
        type: 'action-resolved',
        actorId: actor.instanceId,
        targetIds: effectTargets.map((t) => t.instanceId),
        round: state.roundNumber,
        turn: state.turnIndex + 1,
        summary: `${actionLabel} resolves its effects.`,
        details: action.logText,
      })
    }
  } else {
    nextState = appendEncounterLogEvent(nextState, {
      type: action.kind === 'spell' ? 'spell-logged' : 'action-resolved',
      actorId: actor.instanceId,
      targetIds: target ? [target.instanceId] : undefined,
      round: state.roundNumber,
      turn: state.turnIndex + 1,
      summary:
        action.kind === 'spell'
          ? `${getEncounterCombatantLabel(state, actor.instanceId)} logs spell effect: ${actionLabel}${casterSummary}.`
          : `${actionLabel} resolves as a log-only action.`,
      details: action.logText,
    })
  }

  if (!behavior.skipCost && action.kind === 'spell' && action.usage?.uses && action.displayMeta?.source === 'spell') {
    options.onSpellSlotSpent?.(actor.source.sourceId, action.displayMeta.spellId)
  }
  const finalState = behavior.skipCost
    ? nextState
    : updateEncounterCombatant(nextState, actor.instanceId, (combatant) => ({
        ...combatant,
        actions: getCombatantActions(combatant).map((candidate) =>
          candidate.id === action.id ? spendCombatActionUsage(candidate) : candidate,
        ),
        turnResources: spendActionCost(getCombatantTurnResources(combatant), action.cost),
      }))
  let finalReturnState = finalState
  if (action.attachedEmanation && !behavior.skipCost) {
    const mode =
      action.attachedEmanation.anchorMode === 'place-or-object'
        ? resolveAttachedEmanationAnchorModeFromSelection(action, selection.casterOptions)
        : action.attachedEmanation.anchorMode
    const ids = selection.unaffectedCombatantIds ?? []
    let anchor:
      | { kind: 'place'; cellId: string }
      | { kind: 'creature'; combatantId: string }
      | { kind: 'object'; objectId: string; snapshotCellId: string }
      | null = null
    if (mode === 'place') {
      anchor = selection.aoeOriginCellId
        ? { kind: 'place', cellId: selection.aoeOriginCellId }
        : null
    } else if (mode === 'creature') {
      anchor =
        selection.targetId && finalState.combatantsById[selection.targetId]
          ? { kind: 'creature', combatantId: selection.targetId }
          : null
    } else if (mode === 'object') {
      const gridObject =
        selection.objectId != null ? findGridObjectById(finalState.space, selection.objectId) : undefined
      anchor = gridObject
        ? { kind: 'object', objectId: gridObject.id, snapshotCellId: gridObject.cellId }
        : null
    } else {
      anchor = { kind: 'creature', combatantId: selection.actorId }
    }
    if (anchor) {
      finalReturnState = addAttachedAuraInstance(finalState, {
        id: attachedAuraInstanceId(action.attachedEmanation.source, selection.actorId),
        casterCombatantId: selection.actorId,
        source: action.attachedEmanation.source,
        anchor,
        area: { kind: 'sphere', size: action.attachedEmanation.radiusFt },
        unaffectedCombatantIds: [...ids],
        ...(typeof action.saveDc === 'number' ? { saveDc: action.saveDc } : {}),
        ...(action.attachedEmanation.environmentZoneProfile
          ? { environmentZoneProfile: action.attachedEmanation.environmentZoneProfile }
          : {}),
      })
    }
  }
  return { state: finalReturnState, createdMarkerIds: allMarkerIds }
}
