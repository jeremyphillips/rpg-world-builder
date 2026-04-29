import type { AppDataGridFilter, FilterOption } from '../types'

import { getClampedRangeFilterValue } from './filterDefaults'

function optionLabel(options: FilterOption[], value: string): string | undefined {
  return options.find((option) => option.value === value)?.label
}

/** One row in the active-filter badge strip. */
export type AppDataGridBadgeSegment = {
  label: string
  /** Multi-select only: removing this badge clears this option id from the filter value. */
  removeValue?: string
}

/**
 * Resolves badge label(s) and optional per-value removal keys for toolbar filter badges.
 */
export function getActiveFilterBadgeSegments<T>(
  filter: AppDataGridFilter<T>,
  value: unknown,
): AppDataGridBadgeSegment[] {
  const formatBadgeValue = filter.formatActiveBadgeValue ?? filter.formatActiveChipValue
  if (formatBadgeValue) {
    const raw = formatBadgeValue({ value, filter })
    if (Array.isArray(raw)) {
      if (filter.type === 'multiSelect') {
        const selected = (value as string[]) ?? []
        return raw.map((label, index) => ({
          label,
          removeValue: index < selected.length ? selected[index] : undefined,
        }))
      }
      return raw.map((label) => ({ label }))
    }
    return [{ label: raw }]
  }

  if (filter.type === 'range') {
    const rangeValue = getClampedRangeFilterValue(filter, value)
    const minLabel = filter.formatStepValue(rangeValue.min)
    const maxLabel = filter.formatStepValue(rangeValue.max)
    return [{ label: `${minLabel}\u2013${maxLabel}` }]
  }

  switch (filter.type) {
    case 'select': {
      const stringValue = String(value ?? '')
      return [{ label: optionLabel(filter.options, stringValue) ?? stringValue }]
    }
    case 'multiSelect': {
      const selected = (value as string[]) ?? []
      return selected.map((id) => ({
        label: optionLabel(filter.options, id) ?? id,
        removeValue: id,
      }))
    }
    case 'boolean': {
      const stringValue = value as string
      if (stringValue === 'true') return [{ label: filter.trueLabel ?? 'Yes' }]
      if (stringValue === 'false') return [{ label: filter.falseLabel ?? 'No' }]
      return [{ label: 'All' }]
    }
    default:
      return []
  }
}

/**
 * Default badge text for an active filter value (single string). Multi-select is better handled via
 * {@link getActiveFilterBadgeSegments}; this helper remains for simple select/boolean cases.
 */
export function formatDefaultActiveBadgeValue<T>(
  filter: AppDataGridFilter<T>,
  value: unknown,
): string {
  switch (filter.type) {
    case 'select': {
      const stringValue = String(value ?? '')
      return optionLabel(filter.options, stringValue) ?? stringValue
    }
    case 'multiSelect': {
      const selected = (value as string[]) ?? []
      if (selected.length === 0) return ''
      if (selected.length === 1) {
        return optionLabel(filter.options, selected[0]!) ?? selected[0]!
      }
      return `${selected.length} selected`
    }
    case 'boolean': {
      const stringValue = value as string
      if (stringValue === 'true') return filter.trueLabel ?? 'Yes'
      if (stringValue === 'false') return filter.falseLabel ?? 'No'
      return 'All'
    }
    case 'range': {
      const rangeValue = getClampedRangeFilterValue(filter, value)
      return `${filter.formatStepValue(rangeValue.min)}\u2013${filter.formatStepValue(rangeValue.max)}`
    }
  }
}

/** @deprecated Use `formatDefaultActiveBadgeValue` instead. */
export const formatDefaultActiveChipValue = formatDefaultActiveBadgeValue
