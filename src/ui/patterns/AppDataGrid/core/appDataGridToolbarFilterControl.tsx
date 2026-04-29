import type { ReactNode } from 'react'

import IconButton from '@mui/material/IconButton'
import { AppMultiSelectCheckbox, AppSelect, AppTooltip } from '@/ui/primitives'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

import type { AppDataGridFilter, FilterOption } from '../types'
import { getClampedRangeFilterValue } from '../filters'
import AppToolbarDiscreteRangeField from '../toolbar/AppToolbarDiscreteRangeField'
import type { MuiDenseInputSize, MuiTextFieldSize } from '@/ui/sizes'

/** Inline toolbar filters: primitives default `fullWidth`; keep shrink-to-min in horizontal `Stack`. */
export const APP_DATA_GRID_FILTER_FIELD_SX = { minWidth: 160, width: 'auto', flex: '0 1 auto' }

/** When options include `value: ''` (e.g. "All"), pass label as placeholder for AppSelect empty state. */
export function selectPlaceholderForFilterOptions(options: FilterOption[]): string | undefined {
  const empty = options.find((o) => o.value === '')
  return empty?.label
}

export function renderAppDataGridFilterControl<T>({
  f,
  size,
  getFilterValue,
  setFilterValue,
}: {
  f: AppDataGridFilter<T>
  size: MuiTextFieldSize
  getFilterValue: (filter: AppDataGridFilter<T>) => unknown
  setFilterValue: (id: string, value: unknown) => void
}): ReactNode {
  const labelEndAdornment = f.description ? (
    <AppTooltip title={f.description}>
      <IconButton size="small" aria-label="Filter info" sx={{ p: 0.25 }}>
        <InfoOutlinedIcon fontSize="inherit" />
      </IconButton>
    </AppTooltip>
  ) : undefined
  const rangeSize: MuiDenseInputSize = size === 'large' ? 'medium' : size
  switch (f.type) {
    case 'select': {
      const placeholder = selectPlaceholderForFilterOptions(f.options)
      return (
        <AppSelect
          label={f.label}
          labelEndAdornment={labelEndAdornment}
          options={f.options}
          value={getFilterValue(f) as string}
          onChange={(v) => setFilterValue(f.id, v)}
          size={size}
          fullWidth={false}
          sx={APP_DATA_GRID_FILTER_FIELD_SX}
          placeholder={placeholder}
        />
      )
    }
    case 'multiSelect':
      return (
        <AppMultiSelectCheckbox
          label={f.label}
          labelEndAdornment={labelEndAdornment}
          options={f.options}
          value={(getFilterValue(f) as string[]) ?? []}
          onChange={(v) => setFilterValue(f.id, v)}
          size={size}
          fullWidth={false}
          displayMode="summary"
          sx={APP_DATA_GRID_FILTER_FIELD_SX}
        />
      )
    case 'boolean':
      return (
        <AppSelect
          label={f.label}
          labelEndAdornment={labelEndAdornment}
          options={[
            { value: 'all', label: 'All' },
            { value: 'true', label: f.trueLabel ?? 'Yes' },
            { value: 'false', label: f.falseLabel ?? 'No' },
          ]}
          value={getFilterValue(f) as string}
          onChange={(v) => setFilterValue(f.id, v)}
          size={size}
          fullWidth={false}
          sx={APP_DATA_GRID_FILTER_FIELD_SX}
        />
      )
    case 'range': {
      const clamped = getClampedRangeFilterValue(f, getFilterValue(f))
      return (
        <AppToolbarDiscreteRangeField
          label={f.label}
          steps={f.steps}
          value={clamped}
          onChange={(next) => setFilterValue(f.id, next)}
          formatValue={f.formatStepValue}
          size={rangeSize}
        />
      )
    }
  }
}
