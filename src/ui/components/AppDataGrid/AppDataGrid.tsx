import { useState, useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'
import MuiLink from '@mui/material/Link'
import Switch from '@mui/material/Switch'

import SearchIcon from '@mui/icons-material/Search'

import type { FilterOption } from '../FilterableCardGroup/FilterableCardGroup'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AppDataGridColumn<T> {
  /** Field key on the row object */
  field: string & keyof T
  /** Column header label */
  headerName: string
  /** If true, this column's cell renders as a router Link using getDetailLink */
  linkColumn?: boolean
  /** Fixed width in pixels */
  width?: number
  /** Flex grow factor (use instead of width for fluid columns) */
  flex?: number
  /** Minimum width when using flex */
  minWidth?: number
  /** Column data type (e.g. 'number' for right-aligned numeric columns) */
  type?: string
  /** Custom value formatter — receives the raw cell value */
  valueFormatter?: (value: unknown) => string
  /** Custom cell renderer — escape hatch for rich cell content (e.g. Chips) */
  renderCell?: (params: GridRenderCellParams) => ReactNode
  /** If true, renders a MUI Switch. The field value is read as a boolean. */
  switchColumn?: boolean
  /** Called when the switch is toggled (requires switchColumn) */
  onSwitchChange?: (row: T, checked: boolean) => void
  /** Disable the switch for specific rows (requires switchColumn) */
  isSwitchDisabled?: (row: T) => boolean
}

export interface AppDataGridProps<T> {
  /** Data rows */
  rows: T[]
  /** Column definitions */
  columns: AppDataGridColumn<T>[]
  /** Extract a unique ID from each row */
  getRowId: (row: T) => string
  /** Build the detail route link for a row (used by linkColumn) */
  getDetailLink?: (row: T) => string
  /** Column field to use for dropdown filtering */
  filterColumn?: string & keyof T
  /** Options for the filter dropdown */
  filterOptions?: FilterOption[]
  /** Label shown on the filter dropdown */
  filterLabel?: string
  /**
   * Enable row multi-select.
   * TODO: expose onSelectionChange callback and selectedIds controlled prop
   * to support bulk actions (delete, export, etc.).
   */
  multiSelect?: boolean
  /** Show a search field above the grid */
  searchable?: boolean
  /** Placeholder for the search field */
  searchPlaceholder?: string
  /** Columns to search across (defaults to all columns) */
  searchColumns?: (string & keyof T)[]
  /** Show a loading overlay */
  loading?: boolean
  /** Message displayed when there are no rows */
  emptyMessage?: string
  /** Pagination page-size options */
  pageSizeOptions?: number[]
  /** Row density */
  density?: 'compact' | 'standard' | 'comfortable'
  /** Optional toolbar rendered above the grid (e.g. action buttons) */
  toolbar?: ReactNode
  /** Height of the grid container (default 400) */
  height?: number | string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AppDataGrid<T>({
  rows,
  columns,
  getRowId,
  getDetailLink,
  filterColumn,
  filterOptions,
  filterLabel,
  multiSelect = false,
  searchable = false,
  searchPlaceholder = 'Search…',
  searchColumns,
  loading = false,
  emptyMessage = 'No data.',
  pageSizeOptions = [10, 25, 50],
  density = 'standard',
  toolbar,
  height = 400,
}: AppDataGridProps<T>) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState(filterOptions?.[0]?.value ?? '')

  // ── Filtering & searching ──────────────────────────────────────────
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // Column filter
      if (
        filterColumn &&
        filterOptions &&
        filter &&
        filter !== filterOptions[0]?.value
      ) {
        const cellValue = String((row as Record<string, unknown>)[filterColumn] ?? '')
        if (cellValue !== filter) return false
      }

      // Text search
      if (searchable && search) {
        const lowerSearch = search.toLowerCase()
        const colsToSearch =
          searchColumns ?? columns.map((c) => c.field)
        return colsToSearch.some((field) => {
          const val = (row as Record<string, unknown>)[field]
          return val != null && String(val).toLowerCase().includes(lowerSearch)
        })
      }

      return true
    })
  }, [rows, filter, filterColumn, filterOptions, searchable, search, searchColumns, columns])

  // ── Map AppDataGridColumn → MUI GridColDef ─────────────────────────
  const muiColumns: GridColDef[] = useMemo(() => {
    return columns.map((col) => {
      const def: GridColDef = {
        field: col.field,
        headerName: col.headerName,
        width: col.width,
        flex: col.flex,
        minWidth: col.minWidth,
        type: col.type,
        valueFormatter: col.valueFormatter
          ? (value: unknown) => col.valueFormatter!(value)
          : undefined,
        renderCell: col.renderCell,
      }

      if (col.linkColumn && getDetailLink) {
        def.renderCell = (params) => {
          const row = params.row as T
          return (
            <MuiLink
              component={Link}
              to={getDetailLink(row)}
              underline="hover"
              color="inherit"
              fontWeight={600}
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {params.value as string}
            </MuiLink>
          )
        }
      }

      if (col.switchColumn) {
        def.renderCell = (params) => {
          const row = params.row as T
          return (
            <Switch
              checked={Boolean(params.value)}
              disabled={col.isSwitchDisabled?.(row)}
              onChange={(_e, checked) => col.onSwitchChange?.(row, checked)}
              size="small"
            />
          )
        }
      }

      return def
    })
  }, [columns, getDetailLink])

  // ── Render ─────────────────────────────────────────────────────────
  const showToolbar = toolbar || searchable || (filterOptions && filterOptions.length > 0)

  return (
    <Box>
      {/* Toolbar area */}
      {showToolbar && (
        <Stack
          direction="row"
          spacing={2}
          sx={{ mb: 2, alignItems: 'center', flexWrap: 'wrap' }}
        >
          {searchable && (
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
          )}

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

          {/* Push custom toolbar content to the right */}
          {toolbar && <Box sx={{ ml: 'auto' }}>{toolbar}</Box>}
        </Stack>
      )}

      {/* Grid */}
      <Box sx={{ height, width: '100%' }}>
        <DataGrid
          rows={filteredRows}
          columns={muiColumns}
          getRowId={(row) => getRowId(row as T)}
          loading={loading}
          pageSizeOptions={pageSizeOptions}
          density={density}
          checkboxSelection={multiSelect}
          disableRowSelectionOnClick={!multiSelect}
          disableColumnFilter
          disableColumnMenu
          slots={{
            noRowsOverlay: () => (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <Typography color="text.secondary">{emptyMessage}</Typography>
              </Box>
            ),
          }}
        />
      </Box>
    </Box>
  )
}
