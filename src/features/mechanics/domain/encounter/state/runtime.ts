import type { CombatantInstance } from './types'
import {
  rollInitiative,
  sortInitiativeRolls,
  type InitiativeParticipant,
  type InitiativeRoll,
  type InitiativeResolverOptions,
} from '../../resolution/resolvers/initiative-resolver'
import { rollDie } from '../../resolution/engines/dice.engine'
import type { SpawnSummonInitiativeMode } from '../../effects/effects.types'
import type { EncounterState } from './types'
import type { EncounterSpace, InitialPlacementOptions } from '@/features/encounter/space'
import { generateInitialPlacements } from '@/features/encounter/space'
import {
  createCombatantTurnResources,
  indexCombatants,
  seedRuntimeEffects,
  updateCombatant,
  createEmptyTurnContext,
  rollRechargeDie,
} from './shared'
import {
  appendLog,
  createEncounterStartedLog,
  createRoundStartedLog,
  createTurnEndedLog,
  createTurnStartedLog,
  getCombatantLabel,
} from './logging'
import {
  processMarkerBoundary,
  processRuntimeEffectBoundary,
  processTrackedPartTurnEnd,
} from './marker-lifecycle'
import { executeTurnHooks } from './turn-hooks'
import { tickConcentrationDuration } from './concentration-mutations'
import { formatRuntimeEffectLabel } from './shared'

function resetCombatantTurnState(state: EncounterState, combatantId: string | null): EncounterState {
  if (!combatantId) return state

  return updateCombatant(state, combatantId, (combatant) => ({
    ...combatant,
    turnContext: createEmptyTurnContext(),
    turnResources: createCombatantTurnResources(combatant),
  }))
}

function processActionRecharge(
  state: EncounterState,
  combatantId: string | null,
  rng: () => number,
): EncounterState {
  if (!combatantId) return state

  const combatant = state.combatantsById[combatantId]
  if (!combatant || !combatant.actions || combatant.actions.length === 0) return state

  const rechargeResults = combatant.actions.flatMap((action) => {
    const recharge = action.usage?.recharge
    const remainingUses = action.usage?.uses?.remaining
    if (!recharge || recharge.ready || remainingUses === 0) return []

    const roll = rollRechargeDie(rng)
    const recharged = roll >= recharge.min && roll <= recharge.max

    return [
      {
        actionId: action.id,
        actionLabel: action.label,
        roll,
        min: recharge.min,
        max: recharge.max,
        recharged,
      },
    ]
  })

  if (rechargeResults.length === 0) return state

  let nextState = updateCombatant(state, combatantId, (current) => ({
    ...current,
    actions: (current.actions ?? []).map((action) => {
      const result = rechargeResults.find((entry) => entry.actionId === action.id)
      if (!result || !action.usage?.recharge) return action

      return {
        ...action,
        usage: {
          ...action.usage,
          recharge: {
            ...action.usage.recharge,
            ready: result.recharged,
          },
        },
      }
    }),
  }))

  rechargeResults.forEach((result) => {
    nextState = appendLog(nextState, {
      type: 'note',
      actorId: combatantId,
      targetIds: [combatantId],
      round: nextState.roundNumber,
      turn: nextState.turnIndex + 1,
      summary: result.recharged
        ? `${getCombatantLabel(nextState, combatantId)} recharges ${result.actionLabel}.`
        : `${getCombatantLabel(nextState, combatantId)} does not recharge ${result.actionLabel}.`,
      details: `Recharge roll: d6 ${result.roll} vs ${result.min}-${result.max}.`,
    })
  })

  return nextState
}

function buildAliveInitiativeParticipants(state: EncounterState): InitiativeParticipant[] {
  return state.initiativeOrder
    .map((id) => state.combatantsById[id])
    .filter((c): c is CombatantInstance => c != null && c.stats.currentHitPoints > 0)
    .map((c) => ({
      instanceId: c.instanceId,
      label: c.source.label,
      initiativeModifier: c.stats.initiativeModifier,
      dexterityScore: c.stats.dexterityScore,
    }))
}

/**
 * Inserts new combatants (e.g. summoned allies), merges initiative, preserves the current turn actor.
 */
export function mergeCombatantsIntoEncounter(
  state: EncounterState,
  newCombatants: CombatantInstance[],
  options: InitiativeResolverOptions & {
    initiativeMode?: SpawnSummonInitiativeMode
    casterInstanceId?: string
  },
): EncounterState {
  if (newCombatants.length === 0) return state

  const rng = options.rng ?? Math.random
  const seeded = newCombatants.map(seedRuntimeEffects)
  const casterRoll = options.casterInstanceId
    ? state.initiative.find((r) => r.combatantId === options.casterInstanceId)
    : undefined

  const mode = options.initiativeMode ?? 'individual'
  let newRolls: InitiativeRoll[]

  if (mode === 'share-caster' && casterRoll) {
    newRolls = seeded.map((c) => ({
      combatantId: c.instanceId,
      label: c.source.label,
      roll: casterRoll.roll,
      modifier: casterRoll.modifier,
      total: casterRoll.total,
      dexterityScore: casterRoll.dexterityScore,
    }))
  } else if (mode === 'group' && seeded.length > 0) {
    const groupRoll = rollDie(20, rng)
    const groupMod = seeded[0]!.stats.initiativeModifier
    const total = groupRoll + groupMod
    newRolls = seeded.map((c) => ({
      combatantId: c.instanceId,
      label: c.source.label,
      roll: groupRoll,
      modifier: groupMod,
      total,
      dexterityScore: c.stats.dexterityScore,
    }))
  } else {
    newRolls = rollInitiative(
      seeded.map((c) => ({
        instanceId: c.instanceId,
        label: c.source.label,
        initiativeModifier: c.stats.initiativeModifier,
        dexterityScore: c.stats.dexterityScore,
      })),
      options,
    )
  }

  const mergedInitiative = sortInitiativeRolls([...state.initiative, ...newRolls])
  const initiativeOrder = mergedInitiative.map((r: InitiativeRoll) => r.combatantId)

  const activeId = state.activeCombatantId
  const turnIndex =
    activeId != null && initiativeOrder.includes(activeId)
      ? initiativeOrder.indexOf(activeId)
      : state.turnIndex

  const partyIds = new Set(state.partyCombatantIds)
  for (const c of seeded) {
    if (c.side === 'party') partyIds.add(c.instanceId)
  }

  const combatantsById = { ...state.combatantsById }
  for (const c of seeded) {
    combatantsById[c.instanceId] = c
  }

  return {
    ...state,
    combatantsById,
    partyCombatantIds: Array.from(partyIds),
    initiative: mergedInitiative,
    initiativeOrder,
    turnIndex,
    activeCombatantId: state.activeCombatantId,
  }
}

export function createEncounterState(
  combatants: CombatantInstance[],
  options: InitiativeResolverOptions & {
    space?: EncounterSpace
    placementOptions?: InitialPlacementOptions
  } = {},
): EncounterState {
  const seededCombatants = combatants.map(seedRuntimeEffects)
  const initiative = rollInitiative(
    seededCombatants.map((combatant) => ({
      instanceId: combatant.instanceId,
      label: combatant.source.label,
      initiativeModifier: combatant.stats.initiativeModifier,
      dexterityScore: combatant.stats.dexterityScore,
    })),
    options,
  )

  const initiativeOrder = initiative.map((entry) => entry.combatantId)
  const partyCombatantIds = seededCombatants
    .filter((combatant) => combatant.side === 'party')
    .map((combatant) => combatant.instanceId)
  const enemyCombatantIds = seededCombatants
    .filter((combatant) => combatant.side === 'enemies')
    .map((combatant) => combatant.instanceId)

  const placements = options.space
    ? generateInitialPlacements(options.space, seededCombatants, options.placementOptions)
    : undefined

  const state: EncounterState = {
    combatantsById: indexCombatants(seededCombatants),
    partyCombatantIds,
    enemyCombatantIds,
    initiative,
    initiativeOrder,
    activeCombatantId: initiativeOrder[0] ?? null,
    turnIndex: 0,
    roundNumber: 1,
    started: true,
    log: [],
    space: options.space,
    placements,
  }

  state.log = [createEncounterStartedLog(state)]
  if (state.activeCombatantId) {
    state.log.push(createTurnStartedLog(state))
    const withResetContext = resetCombatantTurnState(state, state.activeCombatantId)
    const withRecharge = processActionRecharge(
      withResetContext,
      state.activeCombatantId,
      options.rng ?? Math.random,
    )
    const withStartExpiry = processRuntimeEffectBoundary(withRecharge, state.activeCombatantId, 'start')
    const withMarkerExpiry = processMarkerBoundary(withStartExpiry, state.activeCombatantId, 'start')
    return executeTurnHooks(withMarkerExpiry, state.activeCombatantId, 'start')
  }

  return state
}

export function advanceEncounterTurn(
  state: EncounterState,
  options: InitiativeResolverOptions = {},
): EncounterState {
  if (!state.started || state.initiativeOrder.length === 0 || !state.activeCombatantId) {
    return state
  }

  const withTurnEndLog: EncounterState = {
    ...state,
    log: [...state.log, createTurnEndedLog(state)],
  }
  const withTurnEndHooks = executeTurnHooks(withTurnEndLog, state.activeCombatantId, 'end')
  const withConcentrationTick = tickConcentrationDuration(withTurnEndHooks, state.activeCombatantId)
  const endedState = processMarkerBoundary(
    processRuntimeEffectBoundary(
      processTrackedPartTurnEnd(
        withConcentrationTick,
        state.activeCombatantId,
      ),
      state.activeCombatantId,
      'end',
    ),
    state.activeCombatantId,
    'end',
  )

  const participants = buildAliveInitiativeParticipants(endedState)
  if (participants.length === 0) {
    return endedState
  }

  const nextTurnIndex = (state.turnIndex + 1) % state.initiativeOrder.length
  const wrappedRound = nextTurnIndex === 0
  const nextRoundNumber = wrappedRound ? state.roundNumber + 1 : state.roundNumber

  let nextState: EncounterState

  if (wrappedRound) {
    const initiative = rollInitiative(participants, options)
    const initiativeOrder = initiative.map((entry) => entry.combatantId)
    nextState = {
      ...endedState,
      initiative,
      initiativeOrder,
      turnIndex: 0,
      roundNumber: nextRoundNumber,
      activeCombatantId: initiativeOrder[0] ?? null,
      log: [...endedState.log, createRoundStartedLog({
        ...endedState,
        initiative,
        initiativeOrder,
        roundNumber: nextRoundNumber,
        turnIndex: 0,
        activeCombatantId: initiativeOrder[0] ?? null,
      })],
    }
  } else {
    nextState = {
      ...endedState,
      turnIndex: nextTurnIndex,
      roundNumber: nextRoundNumber,
      activeCombatantId: state.initiativeOrder[nextTurnIndex] ?? null,
    }
  }

  if (!nextState.activeCombatantId) {
    return nextState
  }

  const startedState: EncounterState = {
    ...nextState,
    log: [...nextState.log, createTurnStartedLog(nextState)],
  }

  const withResetContext = resetCombatantTurnState(startedState, startedState.activeCombatantId)
  const withRecharge = processActionRecharge(
    withResetContext,
    withResetContext.activeCombatantId,
    options.rng ?? Math.random,
  )

  return executeTurnHooks(
    processMarkerBoundary(
      processRuntimeEffectBoundary(withRecharge, withRecharge.activeCombatantId, 'start'),
      withRecharge.activeCombatantId,
      'start',
    ),
    withRecharge.activeCombatantId,
    'start',
  )
}

export { formatRuntimeEffectLabel }