// Class
export {
  getClassProgression,
  getClassProgressionsByClass,
  getSubclassFeatures,
  progressionToCore,
  classToCore,
  compareClassAcrossEditions,
  type SubclassFeature,
  type CoreClassProgression,
  type CoreFeature,
} from './class/classProgression'

// Subclass
export { getSubclassUnlockLevel } from './subclass/subclassUnlock'

// XP
export { getXpByLevelAndEdition, getLevelForXp } from './xp/xp'

// Hit points
export {
  getHitPointInfo,
  getAverageHpForLevel,
  rollHitDie,
  generateHitPoints,
  type HitPointMode,
  type HitPointInfo,
} from './hit-points/hitPoints'

// Reference (class aliases)
export {
  resolveClassId,
  CLASS_ALIASES,
  CLASS_GROUPS_2E,
  getClassGroup2e,
} from './reference/classAliases'
