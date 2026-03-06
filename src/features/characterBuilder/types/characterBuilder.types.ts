import type { CharacterSheet, RaceId } from '@/shared'
import type { AlignmentId } from '@/features/content/shared/domain/types'
import type {
  CharacterType, 
  CharacterProficiencies, 
  EquipmentLoadout, 
  EquipmentItemInstance,
} from '@/features/character/domain/types'
import type { HitPointMode } from '@/features/mechanics/domain/character/progression'
import type { InvalidationResult, InvalidationItem } from '@/features/mechanics/domain/character-build/invalidation'
import type { AbilityScoreValue, AbilityScoreMapResolved } from '@/features/mechanics/domain/core/character/abilities.types'
import type { AbilityKey } from '@/features/mechanics/domain/core/character'

export type AbilityScoreSource = 'import_manual' | 'generated_roll';
export type AbilityScoresStatus = 'unset' | 'partial' | 'complete';

export type StepId = 
'character_source' | 'ability_scores' | 'class' | 'spells' | 
'equipment' | 'loadout' | 'magicItems' | 'race' | 'level' | 
'alignment' | 'proficiencies' | 'confirmation'

export type BuilderFlowMode = 'full' | 'isolated';

export type EditMode = {
  characterId: string
  stepId: StepId
  /** Per-group locked option IDs (group key → option IDs). Prevents deselecting existing choices. */
  lockedSelections?: Record<string, string[]>
}

export type CharacterBuilderState = CharacterSheet & {
  name?: string
  hitPointMode: HitPointMode
  step: {
    id: StepId
    name: string
  }
  activeClassIndex: number | null
  abilityScores: AbilityScoreMapResolved
  abilityScoreSource?: AbilityScoreSource
  abilityScoresStatus?: AbilityScoresStatus
  flowMode: BuilderFlowMode
  /** Fields pre-filled via overrides — their corresponding steps are skipped and locked. */
  lockedFields?: Set<StepId>
  /** When set, the builder is editing a single step on an existing character. */
  editMode?: EditMode | null
}

/** Fields that can be pre-filled when launching the builder. */
export type BuilderOverrides = {
  race?: RaceId
  alignment?: AlignmentId
}

export type CharacterBuilderContextValue = {
  state: CharacterBuilderState

  // edit mode
  loadCharacterIntoBuilder: (character: CharacterSheet & {
    _id?: string
    name?: string
    class?: string
    level?: number
  }, stepId: StepId) => void

  // basic character info
  setCharacterType: (type: CharacterType) => void
  openBuilder: (mode: CharacterType, overrides?: BuilderOverrides) => void
  setName: (name: string) => void
  setRace: (id: RaceId) => void
  setAlignment: (id: AlignmentId) => void

  // leveling
  setTotalLevels: (lvl: number) => void
  setXp: (xp: number) => void
  allocatedLevels: number
  remainingLevels: number

  // classes / multiclassing
  addClass: () => void
  setClassId: (id: string) => void
  setSubclassSelectionId: (definitionId: string) => void
  setClassLevel: (classIndex: number, lvl: number) => void
  setActiveClassIndex: (index: number) => void
  updateClassLevel: (index: number, level: number) => void
  removeClass: (index: number) => void
  updateSubclassSelection: (index: number, subclassId?: string) => void
  updateSubclass: (index: number, subclassId?: string) => void
  allocateRemainingLevels: () => void

  // wealth
  setWealth: (wealth: {
    gp?: number | null
    sp?: number | null
    cp?: number | null
    baseBudget?: import('@/shared/money/types').Money | null
  }) => void

  // proficiencies
  setProficiencies: (proficiencies: CharacterProficiencies) => void

  // character source
  chooseImportCharacter: () => void
  chooseGenerateCharacter: () => void

  // ability scores
  rollAbilityScores: () => void
  setAbilityScores: (patch: Partial<AbilityScoreMapResolved>) => void
  setAbilityScore: (abilityKey: AbilityKey, value: AbilityScoreValue | null) => void
  setAbilityScoreSource: (source: AbilityScoreSource) => void

  // hit points
  setHitPointMode: (mode: HitPointMode) => void

  // spells
  setSpells: (spells: string[]) => void

  // equipment
  updateWeapons: (ids: string[]) => void
  updateArmor: (ids: string[]) => void
  updateGear: (ids: string[]) => void
  updateMagicItems: (ids: string[]) => void
  setWeight: (lbs: number) => void

  // equipment instances
  addWeaponInstance: (baseId: string) => void
  addArmorInstance: (baseId: string) => void
  updateWeaponInstance: (instanceId: string, patch: Partial<EquipmentItemInstance>) => void
  updateArmorInstance: (instanceId: string, patch: Partial<EquipmentItemInstance>) => void
  removeWeaponInstance: (instanceId: string) => void
  removeArmorInstance: (instanceId: string) => void

  // loadout
  updateLoadout: (patch: Partial<EquipmentLoadout>) => void

  // flow control
  start: () => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (stepId: StepId) => void
  resetState: () => void
  isComplete: (state: CharacterBuilderState) => boolean

  // invalidation
  /** Per-step invalidation notices, keyed by StepId. */
  stepNotices: Map<StepId, InvalidationItem[]>
  /** Pending invalidation result awaiting user confirmation.  Null when idle. */
  pendingInvalidations: InvalidationResult | null
  /** Confirm the pending change — apply it and store step notices. */
  confirmChange: () => void
  /** Cancel the pending change — discard it. */
  cancelChange: () => void
  /** Dismiss a step's invalidation notice. */
  dismissNotice: (stepId: StepId) => void
}
