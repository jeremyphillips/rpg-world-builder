import { useMemo, useCallback } from 'react'

import Box from '@mui/material/Box'

import {
  APP_DATA_GRID_ALLOWED_IN_CAMPAIGN_FILTER_ID,
  type AppDataGridFilter,
  type AppDataGridProps,
} from '../types'
import { indexFiltersById } from '../filters'
import { buildMuiColumns } from './appDataGridColumns'
import { filterRows } from './appDataGridFiltering'
import {
  rowSelectionModelToSelectedRowIds,
  selectedRowIdsToRowSelectionModel,
} from './appDataGridRowSelection'
import { useAppDataGridToolbarState } from './useAppDataGridToolbarState'
import { useAppDataGridToolbarBadges } from './useAppDataGridToolbarBadges'
import { renderAppDataGridFilterControl } from './appDataGridToolbarFilterControl'
import AppDataGridToolbar from './AppDataGridToolbar'
import AppDataGridGridPresentation from './AppDataGridGridPresentation'
import type { GridRowSelectionModel } from '@mui/x-data-grid'
import type { MuiTextFieldSize } from '@/ui/sizes'

// ---------------------------------------------------------------------------
// COLUMN SPECIAL BEHAVIORS (applied in order, later wins):
// ---------------------------------------------------------------------------
// 1. renderCell    — custom cell renderer (baseline)
// 2. imageColumn   — renders an Avatar thumbnail via resolveContentImageUrl
// 3. linkColumn    — wraps whatever is rendered above in a router Link
// 4. switchColumn  — renders a toggle Switch; overrides everything above
//
// imageColumn + linkColumn can be combined (Avatar wrapped in a Link).
// switchColumn always takes final priority.
// ---------------------------------------------------------------------------

export default function AppDataGrid<T>({
  rows,
  columns,
  getRowId,
  getDetailLink,
  toolbarConfig,
  selection,
  presentation,
}: AppDataGridProps<T>) {
  const tc = toolbarConfig
  const filterBundle = tc?.filters
  const onFilterValueChange = filterBundle?.onValueChange
  const initialFilterValues = filterBundle?.initialValues

  const searchCfg = tc?.search
  const searchable = searchCfg?.enabled ?? false
  const searchPlaceholder = searchCfg?.placeholder ?? 'Search…'
  const searchRowMatch = searchCfg?.rowMatch
  const searchColumns = searchCfg?.columns

  const primaryFieldSize: MuiTextFieldSize = tc?.fieldSizes?.primary ?? 'medium'
  const secondaryFieldSize = tc?.fieldSizes?.secondary ?? 'small'
  const toolbar = tc?.actions
  const toolbarLayout = tc?.layout

  const pres = presentation
  const loading = pres?.loading ?? false
  const emptyMessage = pres?.emptyMessage ?? 'No data.'
  const pageSizeOptions = pres?.pageSizeOptions ?? [10, 25, 50]
  const density = pres?.density ?? 'standard'
  const height = pres?.height ?? 400
  const getRowClassName = pres?.getRowClassName

  const multiSelect = selection?.enabled ?? false
  const selectedRowIdsControlled = selection?.selectedRowIds
  const onSelectionChange = selection?.onSelectionChange

  const resolvedFilters = useMemo<AppDataGridFilter<T>[]>(
    () => filterBundle?.definitions ?? [],
    [filterBundle?.definitions],
  )

  const {
    search,
    setSearch,
    filterValues,
    setFilterValue,
    getFilterValue,
    hasActiveToolbarState,
    resetToolbar,
  } = useAppDataGridToolbarState<T>({
    initialFilterValues,
    onFilterValueChange,
    resolvedFilters,
  })

  const filteredRows = useMemo(
    () =>
      filterRows({
        rows,
        columns,
        filters: resolvedFilters,
        filterValues,
        searchable,
        search,
        searchRowMatch,
        searchColumns,
      }),
    [rows, columns, resolvedFilters, filterValues, searchable, search, searchRowMatch, searchColumns],
  )

  const visibleRowIds = useMemo(
    () => filteredRows.map((row) => getRowId(row)),
    [filteredRows, getRowId],
  )

  const rowSelectionModel = useMemo((): GridRowSelectionModel | undefined => {
    if (!multiSelect || selectedRowIdsControlled === undefined) return undefined
    return selectedRowIdsToRowSelectionModel(selectedRowIdsControlled)
  }, [multiSelect, selectedRowIdsControlled])

  const handleRowSelectionModelChange = useCallback(
    (model: GridRowSelectionModel) => {
      onSelectionChange?.(rowSelectionModelToSelectedRowIds(model, visibleRowIds))
    },
    [onSelectionChange, visibleRowIds],
  )

  const muiColumns = useMemo(
    () => buildMuiColumns({ columns, getDetailLink }),
    [columns, getDetailLink],
  )

  const filterById = useMemo(
    () => indexFiltersById(resolvedFilters),
    [resolvedFilters],
  )

  const renderFilterControl = useCallback(
    (f: AppDataGridFilter<T>, size: MuiTextFieldSize) =>
      renderAppDataGridFilterControl({ f, size, getFilterValue, setFilterValue }),
    [getFilterValue, setFilterValue],
  )

  const renderFilterById = useCallback(
    (id: string, size: MuiTextFieldSize) => {
      const f = filterById.get(id)
      if (!f) return null
      return renderFilterControl(f, size)
    },
    [filterById, renderFilterControl],
  )

  const badgeElements = useAppDataGridToolbarBadges({
    toolbarLayout,
    search,
    setSearch,
    filterValues,
    resolvedFilters,
    setFilterValue,
  })

  const allowedFilter = filterById.get(APP_DATA_GRID_ALLOWED_IN_CAMPAIGN_FILTER_ID)
  const allowedValue = allowedFilter ? (getFilterValue(allowedFilter) as string) : 'all'
  const showHideDisallowedUtility =
    Boolean(toolbarLayout?.utilities?.includes('hideDisallowed')) &&
    allowedFilter?.type === 'boolean' &&
    allowedValue !== 'false'

  const hideDisallowedChecked = allowedValue === 'true'

  const onHideDisallowedChange = useCallback(
    (checked: boolean) => {
      setFilterValue(APP_DATA_GRID_ALLOWED_IN_CAMPAIGN_FILTER_ID, checked ? 'true' : 'all')
    },
    [setFilterValue],
  )

  const showToolbar =
    toolbar || searchable || resolvedFilters.length > 0 || Boolean(toolbarLayout)

  return (
    <Box>
      {showToolbar && (
        <AppDataGridToolbar
          searchable={searchable}
          searchPlaceholder={searchPlaceholder}
          search={search}
          setSearch={setSearch}
          primaryFieldSize={primaryFieldSize}
          secondaryFieldSize={secondaryFieldSize}
          toolbar={toolbar}
          toolbarLayout={toolbarLayout}
          resolvedFilters={resolvedFilters}
          renderFilterControl={renderFilterControl}
          renderFilterById={renderFilterById}
          badgeElements={badgeElements}
          hasActiveToolbarState={hasActiveToolbarState}
          resetToolbar={resetToolbar}
          showHideDisallowedUtility={showHideDisallowedUtility}
          hideDisallowedChecked={hideDisallowedChecked}
          onHideDisallowedChange={onHideDisallowedChange}
        />
      )}

      <AppDataGridGridPresentation
        filteredRows={filteredRows}
        muiColumns={muiColumns}
        getRowId={getRowId}
        getRowClassName={getRowClassName}
        loading={loading}
        pageSizeOptions={pageSizeOptions}
        density={density}
        height={height}
        emptyMessage={emptyMessage}
        multiSelect={multiSelect}
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={
          multiSelect && onSelectionChange ? handleRowSelectionModelChange : undefined
        }
      />
    </Box>
  )
}
