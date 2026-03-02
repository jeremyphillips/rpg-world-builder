import { useState, useMemo, type ReactNode } from 'react'

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'
import SearchIcon from '@mui/icons-material/Search'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilterOption {
  value: string
  label: string
}

export interface FilterableCardGroupProps<T> {
  /** Array of data items to render as cards */
  items: T[]
  /** Render function for each card */
  renderCard: (item: T, index: number) => ReactNode
  /** Extract a search-matchable string from each item */
  getSearchValue: (item: T) => string
  /** Extract the filter value from each item (matched against the selected filter) */
  getFilterValue?: (item: T) => string
  /** Filter options shown in the dropdown (first option is typically "All") */
  filterOptions?: FilterOption[]
  /** Label for the filter dropdown */
  filterLabel?: string
  /** Placeholder for the search field */
  searchPlaceholder?: string
  /** Message shown when no items match */
  emptyMessage?: string
  /** Spacing between cards */
  spacing?: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FilterableCardGroup<T>({
  items,
  renderCard,
  getSearchValue,
  getFilterValue,
  filterOptions,
  filterLabel,
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results found.',
  spacing = 1.5,
}: FilterableCardGroupProps<T>) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState(filterOptions?.[0]?.value ?? '')

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search || getSearchValue(item).toLowerCase().includes(search.toLowerCase())
      const matchesFilter =
        !getFilterValue || !filter || filter === filterOptions?.[0]?.value
          ? true
          : getFilterValue(item) === filter
      return matchesSearch && matchesFilter
    })
  }, [items, search, filter, getSearchValue, getFilterValue, filterOptions])

  return (
    <Box>
      {/* Toolbar */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 260 }}
        />
        {filterOptions && filterOptions.length > 0 && (
          <TextField
            select
            size="small"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            label={filterLabel}
            sx={{ minWidth: 160 }}
          >
            {filterOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Stack>

      {/* Cards */}
      {filtered.length === 0 ? (
        <Typography color="text.secondary">{emptyMessage}</Typography>
      ) : (
        <Stack spacing={spacing}>
          {filtered.map((item, i) => (
            <Box key={i}>{renderCard(item, i)}</Box>
          ))}
        </Stack>
      )}
    </Box>
  )
}
