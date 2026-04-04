import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { TurnBoundary } from '@/features/mechanics/domain/effects/timing.types'
import {
  addConditionToCombatant,
  addStateToCombatant,
  applyDamageToCombatant,
  applyHealingToCombatant,
  buildReducedToZeroTraits,
  DEFAULT_MANUAL_MONSTER_TRIGGER_CONTEXT,
  getActionTargetCandidates,
  getCombatantAvailableActions,
  removeConditionFromCombatant,
  applyCombatIntent,
  type ApplyCombatIntentContext,
  flattenLogEntriesFromIntentSuccess,
  startEncounterFromSetup,
  removeStateFromCombatant,
  triggerManualHook,
  type CombatantInstance,
  type CombatIntent,
  type CombatLogEvent,
  type EncounterState,
  type ManualEnvironmentContext,
  type ManualMonsterTriggerContext,
  type MonsterFormContext,
} from '@/features/mechanics/domain/combat'
import { getCombatantDisplayLabel } from '@/features/mechanics/domain/combat/state'
import { buildInitialCasterOptionsForAction } from '@/features/mechanics/domain/spells/caster-options'
import type { Armor } from '@/features/content/equipment/armor/domain/types/armor.types'
import type { Weapon } from '@/features/content/equipment/weapons/domain/types/weapon.types'
import type {
  EncounterEnvironmentBaseline,
  EncounterEnvironmentZone,
} from '@/features/mechanics/domain/environment'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import { buildSummonAllyMonsterCombatant } from '../helpers/combatants'
import type { AoeStep } from '../helpers/actions'

import { buildResolveActionIntentFromActiveSelection } from '../domain/interaction/build-resolve-action-intent'
import { postPersistedCombatIntent } from '@/features/combat/api/combatSessionApi'
import type { OpponentRosterEntry } from '../types'
import type { EncounterSpace, InitialPlacementOptions } from '@/features/mechanics/domain/combat/space'
import type { CombatIntentSuccess } from '@/features/mechanics/domain/combat/results'

type UseEncounterStateArgs = {
  selectedCombatantIds: string[]
  opponentRoster: OpponentRosterEntry[]
  monstersById: Record<string, Monster>
  weaponsById?: Record<string, Weapon>
  armorById?: Record<string, Armor>
  /** When set, end-of-turn interval resolution can load spell payloads (e.g. Spirit Guardians). */
  spellsById?: Record<string, Spell>
  suppressSameSideHostile?: boolean
  /**
   * When set (e.g. GameSession play), load encounter from persisted snapshot and skip roster-driven resets.
   */
  hydratedEncounterState?: EncounterState | null
  /**
   * When set, successful applyCombatIntent calls are mirrored to `POST /api/combat/sessions/:id/intents`.
   */
  persistedCombat?: {
    sessionId: string
    revision: number
    setRevision: (r: number) => void
  }
}

export function useEncounterState({
  selectedCombatantIds,
  opponentRoster,
  monstersById,
  weaponsById,
  armorById,
  spellsById,
  suppressSameSideHostile,
  hydratedEncounterState,
  persistedCombat,
}: UseEncounterStateArgs) {
  const isHydratedMode = Boolean(hydratedEncounterState)
  const persistedRevisionRef = useRef(persistedCombat?.revision ?? 0)
  /** Serializes POST /intents so each request uses the revision from the previous commit (avoids 409 stale). */
  const syncPersistedQueueRef = useRef(Promise.resolve())
  /** Latest encounter state for apply + sync without relying on setState updater (Strict Mode / concurrent safe). */
  const encounterStateRef = useRef<EncounterState | null>(null)

  useEffect(() => {
    if (persistedCombat) persistedRevisionRef.current = persistedCombat.revision
  }, [persistedCombat?.revision])

  const [resolvedCombatantsById, setResolvedCombatantsById] = useState<Record<string, CombatantInstance>>({})
  const [encounterState, setEncounterState] = useState<EncounterState | null>(null)
  encounterStateRef.current = encounterState
  const [controlTargetId, setControlTargetId] = useState('')
  const [damageAmount, setDamageAmount] = useState('5')
  const [damageTypeInput, setDamageTypeInput] = useState('fire')
  const [healingAmount, setHealingAmount] = useState('5')
  const [conditionInput, setConditionInput] = useState('poisoned')
  const [stateInput, setStateInput] = useState('concentrating')
  const [markerDurationTurns, setMarkerDurationTurns] = useState('1')
  const [markerDurationBoundary, setMarkerDurationBoundary] = useState<TurnBoundary>('end')
  const [environmentContext, setEnvironmentContext] = useState<ManualEnvironmentContext>('none')
  const [monsterFormsById, setMonsterFormsById] = useState<Record<string, MonsterFormContext>>({})
  const [monsterManualTriggersById, setMonsterManualTriggersById] = useState<
    Record<string, ManualMonsterTriggerContext>
  >({})
  const [reducedToZeroSaveOutcome, setReducedToZeroSaveOutcome] = useState<'success' | 'fail'>('success')
  const [selectedActionId, setSelectedActionId] = useState('')
  const [selectedActionTargetId, setSelectedActionTargetId] = useState('')
  const [selectedCasterOptions, setSelectedCasterOptions] = useState<Record<string, string>>({})
  const [aoeStep, setAoeStep] = useState<AoeStep>('none')
  const [aoeOriginCellId, setAoeOriginCellId] = useState<string | null>(null)
  const [aoeHoverCellId, setAoeHoverCellId] = useState<string | null>(null)
  /** Spirit Guardians–style: designated unaffected combatant ids before resolve. */
  const [unaffectedCombatantIds, setUnaffectedCombatantIds] = useState<string[]>([])
  /** Grid cell id for summon / single-cell placement readiness (when required by spawn metadata). */
  const [selectedSingleCellPlacementCellId, setSelectedSingleCellPlacementCellId] = useState<string | null>(null)
  const [singleCellPlacementHoverCellId, setSingleCellPlacementHoverCellId] = useState<string | null>(null)
  /** `EncounterSpace.gridObjects` id for attached emanation `anchorMode === 'object'`. */
  const [selectedObjectAnchorId, setSelectedObjectAnchorId] = useState<string | null>(null)
  const [objectAnchorHoverCellId, setObjectAnchorHoverCellId] = useState<string | null>(null)

  const resetAoePlacement = useCallback(() => {
    setAoeStep('none')
    setAoeOriginCellId(null)
    setAoeHoverCellId(null)
  }, [])

  useEffect(() => {
    if (!hydratedEncounterState) return
    setEncounterState(hydratedEncounterState)
    setResolvedCombatantsById(
      Object.fromEntries(
        Object.values(hydratedEncounterState.combatantsById).map((c) => [c.instanceId, c]),
      ),
    )
  }, [hydratedEncounterState])

  const combatLogAppendedRef = useRef<
    ((events: CombatLogEvent[], state: EncounterState) => void) | undefined
  >(undefined)
  const registerCombatLogAppended = useCallback(
    (fn: ((events: CombatLogEvent[], state: EncounterState) => void) | undefined) => {
      combatLogAppendedRef.current = fn
    },
    [],
  )

  const notifyLogAppendedFromIntentSuccess = useCallback((result: CombatIntentSuccess) => {
    const logEntries = flattenLogEntriesFromIntentSuccess(result)
    if (logEntries.length === 0) return
    queueMicrotask(() => combatLogAppendedRef.current?.(logEntries, result.nextState))
  }, [])

  const syncPersistedAfterApply = useCallback(
    (intent: CombatIntent, context: ApplyCombatIntentContext = {}) => {
      if (!persistedCombat) return
      syncPersistedQueueRef.current = syncPersistedQueueRef.current
        .then(async () => {
          const baseRev = persistedRevisionRef.current
          const r = await postPersistedCombatIntent({
            sessionId: persistedCombat.sessionId,
            baseRevision: baseRev,
            intent,
            context,
          })
          if (r.ok) {
            persistedRevisionRef.current = r.revision
            persistedCombat.setRevision(r.revision)
          }
        })
        .catch((err) => {
          console.error('persisted combat sync failed', err)
        })
    },
    [persistedCombat],
  )

  const selectedCombatants = useMemo(
    () =>
      selectedCombatantIds
        .map((combatantId) => resolvedCombatantsById[combatantId])
        .filter((combatant): combatant is CombatantInstance => Boolean(combatant)),
    [resolvedCombatantsById, selectedCombatantIds],
  )

  const unresolvedCombatantCount = selectedCombatantIds.length - selectedCombatants.length
  const activeCombatantId = encounterState?.activeCombatantId ?? null
  const activeCombatant = activeCombatantId ? encounterState?.combatantsById[activeCombatantId] ?? null : null
  const availableActions = useMemo(
    () =>
      encounterState && activeCombatantId
        ? getCombatantAvailableActions(encounterState, activeCombatantId)
        : [],
    [activeCombatantId, encounterState],
  )
  const selectedAction = useMemo(
    () => availableActions.find((action) => action.id === selectedActionId) ?? null,
    [availableActions, selectedActionId],
  )
  const availableActionTargets = useMemo(() => {
    if (!encounterState || !activeCombatant || !selectedAction) return []
    const roster = Object.values(encounterState.combatantsById)
    return getActionTargetCandidates(encounterState, activeCombatant, selectedAction).map((combatant) => ({
      id: combatant.instanceId,
      label: getCombatantDisplayLabel(combatant, roster),
    }))
  }, [activeCombatant, encounterState, selectedAction])
  const controlTargetCombatant =
    encounterState && controlTargetId ? encounterState.combatantsById[controlTargetId] : null
  const controlTargetMonster =
    controlTargetCombatant?.source.kind === 'monster'
      ? monstersById[controlTargetCombatant.source.sourceId]
      : undefined
  const controlTargetReducedToZeroTraits = useMemo(
    () => (controlTargetMonster ? buildReducedToZeroTraits(controlTargetMonster) : []),
    [controlTargetMonster],
  )
  const controlTargetHasReducedToZeroSave = useMemo(
    () =>
      controlTargetReducedToZeroTraits.some((trait) =>
        (trait.effects ?? []).some((effect) => effect.kind === 'save'),
      ),
    [controlTargetReducedToZeroTraits],
  )
  const canTriggerReducedToZeroHook = Boolean(
    encounterState &&
      controlTargetId &&
      controlTargetCombatant &&
      controlTargetCombatant.stats.currentHitPoints <= 0 &&
      controlTargetReducedToZeroTraits.length > 0,
  )

  useEffect(() => {
    if (isHydratedMode) return
    const validIds = new Set(selectedCombatantIds)

    setResolvedCombatantsById((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([combatantId]) => validIds.has(combatantId)),
      ),
    )
    setEncounterState(null)
  }, [selectedCombatantIds, isHydratedMode])

  useEffect(() => {
    if (!encounterState) {
      setSelectedObjectAnchorId(null)
      setObjectAnchorHoverCellId(null)
    }
  }, [encounterState])

  useEffect(() => {
    if (isHydratedMode) return
    const validMonsterIds = new Set(
      opponentRoster.filter((entry) => entry.kind === 'monster').map((entry) => entry.runtimeId),
    )

    setMonsterFormsById((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([runtimeId]) => validMonsterIds.has(runtimeId)),
      ) as Record<string, MonsterFormContext>,
    )
    setMonsterManualTriggersById((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([runtimeId]) => validMonsterIds.has(runtimeId)),
      ) as Record<string, ManualMonsterTriggerContext>,
    )
  }, [opponentRoster, isHydratedMode])

  useEffect(() => {
    if (isHydratedMode) return
    setEncounterState(null)
  }, [environmentContext, monsterFormsById, monsterManualTriggersById, isHydratedMode])

  useEffect(() => {
    resetAoePlacement()
  }, [activeCombatantId, resetAoePlacement])

  useEffect(() => {
    if (!encounterState) {
      setControlTargetId('')
      setSelectedActionId('')
      setSelectedActionTargetId('')
      resetAoePlacement()
      return
    }

    const validIds = new Set(encounterState.initiativeOrder)
    if (!controlTargetId || !validIds.has(controlTargetId)) {
      setControlTargetId(encounterState.activeCombatantId ?? encounterState.initiativeOrder[0] ?? '')
    }
  }, [controlTargetId, encounterState, resetAoePlacement])

  useEffect(() => {
    if (selectedActionId && !availableActions.some((action) => action.id === selectedActionId)) {
      setSelectedActionId('')
    }
  }, [availableActions, selectedActionId])

  useEffect(() => {
    if (!selectedActionTargetId) return
    // Allow choosing a target before an action; validate against the action once selected.
    if (!selectedAction) return
    const validTargetIds = new Set(availableActionTargets.map((target) => target.id))
    if (!validTargetIds.has(selectedActionTargetId)) {
      setSelectedActionTargetId('')
    }
  }, [availableActionTargets, selectedAction, selectedActionTargetId])

  useEffect(() => {
    const action = availableActions.find((a) => a.id === selectedActionId) ?? null
    setSelectedCasterOptions(buildInitialCasterOptionsForAction(action))
    setSelectedSingleCellPlacementCellId(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when selectedActionId changes; availableActions is read fresh
  }, [selectedActionId])

  const buildSummonAllyCombatant = useCallback(
    ({ monster, runtimeId }: { monster: Monster; runtimeId: string }) =>
      buildSummonAllyMonsterCombatant({
        monster,
        runtimeId,
        weaponsById: weaponsById ?? {},
        armorById: armorById ?? {},
      }),
    [weaponsById, armorById],
  )

  const handleResolvedCombatant = useCallback((runtimeId: string, combatant: CombatantInstance | null) => {
    setResolvedCombatantsById((prev) => {
      if (combatant == null) {
        if (!(runtimeId in prev)) return prev
        const next = { ...prev }
        delete next[runtimeId]
        return next
      }

      return {
        ...prev,
        [runtimeId]: combatant,
      }
    })
  }, [])

  function handleStartEncounter(opts?: {
    space?: EncounterSpace
    placementOptions?: InitialPlacementOptions
    environmentBaseline?: EncounterEnvironmentBaseline
    environmentZones?: EncounterEnvironmentZone[]
  }) {
    if (selectedCombatants.length === 0 || unresolvedCombatantCount > 0) return
    const result = startEncounterFromSetup({
      combatants: selectedCombatants,
      space: opts?.space,
      placementOptions: opts?.placementOptions,
      environmentBaseline: opts?.environmentBaseline,
      environmentZones: opts?.environmentZones,
      battlefieldSpell: {
        spellsById: spellsById ?? undefined,
        monstersById,
        suppressSameSideHostile,
      },
    })
    if (!result.ok) return
    setEncounterState(result.state)
  }

  function handleNextTurn() {
    const prev = encounterStateRef.current
    if (!prev) {
      if (import.meta.env.DEV && encounterState) {
        console.error('handleNextTurn: encounterStateRef is null but encounterState exists — ref sync is missing')
      }
      return
    }
    const context: ApplyCombatIntentContext = {
      advanceEncounterTurnOptions: {
        rng: Math.random,
        battlefieldInterval:
          spellsById != null
            ? {
                spellLookup: (id) => spellsById[id],
                suppressSameSideHostile,
                monstersById,
              }
            : undefined,
      },
    }
    const result = applyCombatIntent(prev, { kind: 'end-turn' }, context)
    if (!result.ok) return
    encounterStateRef.current = result.nextState
    setEncounterState(result.nextState)
    notifyLogAppendedFromIntentSuccess(result)
    syncPersistedAfterApply({ kind: 'end-turn' }, context)
  }

  const handleResolveAction = useCallback(() => {
    const prev = encounterStateRef.current
    if (!prev || !prev.activeCombatantId || !selectedActionId) {
      if (import.meta.env.DEV && encounterState && !prev) {
        console.error('handleResolveAction: encounterStateRef is null but encounterState exists — ref sync is missing')
      }
      return
    }
    const intent = buildResolveActionIntentFromActiveSelection({
      activeCombatantId: prev.activeCombatantId,
      selectedActionId,
      selectedActionTargetId,
      selectedCasterOptions,
      aoeOriginCellId,
      selectedSingleCellPlacementCellId,
      unaffectedCombatantIds,
      selectedObjectAnchorId,
    })
    const context: ApplyCombatIntentContext = {
      resolveCombatActionOptions: { monstersById, buildSummonAllyCombatant },
    }
    const result = applyCombatIntent(prev, intent, context)
    if (!result.ok) return
    encounterStateRef.current = result.nextState
    setEncounterState(result.nextState)
    notifyLogAppendedFromIntentSuccess(result)
    syncPersistedAfterApply(intent, context)
    resetAoePlacement()
    setSelectedActionId('')
    setSelectedActionTargetId('')
    setSelectedSingleCellPlacementCellId(null)
    setSelectedObjectAnchorId(null)
    setObjectAnchorHoverCellId(null)
    setUnaffectedCombatantIds([])
  }, [
    selectedActionId,
    selectedActionTargetId,
    selectedCasterOptions,
    aoeOriginCellId,
    selectedSingleCellPlacementCellId,
    selectedObjectAnchorId,
    unaffectedCombatantIds,
    monstersById,
    buildSummonAllyCombatant,
    resetAoePlacement,
    notifyLogAppendedFromIntentSuccess,
    syncPersistedAfterApply,
  ])

  function handleResetEncounter() {
    setEncounterState(null)
  }

  function parsePositiveAmount(value: string): number | null {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) return null
    return Math.floor(parsed)
  }

  function parseDurationTurns(value: string): number | undefined {
    if (value.trim() === '') return undefined
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined
    return Math.floor(parsed)
  }

  function handleApplyDamage() {
    const amount = parsePositiveAmount(damageAmount)
    if (!encounterState || !controlTargetId || amount == null) return
    setEncounterState(
      applyDamageToCombatant(encounterState, controlTargetId, amount, {
        damageType: damageTypeInput.trim() || undefined,
      }),
    )
  }

  function handleApplyHealing() {
    const amount = parsePositiveAmount(healingAmount)
    if (!encounterState || !controlTargetId || amount == null) return
    setEncounterState(applyHealingToCombatant(encounterState, controlTargetId, amount))
  }

  function handleAddCondition() {
    if (!encounterState || !controlTargetId) return
    setEncounterState(
      addConditionToCombatant(encounterState, controlTargetId, conditionInput, {
        durationTurns: parseDurationTurns(markerDurationTurns),
        tickOn: markerDurationBoundary,
      }),
    )
  }

  function handleRemoveCondition() {
    if (!encounterState || !controlTargetId) return
    setEncounterState(removeConditionFromCombatant(encounterState, controlTargetId, conditionInput))
  }

  function handleAddState() {
    if (!encounterState || !controlTargetId) return
    setEncounterState(
      addStateToCombatant(encounterState, controlTargetId, stateInput, {
        durationTurns: parseDurationTurns(markerDurationTurns),
        tickOn: markerDurationBoundary,
      }),
    )
  }

  function handleRemoveState() {
    if (!encounterState || !controlTargetId) return
    setEncounterState(removeStateFromCombatant(encounterState, controlTargetId, stateInput))
  }

  function handleTriggerReducedToZeroHook() {
    if (!encounterState || !controlTargetId || !controlTargetCombatant || !controlTargetMonster) return
    if (controlTargetCombatant.stats.currentHitPoints > 0) return
    if (controlTargetReducedToZeroTraits.length === 0) return

    let nextState = encounterState

    controlTargetReducedToZeroTraits.forEach((trait) => {
      nextState = triggerManualHook(nextState, controlTargetId, trait.name, trait.effects ?? [], {
        details: 'Manual reduced_to_0_hp event.',
        saveOutcome: reducedToZeroSaveOutcome,
      })
    })

    setEncounterState(nextState)
  }

  function handleMonsterFormChange(runtimeId: string, form: MonsterFormContext) {
    setMonsterFormsById((prev) => ({
      ...prev,
      [runtimeId]: form,
    }))
  }

  function handleMoveCombatant(targetCellId: string) {
    const prev = encounterStateRef.current
    const moverId = prev?.activeCombatantId
    if (!prev || !moverId) {
      if (import.meta.env.DEV && encounterState) {
        console.error('handleMoveCombatant: encounterStateRef is null but encounterState exists — ref sync is missing')
      }
      return
    }
    const intent: CombatIntent = {
      kind: 'move-combatant',
      combatantId: moverId,
      destinationCellId: targetCellId,
    }
    const context: ApplyCombatIntentContext = {
      moveCombatantSpellContext:
        spellsById != null
          ? { spellLookup: (id) => spellsById[id], suppressSameSideHostile }
          : undefined,
      spatialEntryAfterMove:
        spellsById != null
          ? {
              spellLookup: (id) => spellsById[id],
              suppressSameSideHostile,
              monstersById,
            }
          : undefined,
    }
    const result = applyCombatIntent(prev, intent, context)
    if (!result.ok) return
    encounterStateRef.current = result.nextState
    setEncounterState(result.nextState)
    notifyLogAppendedFromIntentSuccess(result)
    syncPersistedAfterApply(intent, context)
  }

  function handleMonsterManualTriggerChange(
    runtimeId: string,
    trigger: keyof ManualMonsterTriggerContext,
    active: boolean,
  ) {
    setMonsterManualTriggersById((prev) => ({
      ...prev,
      [runtimeId]: {
        ...DEFAULT_MANUAL_MONSTER_TRIGGER_CONTEXT,
        ...prev[runtimeId],
        [trigger]: active,
      },
    }))
  }

  return {
    encounterState,
    activeCombatantId,
    activeCombatant,
    availableActions,
    availableActionTargets,
    selectedActionId,
    setSelectedActionId,
    selectedCasterOptions,
    setSelectedCasterOptions,
    selectedSingleCellPlacementCellId,
    setSelectedSingleCellPlacementCellId,
    singleCellPlacementHoverCellId,
    setSingleCellPlacementHoverCellId,
    selectedActionTargetId,
    setSelectedActionTargetId,
    aoeStep,
    setAoeStep,
    aoeOriginCellId,
    setAoeOriginCellId,
    aoeHoverCellId,
    setAoeHoverCellId,
    resetAoePlacement,
    unaffectedCombatantIds,
    setUnaffectedCombatantIds,
    selectedObjectAnchorId,
    setSelectedObjectAnchorId,
    objectAnchorHoverCellId,
    setObjectAnchorHoverCellId,
    unresolvedCombatantCount,
    selectedCombatants,
    controlTargetId,
    setControlTargetId,
    damageAmount,
    setDamageAmount,
    damageTypeInput,
    setDamageTypeInput,
    healingAmount,
    setHealingAmount,
    conditionInput,
    setConditionInput,
    stateInput,
    setStateInput,
    markerDurationTurns,
    setMarkerDurationTurns,
    markerDurationBoundary,
    setMarkerDurationBoundary,
    environmentContext,
    setEnvironmentContext,
    monsterFormsById,
    monsterManualTriggersById,
    reducedToZeroSaveOutcome,
    setReducedToZeroSaveOutcome,
    controlTargetHasReducedToZeroSave,
    canTriggerReducedToZeroHook,
    handleResolvedCombatant,
    handleStartEncounter,
    handleNextTurn,
    handleResolveAction,
    handleResetEncounter,
    handleApplyDamage,
    handleApplyHealing,
    handleAddCondition,
    handleRemoveCondition,
    handleAddState,
    handleRemoveState,
    handleTriggerReducedToZeroHook,
    handleMoveCombatant,
    handleMonsterFormChange,
    handleMonsterManualTriggerChange,
    registerCombatLogAppended,
  }
}
