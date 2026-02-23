import {
  AlignmentStep,
  ConfirmationStep,
  ProficiencyStep,
  SettingStep,
  ClassStep,
  EditionStep,
  EquipmentStep,
  LoadoutStep,
  MagicItemsStep,
  LevelStep,
  RaceStep,
  SpellStep
} from '../steps'
import { type CharacterBuilderState, type StepId, type BuilderOverrides } from '../types'
import type { CharacterType } from '@/shared/types/character.core'
import type { EditionId, SettingId } from '@/data'
import { getClassProgression } from '@/features/mechanics/domain/progression'
import { getMagicItemBudget } from '@/features/equipment/domain'

// ---------------------------------------------------------------------------
// Step config
// ---------------------------------------------------------------------------

export interface StepConfig {
  id: StepId
  label: string
  component: () => React.JSX.Element | null
  selector: (state: CharacterBuilderState) => unknown
  shouldSkip?: (state: CharacterBuilderState) => boolean
  optional?: boolean
}

/** Returns true if at least one selected class has a spellProgression for the current edition. */
function isSpellcaster(state: CharacterBuilderState): boolean {
  return state.classes.some(cls => {
    if (!cls.classId || !state.edition) return false
    const prog = getClassProgression(cls.classId, state.edition)
    return prog?.spellProgression != null
  })
}

/** Returns true if a step is locked via overrides. */
function isLocked(state: CharacterBuilderState, stepId: StepId): boolean {
  return state.lockedFields?.has(stepId) ?? false
}

export function getStepConfig(mode: CharacterType): StepConfig[] {
  const baseSteps: StepConfig[] = [
    {
      id: 'race',
      label: 'Race',
      component: RaceStep,
      selector: (state: CharacterBuilderState) => state.race,
      shouldSkip: (state) => isLocked(state, 'race'),
    },
    {
      id: 'level',
      label: 'Level',
      component: LevelStep,
      selector: (state: CharacterBuilderState) => state.totalLevel
    },
    {
      id: 'class',
      label: 'Class',
      component: ClassStep,
      selector: (state: CharacterBuilderState) =>
        state.classes[0]?.classId
    },
    {
      id: 'spells',
      label: 'Spells',
      component: SpellStep,
      selector: (state: CharacterBuilderState) =>
        (state.spells?.length ?? 0) > 0,
      shouldSkip: (state: CharacterBuilderState) => !isSpellcaster(state)
    },
    {
      id: 'alignment',
      label: 'Alignment',
      component: AlignmentStep,
      selector: (state: CharacterBuilderState) => state.alignment,
      shouldSkip: (state) => isLocked(state, 'alignment'),
    },
    {
      id: 'equipment',
      label: 'Equipment',
      component: EquipmentStep,
      selector: (state: CharacterBuilderState) => state.equipment
    },
    {
      id: 'loadout',
      label: 'Loadout',
      component: LoadoutStep,
      selector: (state: CharacterBuilderState) => state.combat?.loadout,
      optional: true,
    },
    {
      id: 'magicItems',
      label: 'Magic Items',
      component: MagicItemsStep,
      selector: (state: CharacterBuilderState) =>
        (state.equipment?.magicItems?.length ?? 0) > 0,
      optional: true,
      shouldSkip: (state: CharacterBuilderState) =>
        !getMagicItemBudget(state.edition as EditionId, state.totalLevel ?? 0),
    },
    {
      id: 'proficiencies',
      label: 'Proficiencies',
      component: ProficiencyStep,
      selector: (state: CharacterBuilderState) =>
        (state.proficiencies?.skills?.length ?? 0) > 0
    },
    {
      id: 'confirmation',
      label: 'Confirmation',
      component: ConfirmationStep,
      selector: () => true
    }
  ]

  if (mode === 'pc') {
    const pcSteps: StepConfig[] = [
      {
        id: 'edition',
        label: 'Edition',
        component: EditionStep,
        selector: (state: CharacterBuilderState) => state.edition,
        shouldSkip: (state) => isLocked(state, 'edition'),
      },
      {
        id: 'setting',
        label: 'Setting',
        component: SettingStep,
        selector: (state: CharacterBuilderState) => state.setting,
        optional: true,
        shouldSkip: (state) => isLocked(state, 'setting'),
      },
      ...baseSteps
    ]
    return pcSteps
  }

  return baseSteps
}

export function createInitialBuilderState(
  mode: CharacterType,
  overrides?: BuilderOverrides,
): CharacterBuilderState {
  // Build the set of locked (pre-filled) step IDs
  const lockedFields = new Set<StepId>()
  if (overrides?.edition) lockedFields.add('edition')
  if (overrides?.setting) lockedFields.add('setting')
  if (overrides?.race) lockedFields.add('race')
  if (overrides?.alignment) lockedFields.add('alignment')

  const steps = getStepConfig(mode)

  // Build a temporary state so shouldSkip can read lockedFields
  const tempState: CharacterBuilderState = {
    step: { id: steps[0].id, name: steps[0].label },
    type: mode,
    name: undefined,
    hitPointMode: 'average',
    xp: 0,
    edition: (overrides?.edition ?? undefined) as EditionId | undefined,
    setting: (overrides?.setting ?? undefined) as SettingId | undefined,
    race: overrides?.race ?? undefined,
    classes: [{ level: 1 }],
    activeClassIndex: 0,
    equipment: {
      armor: [],
      weapons: [],
      gear: [],
      weight: 0
    },
    alignment: overrides?.alignment ?? undefined,
    proficiencies: { skills: [] },
    spells: [],
    totalLevel: 0,
    wealth: {
      gp: 0,
      sp: 0,
      cp: 0
    },
    lockedFields,
  }

  // Find the first non-skipped step
  const firstStep = steps.find(s => !s.shouldSkip?.(tempState)) ?? steps[0]

  return {
    ...tempState,
    step: { id: firstStep.id, name: firstStep.label },
  }
}
