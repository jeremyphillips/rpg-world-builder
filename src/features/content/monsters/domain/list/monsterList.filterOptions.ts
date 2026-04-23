import {
  getCreatureSizeFilterOptions,
  getCreatureTypeFilterOptions,
} from '@/features/content/creatures/domain/options/creatureTaxonomyOptions'

export const MONSTER_TYPE_FILTER_OPTIONS = getCreatureTypeFilterOptions()
export const MONSTER_SIZE_FILTER_OPTIONS = getCreatureSizeFilterOptions()
