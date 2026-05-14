import { useMemo, type ReactNode } from 'react'

import { AppBadge } from '@/ui/primitives'

import type { AppDataGridFilter, AppDataGridToolbarLayout } from '../types'
import { getActiveFilterBadgeSegments, getFilterDefault } from '../filters'
import { isFilterValueActive, truncateToolbarSearchLabel } from './appDataGridFiltering'

export function useAppDataGridToolbarBadges<T>({
  toolbarLayout,
  search,
  setSearch,
  filterValues,
  resolvedFilters,
  setFilterValue,
}: {
  toolbarLayout: AppDataGridToolbarLayout | undefined
  search: string
  setSearch: (v: string) => void
  filterValues: Record<string, unknown>
  resolvedFilters: AppDataGridFilter<T>[]
  setFilterValue: (id: string, value: unknown) => void
}): ReactNode[] {
  return useMemo(() => {
    if (!toolbarLayout) return []
    const out: ReactNode[] = []
    if (search.trim()) {
      out.push(
        <AppBadge
          key="search"
          size="small"
          variant="outlined"
          label={`Search: ${truncateToolbarSearchLabel(search)}`}
          onDelete={() => setSearch('')}
        />,
      )
    }
    for (const f of resolvedFilters) {
      const cur = filterValues[f.id] ?? getFilterDefault(f)
      if (!isFilterValueActive(f, cur)) continue
      const segments = getActiveFilterBadgeSegments(f, cur).filter((s) => s.label.trim() !== '')
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]!
        const showPrefix = Boolean(f.badgePrefixFilterLabel)
        const badgeLabel = showPrefix ? `${f.label}: ${seg.label}` : seg.label
        out.push(
          <AppBadge
            key={`filter-${f.id}-${seg.removeValue ?? i}`}
            size="small"
            variant="outlined"
            label={badgeLabel}
            onDelete={() => {
              if (seg.removeValue !== undefined && f.type === 'multiSelect') {
                const arr = ((cur as string[]) ?? []).filter((v) => v !== seg.removeValue)
                setFilterValue(f.id, arr)
              } else {
                setFilterValue(f.id, getFilterDefault(f))
              }
            }}
          />,
        )
      }
    }
    return out
  }, [toolbarLayout, search, filterValues, resolvedFilters, setFilterValue, setSearch])
}
