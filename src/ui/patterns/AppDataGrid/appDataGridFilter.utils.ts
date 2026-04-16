import { clampMinMaxToSteps, type NumericRange } from '@/features/content/shared/toolbar/discreteNumericRange'

import type { AppDataGridFilter, FilterOption } from './appDataGridFilter.types'

export function getFilterDefault<T>(f: AppDataGridFilter<T>): unknown {
  switch (f.type) {
    case 'select':
      return f.defaultValue ?? f.options[0]?.value ?? ''
    case 'multiSelect':
      return f.defaultValue ?? []
    case 'boolean':
      return f.defaultValue ?? 'all'
    case 'range':
      return f.defaultValue
  }
}

/** Resolves stored range filter value and clamps to current `steps`. */
export function getClampedRangeFilterValue<T>(
  f: Extract<AppDataGridFilter<T>, { type: 'range' }>,
  stored: unknown,
): NumericRange {
  const raw = (stored as NumericRange | undefined) ?? f.defaultValue
  return clampMinMaxToSteps(raw, f.steps)
}

function optionLabel(options: FilterOption[], value: string): string | undefined {
  return options.find((o) => o.value === value)?.label
}

/** One row in the active-filter badge strip. */
export type AppDataGridBadgeSegment = {
  label: string
  /** Multi-select only: removing this badge clears this option id from the filter value. */
  removeValue?: string
}

/**
 * Resolves badge label(s) and optional per-value removal keys for toolbar filter chips.
 */
export function getActiveFilterBadgeSegments<T>(
  f: AppDataGridFilter<T>,
  value: unknown,
): AppDataGridBadgeSegment[] {
  if (f.formatActiveChipValue) {
    const raw = f.formatActiveChipValue({ value, filter: f })
    if (Array.isArray(raw)) {
      if (f.type === 'multiSelect') {
        const selected = (value as string[]) ?? []
        return raw.map((label, i) => ({
          label,
          removeValue: i < selected.length ? selected[i] : undefined,
        }))
      }
      return raw.map((label) => ({ label }))
    }
    return [{ label: raw }]
  }

  if (f.type === 'range') {
    const v = getClampedRangeFilterValue(f, value)
    const a = f.formatStepValue(v.min)
    const b = f.formatStepValue(v.max)
    return [{ label: `${a}\u2013${b}` }]
  }

  switch (f.type) {
    case 'select': {
      const v = String(value ?? '')
      return [{ label: optionLabel(f.options, v) ?? v }]
    }
    case 'multiSelect': {
      const selected = (value as string[]) ?? []
      return selected.map((id) => ({
        label: optionLabel(f.options, id) ?? id,
        removeValue: id,
      }))
    }
    case 'boolean': {
      const v = value as string
      if (v === 'true') return [{ label: f.trueLabel ?? 'Yes' }]
      if (v === 'false') return [{ label: f.falseLabel ?? 'No' }]
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
export function formatDefaultActiveChipValue<T>(
  f: AppDataGridFilter<T>,
  value: unknown,
): string {
  switch (f.type) {
    case 'select': {
      const v = String(value ?? '')
      return optionLabel(f.options, v) ?? v
    }
    case 'multiSelect': {
      const selected = (value as string[]) ?? []
      if (selected.length === 0) return ''
      if (selected.length === 1) {
        return optionLabel(f.options, selected[0]!) ?? selected[0]!
      }
      return `${selected.length} selected`
    }
    case 'boolean': {
      const v = value as string
      if (v === 'true') return f.trueLabel ?? 'Yes'
      if (v === 'false') return f.falseLabel ?? 'No'
      return 'All'
    }
    case 'range': {
      const v = getClampedRangeFilterValue(f, value)
      return `${f.formatStepValue(v.min)}\u2013${f.formatStepValue(v.max)}`
    }
  }
}
