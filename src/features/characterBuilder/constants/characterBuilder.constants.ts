import {
  AbilityScoresStep,
  AlignmentStep,
  CharacterSourceStep,
  ConfirmationStep,
  ProficiencyStep,
  ClassStep,
  EquipmentStep,
  LoadoutStep,
  MagicItemsStep,
  LevelStep,
  RaceStep,
  SpellStep
} from '../steps'
import { type CharacterBuilderState, type StepId, type BuilderOverrides } from '../types'
import type { AbilityScoreMapResolved } from '@/features/mechanics/domain/core/character/abilities.types'
import type { CharacterType } from '@/features/character/domain/types'
import { getSkillIds } from '@/features/character/domain/utils/character-proficiency.utils'
import { getSystemClass } from '@/features/mechanics/domain/core/rules/systemCatalog.classes';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds';
import { ABILITY_KEYS, type AbilityScoreMap } from '@/features/mechanics/domain/core/character'

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

/** Returns true if at least one selected class has spellcasting progression. */
function isSpellcaster(state: CharacterBuilderState): boolean {
  return state.classes.some(cls => {
    if (!cls.classId) return false
    const classDef = getSystemClass(DEFAULT_SYSTEM_RULESET_ID, cls.classId)
    return classDef?.progression?.spellProgression != null
  })
}

/** Returns true if a step is locked via overrides. */
function isLocked(state: CharacterBuilderState, stepId: StepId): boolean {
  return state.lockedFields?.has(stepId) ?? false
}

export function getStepConfig(_mode: CharacterType): StepConfig[] {
  const baseSteps: StepConfig[] = [
    {
      id: 'character_source',
      label: 'Character Source',
      component: CharacterSourceStep,
      selector: (state: CharacterBuilderState) => state.abilityScoreSource,
      shouldSkip: (state: CharacterBuilderState) =>
        state.flowMode === 'isolated' || state.abilityScoreSource != null,
    },
    {
      id: 'ability_scores',
      label: 'Ability Scores',
      component: AbilityScoresStep,
      selector: (state: CharacterBuilderState) => state.abilityScoresStatus === 'complete',
      shouldSkip: (state: CharacterBuilderState) =>
        state.flowMode === 'isolated' && state.editMode?.stepId !== 'ability_scores',
    },
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
    },
    {
      id: 'proficiencies',
      label: 'Proficiencies',
      component: ProficiencyStep,
      selector: (state: CharacterBuilderState) =>
        getSkillIds(state.proficiencies).length > 0
    },
    {
      id: 'confirmation',
      label: 'Confirmation',
      component: ConfirmationStep,
      selector: () => true
    }
  ]

  return baseSteps
}

export function createInitialBuilderState(
  mode: CharacterType,
  overrides?: BuilderOverrides,
): CharacterBuilderState {
  // Build the set of locked (pre-filled) step IDs
  const lockedFields = new Set<StepId>()
  if (overrides?.race) lockedFields.add('race')
  if (overrides?.alignment) lockedFields.add('alignment')

  const steps = getStepConfig(mode)

  const initialScores = Object.fromEntries(ABILITY_KEYS.map(key => [key, null])) as AbilityScoreMap;

  // Build a temporary state so shouldSkip can read lockedFields
  const tempState: CharacterBuilderState = {
    step: { id: steps[0].id, name: steps[0].label },
    type: mode,
    name: undefined,
    hitPointMode: 'average',
    xp: 0,
    race: overrides?.race ?? undefined,
    classes: [{ level: 1 }],
    activeClassIndex: 0,
    abilityScores: { ...initialScores } as AbilityScoreMapResolved,
    abilityScoreSource: undefined,
    abilityScoresStatus: 'unset',
    flowMode: 'full',
    equipment: {
      armor: [],
      weapons: [],
      gear: [],
      weight: 0
    },
    alignment: overrides?.alignment ?? undefined,
    proficiencies: { skills: {} },
    spells: [],
    totalLevel: 0,
    wealth: {
      gp: 0,
      sp: 0,
      cp: 0,
      baseBudget: null,
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
