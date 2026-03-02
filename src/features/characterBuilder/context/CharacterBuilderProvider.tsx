import { useMemo, useEffect, useCallback, useState, type PropsWithChildren } from "react"
import CharacterBuilderContext from './CharacterBuilderContext'
import type { CharacterBuilderState, CharacterClassInfo, StepId, AbilityScoreSource, AbilityScoresStatus } from '../types'
import type { CharacterProficiencies, EquipmentItemInstance, AbilityScores } from '@/shared/types/character.core'
import type { InvalidationResult, InvalidationItem } from '@/features/mechanics/domain/character-build/invalidation'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'

import {
  detectInvalidations,
  resolveInvalidations,
  INVALIDATION_RULES,
} from '@/features/mechanics/domain/character-build/invalidation'
import {
  getStepConfig,
  createInitialBuilderState,
  INITIAL_ABILITY_SCORES,
  DEFAULT_ABILITY_KEYS,
} from '../constants'
import {
  generateAbilityScores,
} from '@/features/mechanics/domain/generation/ability-scores'
import { 
  getSubclassUnlockLevel,
  getXpForLevel,
} from '@/features/mechanics/domain/progression'
import {
  calculateEquipmentWeight,
  calculateEquipmentCostCp,
  normalizeEquipmentInstances,
} from '@/features/equipment/domain'
import { moneyToCp, cpToDenoms } from '@/shared/money'
import type { CharacterType } from "@/shared/types/character.core"

export const CharacterBuilderProvider = ({ children }: PropsWithChildren) => {
  const { ruleset, catalog } = useCampaignRules()
  const weaponsData = Object.values(catalog.weaponsById)
  const armorData = Object.values(catalog.armorById)
  const gearData = Object.values(catalog.gearById)
  const xpTable = ruleset.mechanics.progression.experience

  const [state, setState] = useState<CharacterBuilderState>(
    () => createInitialBuilderState('pc')
  )

  useEffect(() => {
    //console.groupCollapsed('🧙 Character Builder State')
    console.log(state)
    //console.groupEnd()
  }, [state])

  const updateState = (
    updater: (state: CharacterBuilderState) => CharacterBuilderState
  ) => setState(updater)

  // ---------------------------------------------------------------------------
  // Invalidation guard
  // ---------------------------------------------------------------------------

  /** Pending state change awaiting user confirmation. */
  const [pendingChange, setPendingChange] = useState<{
    updater: (s: CharacterBuilderState) => CharacterBuilderState
    invalidations: InvalidationResult
  } | null>(null)

  /** Per-step notices from the most recent confirmed invalidation. */
  const [stepNotices, setStepNotices] = useState<Map<StepId, InvalidationItem[]>>(
    () => new Map()
  )

  /**
   * Wrap a state updater with invalidation detection.
   *
   * If the proposed change would invalidate downstream data, the change is
   * held in `pendingChange` and the confirmation dialog opens.  Otherwise
   * the change is applied immediately.
   */
  const guardedUpdate = useCallback(
    (updater: (s: CharacterBuilderState) => CharacterBuilderState) => {
      setState(prev => {
        const next = updater(prev)

        // If the updater returned the same reference, nothing changed
        if (next === prev) return prev

        const result = detectInvalidations(INVALIDATION_RULES, prev, next)

        if (result.hasInvalidations) {
          // Don't apply yet — queue for user confirmation.
          // Use setTimeout so we don't call setState inside setState.
          setTimeout(() => setPendingChange({ updater, invalidations: result }), 0)
          return prev
        }

        return next
      })
    },
    []
  )

  /** User confirmed the pending change — apply it and resolve invalidations. */
  const confirmChange = useCallback(() => {
    if (!pendingChange) return

    setState(prev => {
      const next = pendingChange.updater(prev)
      const result = detectInvalidations(INVALIDATION_RULES, prev, next)
      const resolved = resolveInvalidations(INVALIDATION_RULES, next, result)

      // Build per-step notices from the invalidation result.
      // Multiple rules can target the same step (e.g. level→spells and
      // class→spells), so deduplicate items within each step by id.
      const notices = new Map<StepId, InvalidationItem[]>()
      for (const inv of result.affected) {
        const existing = notices.get(inv.stepId) ?? []
        notices.set(inv.stepId, [...existing, ...inv.items])
      }
      for (const [stepId, items] of notices) {
        const seen = new Set<string>()
        notices.set(stepId, items.filter(item => {
          if (seen.has(item.id)) return false
          seen.add(item.id)
          return true
        }))
      }

      // Replace (not merge) — each confirmation represents a fresh set of notices
      setStepNotices(notices)

      return resolved
    })

    setPendingChange(null)
  }, [pendingChange])

  /** User cancelled the pending change. */
  const cancelChange = useCallback(() => {
    setPendingChange(null)
  }, [])

  /** Dismiss the invalidation notice for a specific step. */
  const dismissNotice = useCallback((stepId: StepId) => {
    setStepNotices(prev => {
      const next = new Map(prev)
      next.delete(stepId)
      return next
    })
  }, [])

  const setCharacterType = (type: CharacterType) =>
    updateState(s => ({ ...s, type }))

  const openBuilder = (
    mode: CharacterType,
    overrides?: import('../types').BuilderOverrides,
  ) => {
    setState(createInitialBuilderState(mode, overrides))
  }

  const loadCharacterIntoBuilder = (
    character: import('@/shared').CharacterSheet & {
      _id?: string
      name?: string
    },
    stepId: import('../types').StepId,
  ) => {
    const mode = (character.type ?? 'pc') as CharacterType
    const config = getStepConfig(mode)
    const stepIndex = config.findIndex(s => s.id === stepId)
    const step = stepIndex >= 0
      ? { id: config[stepIndex].id, name: config[stepIndex].label }
      : { id: stepId, name: stepId }

    // Normalize: backfill classId from deprecated top-level `class` field
    const rawClasses = character.classes?.length ? character.classes : [{ level: character.level ?? 1 }]
    const classes = rawClasses.map((cls, i) => ({
      ...cls,
      classId: cls.classId ?? (i === 0 ? character.class : undefined),
    }))

    // Lock existing skill selections so edit mode only allows adding new ones
    const lockedSelections: Record<string, string[]> = {}
    const existingSkills = character.proficiencies?.skills ?? []
    if (existingSkills.length > 0) {
      lockedSelections['skills'] = [...existingSkills]
    }

    const loadedScores: AbilityScores = character.abilityScores
      ? { ...INITIAL_ABILITY_SCORES, ...character.abilityScores }
      : { ...INITIAL_ABILITY_SCORES };

    setState({
      step,
      type: mode,
      name: character.name,
      hitPointMode: 'average',
      race: character.race,
      alignment: character.alignment,
      classes,
      activeClassIndex: 0,
      totalLevel: character.totalLevel ?? character.level ?? 1,
      xp: character.xp ?? 0,
      abilityScores: loadedScores,
      abilityScoreSource: character.abilityScores ? 'import_manual' : undefined,
      abilityScoresStatus: deriveAbilityScoresStatus(loadedScores),
      flowMode: 'isolated',
      equipment: normalizeEquipmentInstances(character.equipment ?? { armor: [], weapons: [], gear: [], weight: 0 }),
      proficiencies: character.proficiencies ?? { skills: [] },
      spells: character.spells ?? [],
      wealth: character.wealth ?? { gp: 0, sp: 0, cp: 0, baseBudget: null },
      editMode: { characterId: character._id ?? '', stepId, lockedSelections },
    })
  }


  const setName = (name: string) =>
    updateState(s => ({ ...s, name }))


  const setRace = (race: string) =>
    guardedUpdate(s => ({ ...s, race }))

  const updateActiveClass = (
    updater: (cls: CharacterClassInfo) => CharacterClassInfo
  ) =>
    setState(s => {
      const index = s.activeClassIndex

      if (index == null || !s.classes[index]) return s

      const classes = [...s.classes]
      classes[index] = updater(classes[index])

      return { ...s, classes }
    })

  const setClassId = (classId: string) =>
    guardedUpdate(s => {
      const index = s.activeClassIndex
      if (index == null || !s.classes[index]) return s

      const classes = [...s.classes]
      classes[index] = { ...classes[index], classId }

      // Recalculate XP when the *primary* class changes.
      // Pre-3e editions have class-specific XP tables, so XP can only be
      // resolved once we know which class the character is.  The Level step
      // runs before the Class step, so setTotalLevels may have set xp to 0
      // if classId wasn't available yet — this corrects it.
      const isPrimaryClass = index === 0
      const xp = isPrimaryClass && s.totalLevel
        ? getXpForLevel(s.totalLevel, xpTable)
        : s.xp

      return { ...s, classes, xp: xp ?? s.xp }
    })

  const setClassDefinitionId = (classDefinitionId: string) =>
    updateActiveClass(cls => ({ ...cls, classDefinitionId }))

  const setClassLevel = (index: number, level: number) =>
    setState(s => {
      const classes = [...s.classes]
      const current = classes[index]

      if (!current) return s

      const nextLevel = Math.max(1, level)

      const currentAllocated =
        s.classes.reduce((sum, cls, i) =>
          i === index ? sum : sum + (cls.level ?? 0), 0)

      if (currentAllocated + nextLevel > (s.totalLevel ?? 0)) {
        return s // reject change
      }

      classes[index] = {
        ...current,
        level: nextLevel
      }

      return { ...s, classes }
    })

  const updateClassLevel = (index: number, level: number) =>
    updateState(s => {
      const cls = s.classes[index]
      if (!cls || level < 1) return s

      const otherLevels = s.classes.reduce(
        (sum, c, i) => (i === index ? sum : sum + c.level),
        0
      )

      if (otherLevels + level > (s.totalLevel ?? 0)) return s

      const unlockLevel = getSubclassUnlockLevel(cls.classId)

      const classDefinitionId =
        unlockLevel && level < unlockLevel
          ? undefined
          : cls.classDefinitionId

      const classes = [...s.classes]
      classes[index] = {
        ...cls,
        level,
        classDefinitionId
      }

      return { ...s, classes }
    })

  const allocateRemainingLevels = () => {
    setState(s => {
      const index = s.activeClassIndex
      if (index == null) return s // nothing active

      const allocatedLevels = s.classes.reduce(
        (sum, cls) => sum + (cls.level ?? 0),
        0
      )
      const remaining = (s.totalLevel ?? 0) - allocatedLevels
      if (remaining <= 0) return s // nothing to allocate

      const updatedClasses = [...s.classes]
      updatedClasses[index] = {
        ...updatedClasses[index],
        level: (updatedClasses[index].level ?? 0) + remaining
      }

      return { ...s, classes: updatedClasses }
    })
  }

  const isEmptySecondaryClass = (cls: CharacterClassInfo, index: number) =>
    index > 0 &&
    !cls.classId &&
    !cls.classDefinitionId &&
    cls.level === 1

  const setActiveClassIndex = (index: number | null) => {
    setState(prev => {
      const classes = [...prev.classes]

      const cleanedClasses = classes.filter(
        (cls, i) => !isEmptySecondaryClass(cls, i)
      )

      return {
        ...prev,
        classes: cleanedClasses,
        activeClassIndex:
          index == null
            ? null
            : Math.min(index, cleanedClasses.length - 1)
      }
    })
  }


  const updateClassDefinition = (index: number, subclassId?: string) =>
    updateState(s => {
      const cls = s.classes[index]
      if (!cls) return s

      const unlockLevel = getSubclassUnlockLevel(cls.classId)

      // Cannot set subclass before unlock
      if (subclassId && unlockLevel && cls.level < unlockLevel) {
        return s
      }

      const classes = [...s.classes]
      classes[index] = {
        ...cls,
        classDefinitionId: subclassId
      }

      return { ...s, classes }
    })

  const addClass = () =>
    setState(s => {
      const allocated = s.classes.reduce(
        (sum, cls) => sum + (cls.level ?? 0),
        0
      )

      if (allocated >= (s.totalLevel ?? 0)) return s

      const newClass: CharacterClassInfo = {
        level: 1
      }

      return {
        ...s,
        classes: [...s.classes, newClass],
        activeClassIndex: s.classes.length
      }
    })

  const removeClass = (index: number) =>
    updateState(s => {
      if (s.classes.length <= 1) return s
      if (index < 0 || index >= s.classes.length) return s

      const classes = s.classes.filter((_, i) => i !== index)

      let activeClassIndex = s.activeClassIndex ?? 0

      if (index === activeClassIndex) {
        activeClassIndex = Math.max(0, index - 1)
      } else if (index < activeClassIndex) {
        activeClassIndex -= 1
      }

      return {
        ...s,
        classes,
        activeClassIndex
      }
    })

  const allocatedLevels = useMemo(
    () => state.classes.reduce((sum, cls) => sum + (cls.level ?? 0), 0),
    [state.classes]
  )

  const remainingLevels = useMemo(
    () => Math.max(0, (state.totalLevel ?? 0) - allocatedLevels),
    [state.totalLevel, allocatedLevels]
  )

  const setXp = (xp: number) =>
    updateState(s => ({ ...s, xp }))

  const setTotalLevels = (totalLevel: number) =>
    guardedUpdate(s => {
      // Pass primary class ID so pre-3e editions resolve to the correct
      // class-specific XP table.  Universal-table editions ignore it.
      const newXp = getXpForLevel(totalLevel, xpTable)

      // Clamp existing class allocations so they don't exceed the new total
      let budget = totalLevel
      const classes = s.classes
        .map((cls, i) => {
          // Primary class always keeps at least 1 level
          const min = i === 0 ? 1 : 0
          const level = Math.max(min, Math.min(cls.level, budget))
          budget -= level
          return { ...cls, level }
        })
        // Drop secondary classes that ended up with 0 levels
        .filter((cls, i) => i === 0 || cls.level > 0)

      return { ...s, totalLevel, xp: newXp, classes }
    })

  const setAlignment = (alignment: string) =>
    guardedUpdate(s => ({ ...s, alignment }))

  const setHitPointMode = (hitPointMode: CharacterBuilderState['hitPointMode']) =>
    updateState(s => ({ ...s, hitPointMode }))

  // ---------------------------------------------------------------------------
  // Ability scores
  // ---------------------------------------------------------------------------

  const deriveAbilityScoresStatus = (scores: AbilityScores): AbilityScoresStatus => {
    const vals = Object.values(scores);
    if (vals.length === 0 || vals.every(v => v == null)) return 'unset';
    if (vals.every(v => v != null)) return 'complete';
    return 'partial';
  };

  const setAbilityScores = (patch: Partial<AbilityScores>) =>
    updateState(s => {
      const merged = { ...s.abilityScores, ...patch };
      return { ...s, abilityScores: merged, abilityScoresStatus: deriveAbilityScoresStatus(merged) };
    });

  const setAbilityScore = (abilityId: string, value: number | null) =>
    setAbilityScores({ [abilityId]: value });

  const setAbilityScoreSource = (abilityScoreSource: AbilityScoreSource) =>
    updateState(s => ({ ...s, abilityScoreSource }));

  const rollAbilityScores = () =>
    updateState(s => {
      const allNull = DEFAULT_ABILITY_KEYS.every(k => s.abilityScores[k] == null);
      if (!allNull) return s;
      const rolled = generateAbilityScores('4d6-drop-lowest');
      return { ...s, abilityScores: rolled, abilityScoresStatus: 'complete' as const };
    });

  // ---------------------------------------------------------------------------
  // Character source actions
  // ---------------------------------------------------------------------------

  const advanceFromSource = (source: AbilityScoreSource) => {
    setState(s => {
      const updated = { ...s, abilityScoreSource: source };
      const config = getStepConfig(updated.type ?? 'pc');
      const currentIdx = config.findIndex(step => step.id === s.step.id);
      let nextIdx = currentIdx + 1;
      while (nextIdx < config.length && config[nextIdx]?.shouldSkip?.(updated)) {
        nextIdx++;
      }
      const next = config[Math.min(nextIdx, config.length - 1)];
      return { ...updated, step: { id: next.id, name: next.label } };
    });
  };

  const chooseImportCharacter = () => advanceFromSource('import_manual');
  const chooseGenerateCharacter = () => advanceFromSource('generated_roll');

  const setProficiencies = (proficiencies: CharacterProficiencies) =>
    updateState(s => ({ ...s, proficiencies }))

  const setSpells = (spells: string[]) =>
    updateState(s => ({ ...s, spells }))

  const setWealth = (wealth: {
    gp?: number | null
    sp?: number | null
    cp?: number | null
    baseBudget?: import('@/shared/money/types').Money | null
  }) => {
    setState(prev => {
      const baseBudget = wealth.baseBudget ?? prev.wealth?.baseBudget ?? null
      return {
        ...prev,
        wealth: {
          gp: wealth.gp ?? prev.wealth?.gp ?? null,
          sp: wealth.sp ?? prev.wealth?.sp ?? null,
          cp: wealth.cp ?? prev.wealth?.cp ?? null,
          baseBudget,
        },
      }
    })
  }

  const computeEquipmentTotals = useCallback(
    (weaponIds: string[], armorIds: string[], gearIds: string[]) => ({
      weight: calculateEquipmentWeight(weaponIds, armorIds, gearIds, weaponsData, armorData, gearData),
      equipmentCostCp: calculateEquipmentCostCp(weaponIds, armorIds, gearIds, weaponsData, armorData, gearData),
    }),
    [weaponsData, armorData, gearData],
  )

  const updateWeapons = (weaponIds: string[]) => {
    setState(prev => {
      const armorIds = prev.equipment?.armor ?? []
      const gearIds = prev.equipment?.gear ?? []
      const { weight, equipmentCostCp } = computeEquipmentTotals(weaponIds, armorIds, gearIds)
      const baseCp = moneyToCp(prev.wealth?.baseBudget ?? undefined)
      const remainingCp = Math.max(baseCp - equipmentCostCp, 0)
      const remaining = cpToDenoms(remainingCp)

      return {
        ...prev,
        equipment: normalizeEquipmentInstances({ ...prev.equipment, weapons: weaponIds, weight }),
        wealth: { ...prev.wealth, gp: remaining.gp, sp: remaining.sp, cp: remaining.cp }
      }
    })
  }

  const updateArmor = (armorIds: string[]) => {
    setState(prev => {
      const weaponIds = prev.equipment?.weapons ?? []
      const gearIds = prev.equipment?.gear ?? []
      const { weight, equipmentCostCp } = computeEquipmentTotals(weaponIds, armorIds, gearIds)
      const baseCp = moneyToCp(prev.wealth?.baseBudget ?? undefined)
      const remainingCp = Math.max(baseCp - equipmentCostCp, 0)
      const remaining = cpToDenoms(remainingCp)

      return {
        ...prev,
        equipment: normalizeEquipmentInstances({ ...prev.equipment, armor: armorIds, weight }),
        wealth: { ...prev.wealth, gp: remaining.gp, sp: remaining.sp, cp: remaining.cp }
      }
    })
  }

  const updateGear = (gearIds: string[]) => {
    setState(prev => {
      const weaponIds = prev.equipment?.weapons ?? []
      const armorIds = prev.equipment?.armor ?? []
      const { weight, equipmentCostCp } = computeEquipmentTotals(weaponIds, armorIds, gearIds)
      const baseCp = moneyToCp(prev.wealth?.baseBudget ?? undefined)
      const remainingCp = Math.max(baseCp - equipmentCostCp, 0)
      const remaining = cpToDenoms(remainingCp)

      return {
        ...prev,
        equipment: { ...prev.equipment, gear: gearIds, weight },
        wealth: { ...prev.wealth, gp: remaining.gp, sp: remaining.sp, cp: remaining.cp }
      }
    })
  }

  const updateMagicItems = (magicItemIds: string[]) => {
    setState(prev => ({
      ...prev,
      equipment: { ...prev.equipment, magicItems: magicItemIds }
    }))
  }

  // ---------------------------------------------------------------------------
  // Equipment instance management
  // ---------------------------------------------------------------------------

  let instanceCounter = 0
  const nextInstanceId = () => `inst_${Date.now()}_${++instanceCounter}`

  const addWeaponInstance = (baseId: string) => {
    setState(prev => {
      const existing = prev.equipment?.weaponInstances ?? []
      const inst: EquipmentItemInstance = { instanceId: nextInstanceId(), baseId }
      return {
        ...prev,
        equipment: { ...prev.equipment, weaponInstances: [...existing, inst] },
      }
    })
  }

  const addArmorInstance = (baseId: string) => {
    setState(prev => {
      const existing = prev.equipment?.armorInstances ?? []
      const inst: EquipmentItemInstance = { instanceId: nextInstanceId(), baseId }
      return {
        ...prev,
        equipment: { ...prev.equipment, armorInstances: [...existing, inst] },
      }
    })
  }

  const updateWeaponInstance = (instanceId: string, patch: Partial<EquipmentItemInstance>) => {
    setState(prev => {
      const instances = prev.equipment?.weaponInstances
      if (!instances) return prev
      return {
        ...prev,
        equipment: {
          ...prev.equipment,
          weaponInstances: instances.map(i =>
            i.instanceId === instanceId ? { ...i, ...patch, instanceId } : i,
          ),
        },
      }
    })
  }

  const updateArmorInstance = (instanceId: string, patch: Partial<EquipmentItemInstance>) => {
    setState(prev => {
      const instances = prev.equipment?.armorInstances
      if (!instances) return prev
      return {
        ...prev,
        equipment: {
          ...prev.equipment,
          armorInstances: instances.map(i =>
            i.instanceId === instanceId ? { ...i, ...patch, instanceId } : i,
          ),
        },
      }
    })
  }

  const removeWeaponInstance = (instanceId: string) => {
    setState(prev => {
      const instances = prev.equipment?.weaponInstances
      if (!instances) return prev
      return {
        ...prev,
        equipment: {
          ...prev.equipment,
          weaponInstances: instances.filter(i => i.instanceId !== instanceId),
        },
      }
    })
  }

  const removeArmorInstance = (instanceId: string) => {
    setState(prev => {
      const instances = prev.equipment?.armorInstances
      if (!instances) return prev
      return {
        ...prev,
        equipment: {
          ...prev.equipment,
          armorInstances: instances.filter(i => i.instanceId !== instanceId),
        },
      }
    })
  }

  const setWeight = (weight: number) => {
    updateState(s => ({
      ...s,
      equipment: { ...s.equipment, weight }
    }))
  }

  const updateLoadout = (patch: import('@/shared/types/character.core').EquipmentLoadout) => {
    setState(prev => ({
      ...prev,
      combat: {
        ...prev.combat,
        loadout: { ...prev.combat?.loadout, ...patch },
      },
    }))
  }

  const stepConfig = getStepConfig(state.type ?? 'pc')

  const getStepByIndex = (index: number) => {
    const step = stepConfig[Math.max(0, Math.min(index, stepConfig.length - 1))]
    return { id: step.id, name: step.label }
  }

  const getCurrentStepIndex = (stepId?: string) =>
    stepConfig.findIndex(step => step.id === stepId)

  const start = () =>
    updateState(s => ({ ...s, step: getStepByIndex(0) }))

  const nextStep = () => {
    // Clear notice for the step we're leaving
    dismissNotice(state.step.id)
    setState(s => {
      let nextIndex = getCurrentStepIndex(s.step?.id) + 1
      // Skip steps that should be skipped (e.g. SpellStep for non-casters)
      while (nextIndex < stepConfig.length && stepConfig[nextIndex]?.shouldSkip?.(s)) {
        nextIndex++
      }
      const nextStep = getStepByIndex(nextIndex)
      return { ...s, step: nextStep }
    })
    setActiveClassIndex(null)
  }

  const prevStep = () => {
    // Clear notice for the step we're leaving
    dismissNotice(state.step.id)
    setState(s => {
      let prevIndex = getCurrentStepIndex(s.step?.id) - 1
      // Skip steps that should be skipped (e.g. SpellStep for non-casters)
      while (prevIndex > 0 && stepConfig[prevIndex]?.shouldSkip?.(s)) {
        prevIndex--
      }
      const prevStep = getStepByIndex(prevIndex)
      return { ...s, step: prevStep }
    })
    setActiveClassIndex(null)
  }

  const goToStep = (stepId: string) => {
    // Clear notice for the step we're leaving
    dismissNotice(state.step.id)
    const config = getStepConfig(state.type ?? 'pc')
    const index = config.findIndex(s => s.id === stepId)
    if (index < 0) return
    setState(s => ({ ...s, step: getStepByIndex(index) }))
    setActiveClassIndex(null)
  }

  const resetState = () => {
    setState(
      createInitialBuilderState(state.type ?? 'pc')
    )
  }

  const isComplete = (state: CharacterBuilderState) =>
    getStepConfig(state.type ?? 'pc').every(step =>
      step.shouldSkip?.(state) || step.selector(state)
    )

  return (
    <CharacterBuilderContext.Provider
      value={{
        state,

        allocatedLevels,
        remainingLevels,

        loadCharacterIntoBuilder,
        setCharacterType,
        openBuilder,
        setName,
        setRace,

        setClassId,
        setClassDefinitionId,
        setClassLevel,
        setActiveClassIndex,
        addClass,
        removeClass,
        updateClassLevel,
        updateClassDefinition,
        updateSubclass: updateClassDefinition,
        allocateRemainingLevels,

        chooseImportCharacter,
        chooseGenerateCharacter,
        rollAbilityScores,
        setAbilityScores,
        setAbilityScore,
        setAbilityScoreSource,
        setHitPointMode,
        setProficiencies,
        setSpells,
        setWealth,

        updateWeapons,
        updateArmor,
        updateGear,
        updateMagicItems,
        setWeight,
        addWeaponInstance,
        addArmorInstance,
        updateWeaponInstance,
        updateArmorInstance,
        removeWeaponInstance,
        removeArmorInstance,
        updateLoadout,

        setAlignment,
        setTotalLevels,
        setXp,

        start,
        nextStep,
        prevStep,
        goToStep,
        resetState,
        isComplete,

        // invalidation
        stepNotices,
        pendingInvalidations: pendingChange?.invalidations ?? null,
        confirmChange,
        cancelChange,
        dismissNotice,
      }}
    >
      {children}
    </CharacterBuilderContext.Provider>
  )
}
