import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { TurnBoundary } from '@/features/mechanics/domain/effects/timing.types'
import {
  addConditionToCombatant,
  addStateToCombatant,
  advanceEncounterTurn,
  applyDamageToCombatant,
  applyHealingToCombatant,
  buildReducedToZeroTraits,
  createEncounterState,
  DEFAULT_MANUAL_MONSTER_TRIGGER_CONTEXT,
  getActionTargetCandidates,
  getCombatantAvailableActions,
  removeConditionFromCombatant,
  resolveCombatAction,
  removeStateFromCombatant,
  triggerManualHook,
  type CombatantInstance,
  type CombatLogEvent,
  type EncounterState,
  type ManualEnvironmentContext,
  type ManualMonsterTriggerContext,
  type MonsterFormContext,
} from '@/features/mechanics/domain/encounter'
import { getCombatantDisplayLabel } from '@/features/mechanics/domain/encounter/state'
import { buildDefaultCasterOptions } from '@/features/mechanics/domain/spells/caster-options'
import type { Armor } from '@/features/content/equipment/armor/domain/types/armor.types'
import type { Weapon } from '@/features/content/equipment/weapons/domain/types/weapon.types'
import type { Monster } from '@/features/content/monsters/domain/types'
import { buildSummonAllyMonsterCombatant } from '../helpers/encounter-helpers'
import type { AoeStep } from '../helpers/area-grid-action'

import type { OpponentRosterEntry } from '../types'
import type { EncounterSpace, InitialPlacementOptions } from '../space'
import { moveCombatant } from '../space'

type UseEncounterStateArgs = {
  selectedCombatantIds: string[]
  opponentRoster: OpponentRosterEntry[]
  monstersById: Record<string, Monster>
  weaponsById?: Record<string, Weapon>
  armorById?: Record<string, Armor>
}

export function useEncounterState({
  selectedCombatantIds,
  opponentRoster,
  monstersById,
  weaponsById,
  armorById,
}: UseEncounterStateArgs) {
  const [resolvedCombatantsById, setResolvedCombatantsById] = useState<Record<string, CombatantInstance>>({})
  const [encounterState, setEncounterState] = useState<EncounterState | null>(null)
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

  const resetAoePlacement = useCallback(() => {
    setAoeStep('none')
    setAoeOriginCellId(null)
    setAoeHoverCellId(null)
  }, [])

  const combatLogAppendedRef = useRef<
    ((events: CombatLogEvent[], state: EncounterState) => void) | undefined
  >(undefined)
  const registerCombatLogAppended = useCallback(
    (fn: ((events: CombatLogEvent[], state: EncounterState) => void) | undefined) => {
      combatLogAppendedRef.current = fn
    },
    [],
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
  }, [opponentRoster])

  useEffect(() => {
    setEncounterState(null)
  }, [environmentContext, monsterFormsById, monsterManualTriggersById])

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
    setSelectedCasterOptions(buildDefaultCasterOptions(action?.casterOptions))
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
  }) {
    if (selectedCombatants.length === 0 || unresolvedCombatantCount > 0) return
    setEncounterState(
      createEncounterState(selectedCombatants, {
        space: opts?.space,
        placementOptions: opts?.placementOptions,
      }),
    )
  }

  function handleNextTurn() {
    setEncounterState((prev) => (prev ? advanceEncounterTurn(prev) : prev))
  }

  const handleResolveAction = useCallback(() => {
    setEncounterState((prev) => {
      if (!prev || !prev.activeCombatantId || !selectedActionId) return prev
      const startLen = prev.log.length
      const next = resolveCombatAction(
        prev,
        {
          actorId: prev.activeCombatantId,
          targetId: selectedActionTargetId || undefined,
          actionId: selectedActionId,
          casterOptions: selectedCasterOptions,
          aoeOriginCellId: aoeOriginCellId || undefined,
        },
        { monstersById, buildSummonAllyCombatant },
      )
      const appended = next.log.slice(startLen)
      if (appended.length > 0) {
        queueMicrotask(() => combatLogAppendedRef.current?.(appended, next))
      }
      return next
    })
    resetAoePlacement()
    setSelectedActionId('')
    setSelectedActionTargetId('')
  }, [
    selectedActionId,
    selectedActionTargetId,
    selectedCasterOptions,
    aoeOriginCellId,
    monstersById,
    buildSummonAllyCombatant,
    resetAoePlacement,
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
    if (!encounterState || !activeCombatantId) return
    setEncounterState(moveCombatant(encounterState, activeCombatantId, targetCellId))
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
    selectedActionTargetId,
    setSelectedActionTargetId,
    aoeStep,
    setAoeStep,
    aoeOriginCellId,
    setAoeOriginCellId,
    aoeHoverCellId,
    setAoeHoverCellId,
    resetAoePlacement,
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
