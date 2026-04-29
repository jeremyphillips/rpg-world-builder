import { clampMinMaxToSteps, type NumericRange } from './discreteNumericRange'

import type { AppDataGridFilter } from '../types'

export function getFilterDefault<T>(filter: AppDataGridFilter<T>): unknown {
  switch (filter.type) {
    case 'select':
      return filter.defaultValue ?? filter.options[0]?.value ?? ''
    case 'multiSelect':
      return filter.defaultValue ?? []
    case 'boolean':
      return filter.defaultValue ?? 'all'
    case 'range':
      return filter.defaultValue
  }
}

/** Resolves stored range filter value and clamps it to the current `steps`. */
export function getClampedRangeFilterValue<T>(
  filter: Extract<AppDataGridFilter<T>, { type: 'range' }>,
  stored: unknown,
): NumericRange {
  const raw = (stored as NumericRange | undefined) ?? filter.defaultValue
  return clampMinMaxToSteps(raw, filter.steps)
}
