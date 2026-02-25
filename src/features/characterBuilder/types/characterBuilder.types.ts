import type { CharacterClassInfo, CharacterSheet } from '@/shared'
import type { CharacterType, CharacterProficiencies, EquipmentLoadout, EquipmentItemInstance } from '@/shared/types/character.core'
import type { HitPointMode } from '@/features/mechanics/domain/progression'
import type { InvalidationResult, InvalidationItem } from '@/features/mechanics/domain/character-build/invalidation'

export type { CharacterClassInfo, CharacterSheet, CharacterProficiencies }
export type { HitPointMode }

export type StepId = 'edition' | 'setting' | 'class' | 'spells' | 'equipment' | 'loadout' | 'magicItems' | 'race' | 'level' | 'alignment' | 'proficiencies' | 'confirmation'

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
  /** Fields pre-filled via overrides — their corresponding steps are skipped and locked. */
  lockedFields?: Set<StepId>
  /** When set, the builder is editing a single step on an existing character. */
  editMode?: EditMode | null
}

/** Fields that can be pre-filled when launching the builder. */
export type BuilderOverrides = {
  edition?: import('@/data').EditionId
  setting?: import('@/data').SettingId
  race?: string
  alignment?: string
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
  setEdition: (id: string) => void
  setSetting: (id: string) => void
  setRace: (id: string) => void
  setAlignment: (id: string) => void

  // leveling
  setTotalLevels: (lvl: number) => void
  setXp: (xp: number) => void
  allocatedLevels: number
  remainingLevels: number

  // classes / multiclassing
  addClass: () => void
  setClassId: (id: string) => void
  setClassDefinitionId: (definitionId: string) => void
  setClassLevel: (classIndex: number, lvl: number) => void
  setActiveClassIndex: (index: number) => void
  updateClassLevel: (index: number, level: number) => void
  removeClass: (index: number) => void
  updateClassDefinition: (index: number, subclassId?: string) => void
  updateSubclass: (index: number, subclassId?: string) => void
  allocateRemainingLevels: () => void

  // wealth
  setWealth: (wealth: {
    gp?: number | null
    sp?: number | null
    cp?: number | null
  }) => void

  // proficiencies
  setProficiencies: (proficiencies: CharacterProficiencies) => void

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

  // options
  raceOptions: any[]
  classOptions: any[]
}
