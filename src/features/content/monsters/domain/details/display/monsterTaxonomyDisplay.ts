import {
  getCreatureSizeDisplayName,
  getCreatureSubtypeDisplayName,
  getCreatureTypeDisplayName,
} from '@/features/content/creatures/domain/display/creatureTaxonomyDisplay'

export const getMonsterTypeDisplayName = getCreatureTypeDisplayName
export const getMonsterSubtypeDisplayName = getCreatureSubtypeDisplayName
/** Display label for the standard stat-block size scale (maps to `CreatureSizeId`). */
export const getMonsterSizeCategoryDisplayName = getCreatureSizeDisplayName
