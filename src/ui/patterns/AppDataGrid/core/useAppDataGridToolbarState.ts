import { useCallback, useMemo, useState } from 'react'

import type { AppDataGridFilter } from '../types'
import { getFilterDefault } from '../filters'
import { isFilterValueActive } from './appDataGridFiltering'

export function useAppDataGridToolbarState<T>({
  initialFilterValues,
  onFilterValueChange,
  resolvedFilters,
}: {
  initialFilterValues?: Record<string, unknown>
  onFilterValueChange?: (id: string, value: unknown) => void
  resolvedFilters: AppDataGridFilter<T>[]
}) {
  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>(
    () => ({ ...initialFilterValues }),
  )

  const setFilterValue = useCallback(
    (id: string, value: unknown) => {
      setFilterValues((prev) => ({ ...prev, [id]: value }))
      onFilterValueChange?.(id, value)
    },
    [onFilterValueChange],
  )

  const getFilterValue = useCallback(
    (f: AppDataGridFilter<T>): unknown => filterValues[f.id] ?? getFilterDefault(f),
    [filterValues],
  )

  const hasActiveToolbarState = useMemo(() => {
    if (search.trim()) return true
    return resolvedFilters.some((f) => {
      const cur = filterValues[f.id] ?? getFilterDefault(f)
      return isFilterValueActive(f, cur)
    })
  }, [filterValues, resolvedFilters, search])

  /** Clears search and runtime filters only; does not PATCH persisted user preferences. */
  const resetToolbar = useCallback(() => {
    setSearch('')
    setFilterValues({})
  }, [])

  return {
    search,
    setSearch,
    filterValues,
    setFilterValue,
    getFilterValue,
    hasActiveToolbarState,
    resetToolbar,
  }
}
