// Utils
export { groupSpellsByLevel } from './utils/groupSpellsByLevel'

// Progression
export { getClassSpellLimitsAtLevel, type CastingMode, type SpellLimits } from './progression'

// Selection
export {
  buildSpellSelectionModel,
  isSpellLevelFull,
  toggleSpellSelection,
  pruneSelectedSpells,
  type SpellSelectionModel,
  type SpellSelectionLimits,
  type SpellSelectionDraft,
  type SpellPruneResult,
  type ToggleResult,
} from './selection'
