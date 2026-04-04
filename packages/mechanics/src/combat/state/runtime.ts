import type { Monster } from '@/features/content/monsters/domain/types'
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
import type { EncounterSpace, InitialPlacementOptions } from '@/features/mechanics/domain/combat/space'
import { generateInitialPlacements } from '@/features/mechanics/domain/combat/space'
import type { EncounterEnvironmentBaseline, EncounterEnvironmentZone } from '@/features/mechanics/domain/environment'
import { DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE } from '@/features/mechanics/domain/environment'
import {
  createCombatantTurnResources,
  indexCombatants,
  seedRuntimeEffects,
  updateCombatant,
  createEmptyTurnContext,
  rollRechargeDie,
} from './shared'
import type { BattlefieldSpellContext } from './battlefield/battlefield-spatial-movement-modifiers'
import {
  collectMonsterTraitAttachedAuras,
  DEFAULT_MONSTER_RUNTIME_CONTEXT_FOR_ENCOUNTER,
  type MonsterRuntimeContext,
} from '../runtime/monster-runtime'
import {
  appendLog,
  createEncounterStartedLog,
  createRoundStartedLog,
  createTurnEndedLog,
  createTurnStartedLog,
  getCombatantLabel,
} from './effects/logging'
import {
  processMarkerBoundary,
  processRuntimeEffectBoundary,
  processTrackedPartTurnEnd,
} from './effects/marker-lifecycle'
import { executeTurnHooks } from './effects/turn-hooks'
import { tickConcentrationDuration } from './effects/concentration-mutations'
import { formatRuntimeEffectLabel } from './shared'
import { shouldAutoSkipCombatantTurn } from './combatants/combatant-participation'
import {
  resolveIntervalEffectsForCombatantAtTurnBoundary,
  type BattlefieldIntervalResolutionOptions,
} from './battlefield/battlefield-interval-resolution'
import { reconcileBattlefieldEffectAnchors } from './auras/battlefield-effect-anchor-reconciliation'
import { syncEncounterSpaceToActiveCombatant } from '../space/encounter-spaces'

function resetCombatantTurnState(
  state: EncounterState,
  combatantId: string | null,
  battlefieldSpell?: BattlefieldSpellContext,
): EncounterState {
  if (!combatantId) return state

  return updateCombatant(state, combatantId, (combatant) => ({
    ...combatant,
    turnContext: createEmptyTurnContext(),
    turnResources: createCombatantTurnResources(combatant, {
      encounterState: state,
      battlefieldSpell,
    }),
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

/** Same “alive” predicate as `isActiveCombatant` in combatant-participation.ts (HP > 0). */
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
    /** When set, monster combatants can receive trait-sourced {@link EncounterState.attachedAuraInstances}. */
    monstersById?: Record<string, Monster>
    monsterRuntimeContext?: MonsterRuntimeContext
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

  const traitAuras = collectMonsterTraitAttachedAuras(
    seeded,
    options.monstersById,
    options.monsterRuntimeContext ?? DEFAULT_MONSTER_RUNTIME_CONTEXT_FOR_ENCOUNTER,
  )
  const mergedAuras = [...(state.attachedAuraInstances ?? []), ...traitAuras]

  return reconcileBattlefieldEffectAnchors({
    ...state,
    combatantsById,
    partyCombatantIds: Array.from(partyIds),
    initiative: mergedInitiative,
    initiativeOrder,
    turnIndex,
    activeCombatantId: state.activeCombatantId,
    attachedAuraInstances: mergedAuras,
  })
}

/**
 * Removes a combatant from initiative ordering without deleting their record (e.g. corpse consumed by replacement spawn).
 */
export function removeCombatantFromInitiativeOrder(
  state: EncounterState,
  combatantId: string,
): EncounterState {
  if (!state.initiativeOrder.includes(combatantId)) return state

  const oldOrder = state.initiativeOrder
  const removedIdx = oldOrder.indexOf(combatantId)
  const activeId = state.activeCombatantId

  const newOrder = oldOrder.filter((id) => id !== combatantId)
  const newInitiative = state.initiative.filter((r) => r.combatantId !== combatantId)

  if (newOrder.length === 0) {
    return {
      ...state,
      initiative: [],
      initiativeOrder: [],
      activeCombatantId: null,
      turnIndex: 0,
    }
  }

  let nextActive = activeId
  let nextTurnIndex: number

  if (activeId === combatantId) {
    const nextIdx = (removedIdx + 1) % oldOrder.length
    nextActive = oldOrder[nextIdx]!
    if (nextActive === combatantId) {
      nextActive = newOrder[0] ?? null
    }
    nextTurnIndex = nextActive ? newOrder.indexOf(nextActive) : 0
    if (nextTurnIndex < 0) {
      nextTurnIndex = 0
      nextActive = newOrder[0] ?? null
    }
  } else {
    nextActive = activeId
    nextTurnIndex = activeId ? newOrder.indexOf(activeId) : 0
    if (nextTurnIndex < 0) {
      nextTurnIndex = 0
      nextActive = newOrder[0] ?? null
    }
  }

  return {
    ...state,
    initiative: newInitiative,
    initiativeOrder: newOrder,
    turnIndex: nextTurnIndex,
    activeCombatantId: nextActive,
  }
}

/** Options for {@link advanceEncounterTurn} (initiative RNG + optional attached-aura interval resolution). */
export type AdvanceEncounterTurnOptions = InitiativeResolverOptions & {
  battlefieldInterval?: BattlefieldIntervalResolutionOptions
}

function skipNonInteractiveTurnsAfterActiveTurn(
  state: EncounterState,
  options: AdvanceEncounterTurnOptions,
  depth: number,
): EncounterState {
  const maxDepth = Math.max(state.initiativeOrder.length * 2, 16)
  if (depth > maxDepth) return state

  const activeId = state.activeCombatantId
  if (!activeId || !state.started) return state

  const active = state.combatantsById[activeId]
  if (!active || !shouldAutoSkipCombatantTurn(active)) return state

  return skipNonInteractiveTurnsAfterActiveTurn(advanceEncounterTurnOnce(state, options), options, depth + 1)
}

export function createEncounterState(
  combatants: CombatantInstance[],
  options: InitiativeResolverOptions & {
    space?: EncounterSpace
    placementOptions?: InitialPlacementOptions
    /** When set with `spellLookup`, turn-start movement uses spatial attached-aura modifiers. */
    battlefieldSpell?: BattlefieldSpellContext
    /**
     * Context for which monster trait effects are considered active when seeding trait attached auras.
     * Defaults to a neutral baseline (see {@link DEFAULT_MONSTER_RUNTIME_CONTEXT_FOR_ENCOUNTER}).
     */
    monsterRuntimeContext?: MonsterRuntimeContext
    /** Monster catalog lookup for trait attached auras; falls back to `battlefieldSpell.monstersById`. */
    monstersById?: Record<string, Monster>
    /** Snapshot from encounter setup; defaults to `DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE`. */
    environmentBaseline?: EncounterEnvironmentBaseline
    environmentZones?: EncounterEnvironmentZone[]
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

  const spacesById = options.space ? { [options.space.id]: options.space } : undefined

  const monstersById = options.monstersById ?? options.battlefieldSpell?.monstersById
  const traitAuras = collectMonsterTraitAttachedAuras(
    seededCombatants,
    monstersById,
    options.monsterRuntimeContext ?? DEFAULT_MONSTER_RUNTIME_CONTEXT_FOR_ENCOUNTER,
  )

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
    spacesById,
    placements,
    attachedAuraInstances: traitAuras,
    environmentBaseline: options.environmentBaseline ?? DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE,
    environmentZones: options.environmentZones ?? [],
  }

  state.log = [createEncounterStartedLog(state)]
  if (state.activeCombatantId) {
    state.log.push(createTurnStartedLog(state))
    const withResetContext = resetCombatantTurnState(state, state.activeCombatantId, options.battlefieldSpell)
    const withRecharge = processActionRecharge(
      withResetContext,
      state.activeCombatantId,
      options.rng ?? Math.random,
    )
    const withStartExpiry = processRuntimeEffectBoundary(withRecharge, state.activeCombatantId, 'start')
    const withMarkerExpiry = processMarkerBoundary(withStartExpiry, state.activeCombatantId, 'start')
    const afterStart = executeTurnHooks(withMarkerExpiry, state.activeCombatantId, 'start')
    return skipNonInteractiveTurnsAfterActiveTurn(afterStart, options, 0)
  }

  return state
}

function advanceEncounterTurnOnce(
  state: EncounterState,
  options: AdvanceEncounterTurnOptions = {},
): EncounterState {
  if (!state.started || state.initiativeOrder.length === 0 || !state.activeCombatantId) {
    return state
  }

  const withTurnEndLog: EncounterState = {
    ...state,
    log: [...state.log, createTurnEndedLog(state)],
  }
  const withTurnEndHooks = executeTurnHooks(withTurnEndLog, state.activeCombatantId, 'end')
  const withAttachedIntervals =
    options.battlefieldInterval != null
      ? resolveIntervalEffectsForCombatantAtTurnBoundary(
          withTurnEndHooks,
          state.activeCombatantId,
          'end',
          options.battlefieldInterval,
        )
      : withTurnEndHooks
  const withConcentrationTick = tickConcentrationDuration(withAttachedIntervals, state.activeCombatantId)
  const endedState = processMarkerBoundary(
    processRuntimeEffectBoundary(
      processTrackedPartTurnEnd(withConcentrationTick, state.activeCombatantId),
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

  const battlefieldSpell: BattlefieldSpellContext | undefined =
    options.battlefieldInterval != null
      ? {
          spellLookup: options.battlefieldInterval.spellLookup,
          suppressSameSideHostile: options.battlefieldInterval.suppressSameSideHostile,
          monstersById: options.battlefieldInterval.monstersById,
        }
      : undefined
  const withResetContext = resetCombatantTurnState(startedState, startedState.activeCombatantId, battlefieldSpell)
  const withRecharge = processActionRecharge(
    withResetContext,
    withResetContext.activeCombatantId,
    options.rng ?? Math.random,
  )

  return syncEncounterSpaceToActiveCombatant(
    reconcileBattlefieldEffectAnchors(
      executeTurnHooks(
        processMarkerBoundary(
          processRuntimeEffectBoundary(withRecharge, withRecharge.activeCombatantId, 'start'),
          withRecharge.activeCombatantId,
          'start',
        ),
        withRecharge.activeCombatantId,
        'start',
      ),
    ),
  )
}

export function advanceEncounterTurn(
  state: EncounterState,
  options: AdvanceEncounterTurnOptions = {},
): EncounterState {
  return skipNonInteractiveTurnsAfterActiveTurn(advanceEncounterTurnOnce(state, options), options, 0)
}

export { formatRuntimeEffectLabel }