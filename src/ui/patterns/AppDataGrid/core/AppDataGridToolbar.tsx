import type { ReactNode } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import InputAdornment from '@mui/material/InputAdornment'
import { AppTextField } from '@/ui/primitives'
import SearchIcon from '@mui/icons-material/Search'

import type { AppDataGridFilter, AppDataGridToolbarLayout } from '../types'
import type { MuiDenseInputSize, MuiTextFieldSize } from '@/ui/sizes'

type AppDataGridToolbarProps<T> = {
  searchable: boolean
  searchPlaceholder: string
  search: string
  setSearch: (v: string) => void
  primaryFieldSize: MuiTextFieldSize
  secondaryFieldSize: MuiDenseInputSize
  toolbar: ReactNode | undefined
  toolbarLayout: AppDataGridToolbarLayout | undefined
  resolvedFilters: AppDataGridFilter<T>[]
  renderFilterControl: (f: AppDataGridFilter<T>, size: MuiTextFieldSize) => ReactNode
  renderFilterById: (id: string, size: MuiTextFieldSize) => ReactNode
  badgeElements: ReactNode[]
  hasActiveToolbarState: boolean
  resetToolbar: () => void
  showHideDisallowedUtility: boolean
  hideDisallowedChecked: boolean
  onHideDisallowedChange: (checked: boolean) => void
}

export default function AppDataGridToolbar<T>({
  searchable,
  searchPlaceholder,
  search,
  setSearch,
  primaryFieldSize,
  secondaryFieldSize,
  toolbar,
  toolbarLayout,
  resolvedFilters,
  renderFilterControl,
  renderFilterById,
  badgeElements,
  hasActiveToolbarState,
  resetToolbar,
  showHideDisallowedUtility,
  hideDisallowedChecked,
  onHideDisallowedChange,
}: AppDataGridToolbarProps<T>) {
  const gapPrimary = primaryFieldSize === 'small' ? 1.5 : 3
  const gapSecondary = secondaryFieldSize === 'small' ? 1.5 : 3
  const primaryIds = toolbarLayout?.primary ?? []
  const secondaryIds = toolbarLayout?.secondary ?? []

  return (
    <>
      {toolbarLayout ? (
        <Stack spacing={2} sx={{ mb: 1.5 }}>
          <Stack
            direction="row"
            flexWrap="wrap"
            alignItems="center"
            gap={gapPrimary}
            sx={{ width: '100%' }}
          >
            {searchable && (
              <AppTextField
                size={primaryFieldSize}
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
            {primaryIds.map((id) => {
              const el = renderFilterById(id, primaryFieldSize)
              return el ? <Box key={id}>{el}</Box> : null
            })}
            {toolbar && <Box sx={{ ml: 'auto' }}>{toolbar}</Box>}
          </Stack>

          {(secondaryIds.length > 0 || showHideDisallowedUtility) && (
            <Stack
              direction="row"
              flexWrap="wrap"
              alignItems="center"
              justifyContent={showHideDisallowedUtility ? 'space-between' : 'flex-start'}
              gap={gapSecondary}
              sx={{ width: '100%' }}
            >
              <Stack direction="row" flexWrap="wrap" alignItems="center" gap={gapSecondary}>
                {secondaryIds.map((id) => {
                  const el = renderFilterById(id, secondaryFieldSize)
                  return el ? <Box key={id}>{el}</Box> : null
                })}
              </Stack>
              {showHideDisallowedUtility && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={hideDisallowedChecked}
                      onChange={(_e, checked) => onHideDisallowedChange(checked)}
                      size="small"
                    />
                  }
                  label="Hide disallowed"
                  sx={(theme) => ({
                    flexShrink: 0,
                    '& .MuiFormControlLabel-label': {
                      ...theme.typography.body2,
                    },
                  })}
                />
              )}
            </Stack>
          )}

          <Box
            sx={{
              minHeight: '30px',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
              rowGap: 1,
              mt: 0,
            }}
          >
            {hasActiveToolbarState && (
              <>
                {badgeElements}
                <Button size="small" variant="text" onClick={resetToolbar}>
                  Reset
                </Button>
              </>
            )}
          </Box>
        </Stack>
      ) : (
        <Stack
          direction="row"
          sx={{
            mb: 3,
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: primaryFieldSize === 'small' ? 1.5 : 3,
          }}
        >
          {searchable && (
            <AppTextField
              size={primaryFieldSize}
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

          {resolvedFilters.map((f) => (
            <Box key={f.id}>{renderFilterControl(f, primaryFieldSize)}</Box>
          ))}

          {toolbar && <Box sx={{ ml: 'auto' }}>{toolbar}</Box>}
        </Stack>
      )}
    </>
  )
}
