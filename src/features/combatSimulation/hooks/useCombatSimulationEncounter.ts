import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  addConditionToCombatant,
  addStateToCombatant,
  advanceEncounterTurn,
  applyDamageToCombatant,
  applyHealingToCombatant,
  buildReducedToZeroTraits,
  createEncounterState,
  DEFAULT_MANUAL_MONSTER_TRIGGER_CONTEXT,
  getCombatantAvailableActions,
  removeConditionFromCombatant,
  resolveCombatAction,
  removeStateFromCombatant,
  triggerManualHook,
  type CombatantInstance,
  type EncounterState,
  type ManualEnvironmentContext,
  type ManualMonsterTriggerContext,
  type MonsterFormContext,
} from '@/features/mechanics/domain/encounter'
import type { Monster } from '@/features/content/monsters/domain/types'

import type { EnemyRosterEntry } from '../types'

type UseCombatSimulationEncounterArgs = {
  selectedCombatantIds: string[]
  enemyRoster: EnemyRosterEntry[]
  monstersById: Record<string, Monster>
}

export function useCombatSimulationEncounter({
  selectedCombatantIds,
  enemyRoster,
  monstersById,
}: UseCombatSimulationEncounterArgs) {
  const [resolvedCombatantsById, setResolvedCombatantsById] = useState<Record<string, CombatantInstance>>({})
  const [encounterState, setEncounterState] = useState<EncounterState | null>(null)
  const [controlTargetId, setControlTargetId] = useState('')
  const [damageAmount, setDamageAmount] = useState('5')
  const [damageTypeInput, setDamageTypeInput] = useState('fire')
  const [healingAmount, setHealingAmount] = useState('5')
  const [conditionInput, setConditionInput] = useState('poisoned')
  const [stateInput, setStateInput] = useState('concentrating')
  const [markerDurationTurns, setMarkerDurationTurns] = useState('1')
  const [markerDurationBoundary, setMarkerDurationBoundary] = useState<'start' | 'end'>('end')
  const [environmentContext, setEnvironmentContext] = useState<ManualEnvironmentContext>('none')
  const [monsterFormsById, setMonsterFormsById] = useState<Record<string, MonsterFormContext>>({})
  const [monsterManualTriggersById, setMonsterManualTriggersById] = useState<
    Record<string, ManualMonsterTriggerContext>
  >({})
  const [reducedToZeroSaveOutcome, setReducedToZeroSaveOutcome] = useState<'success' | 'fail'>('success')
  const [selectedActionId, setSelectedActionId] = useState('')
  const [selectedActionTargetId, setSelectedActionTargetId] = useState('')

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
  const availableActionTargets = useMemo(() => {
    if (!encounterState || !activeCombatant) return []

    return encounterState.initiativeOrder
      .map((combatantId) => encounterState.combatantsById[combatantId])
      .filter(
        (combatant): combatant is CombatantInstance =>
          Boolean(combatant) &&
          combatant.side !== activeCombatant.side &&
          combatant.stats.currentHitPoints > 0,
      )
      .map((combatant) => ({
        id: combatant.instanceId,
        label: combatant.source.label,
      }))
  }, [activeCombatant, encounterState])
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
    const validIds = new Set(selectedCombatantIds)

    setResolvedCombatantsById((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([combatantId]) => validIds.has(combatantId)),
      ),
    )
    setEncounterState(null)
  }, [selectedCombatantIds])

  useEffect(() => {
    const validMonsterIds = new Set(
      enemyRoster.filter((entry) => entry.kind === 'monster').map((entry) => entry.runtimeId),
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
  }, [enemyRoster])

  useEffect(() => {
    setEncounterState(null)
  }, [environmentContext, monsterFormsById, monsterManualTriggersById])

  useEffect(() => {
    if (!encounterState) {
      setControlTargetId('')
      setSelectedActionId('')
      setSelectedActionTargetId('')
      return
    }

    const validIds = new Set(encounterState.initiativeOrder)
    if (!controlTargetId || !validIds.has(controlTargetId)) {
      setControlTargetId(encounterState.activeCombatantId ?? encounterState.initiativeOrder[0] ?? '')
    }
  }, [controlTargetId, encounterState])

  useEffect(() => {
    const nextActionId = availableActions[0]?.id ?? ''
    if (!selectedActionId || !availableActions.some((action) => action.id === selectedActionId)) {
      setSelectedActionId(nextActionId)
    }
  }, [availableActions, selectedActionId])

  useEffect(() => {
    const validTargetIds = new Set(availableActionTargets.map((target) => target.id))
    if (!selectedActionTargetId || !validTargetIds.has(selectedActionTargetId)) {
      setSelectedActionTargetId(availableActionTargets[0]?.id ?? '')
    }
  }, [availableActionTargets, selectedActionTargetId])

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

  function handleStartEncounter() {
    if (selectedCombatants.length === 0 || unresolvedCombatantCount > 0) return
    setEncounterState(createEncounterState(selectedCombatants))
  }

  function handleNextTurn() {
    setEncounterState((prev) => (prev ? advanceEncounterTurn(prev) : prev))
  }

  function handleResolveAction() {
    if (!encounterState || !activeCombatantId || !selectedActionId) return

    setEncounterState(
      resolveCombatAction(encounterState, {
        actorId: activeCombatantId,
        targetId: selectedActionTargetId || undefined,
        actionId: selectedActionId,
      }),
    )
  }

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
    selectedActionTargetId,
    setSelectedActionTargetId,
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
    handleMonsterFormChange,
    handleMonsterManualTriggerChange,
  }
}
