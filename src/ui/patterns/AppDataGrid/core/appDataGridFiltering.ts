/**
 * Row filtering and default toolbar search for `AppDataGrid`.
 *
 * This module implements a **client-side** pipeline suitable for modest lists. For row-count
 * guidelines, UX signals that suggest server-side or indexed search, and deferred extensions
 * (bulk selection, plugins), see `docs/reference/appdatagrid.md`.
 */
import type { AppDataGridColumn, AppDataGridFilter } from '../types'
import { getClampedRangeFilterValue, getFilterDefault } from '../filters'

export function isFilterValueActive<T>(filter: AppDataGridFilter<T>, value: unknown): boolean {
  const defaultValue = getFilterDefault(filter)
  if (filter.type === 'multiSelect') {
    const selected = (value as string[]) ?? []
    return selected.length > 0
  }
  if (filter.type === 'boolean') {
    return value !== 'all'
  }
  if (filter.type === 'range') {
    const current = getClampedRangeFilterValue(filter, value)
    return current.min !== filter.defaultValue.min || current.max !== filter.defaultValue.max
  }
  return value !== defaultValue
}

export function filterRows<T>(params: {
  rows: T[]
  columns: AppDataGridColumn<T>[]
  filters: AppDataGridFilter<T>[]
  filterValues: Record<string, unknown>
  searchable: boolean
  search: string
  searchRowMatch?: (row: T, query: string) => boolean
  searchColumns?: string[]
}): T[] {
  const { rows, columns, filters, filterValues, searchable, search, searchRowMatch, searchColumns } = params

  const columnByField = new Map(columns.map((c) => [c.field, c]))

  return rows.filter((row) => {
    const passesFilters = filters.every((filter) => {
      const current = filterValues[filter.id] ?? getFilterDefault(filter)

      switch (filter.type) {
        case 'select': {
          const defaultValue = filter.defaultValue ?? filter.options[0]?.value
          if (current === defaultValue) return true
          return String(filter.accessor(row) ?? '') === current
        }
        case 'multiSelect': {
          const selected = current as string[]
          if (!selected || selected.length === 0) return true
          const rowValues = filter.accessor(row)
          return selected.some((value) => rowValues.includes(value))
        }
        case 'boolean': {
          if (current === 'all') return true
          const rowValue = filter.accessor(row)
          return current === 'true' ? rowValue === true : rowValue === false
        }
        case 'range': {
          const rangeValue = getClampedRangeFilterValue(filter, current)
          const rowValue = filter.accessor(row)
          return rowValue >= rangeValue.min && rowValue <= rangeValue.max
        }
      }
    })

    if (!passesFilters) return false

    if (searchable && search) {
      if (searchRowMatch) return searchRowMatch(row, search)
      const lowerSearch = search.toLowerCase()
      const searchableFields = searchColumns ?? columns.map((column) => column.field)
      return searchableFields.some((fieldKey) => {
        const column = columnByField.get(fieldKey)
        const value = column?.accessor
          ? column.accessor(row)
          : (row as Record<string, unknown>)[fieldKey]
        return value != null && String(value).toLowerCase().includes(lowerSearch)
      })
    }

    return true
  })
}

export function truncateToolbarSearchLabel(text: string, max = 40): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}
