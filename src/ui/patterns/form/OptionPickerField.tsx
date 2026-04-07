import { useCallback, useId, useMemo, useState } from 'react'

import CloseIcon from '@mui/icons-material/Close'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

export type PickerOption = {
  value: string
  label: string
  description?: string
  keywords?: string[]
  /** When true, the option appears in the list but cannot be chosen */
  disabled?: boolean
}

export type OptionPickerFieldProps = {
  label: string
  options: PickerOption[]
  value: string[]
  onChange: (next: string[]) => void
  maxItems?: number
  placeholder?: string
  disabled?: boolean
  emptyMessage?: string
  noResultsMessage?: string
  renderSelectedAs?: 'chip' | 'card'
  /** Shown below the filter input (not inside the dropdown panel) */
  helperText?: string
  className?: string
  /** When true, field shows validation error styling */
  error?: boolean
  /** Forwarded to the filter input (e.g. RHF blur validation) */
  onBlur?: () => void
}

function normalize(s: string) {
  return s.toLowerCase().trim()
}

function matchesFilter(opt: PickerOption, q: string): boolean {
  if (!q) return true
  const nq = normalize(q)
  if (normalize(opt.label).includes(nq)) return true
  if (opt.description && normalize(opt.description).includes(nq)) return true
  if (opt.keywords?.some((k) => normalize(k).includes(nq))) return true
  return false
}

export default function OptionPickerField({
  label,
  options,
  value,
  onChange,
  maxItems,
  placeholder,
  disabled,
  emptyMessage = 'No options available.',
  noResultsMessage = 'No matching options.',
  renderSelectedAs = 'card',
  helperText,
  className,
  error,
  onBlur,
}: OptionPickerFieldProps) {
  const [filter, setFilter] = useState('')
  const [open, setOpen] = useState(false)
  const inputId = useId()

  const selectedSet = useMemo(() => new Set(value), [value])

  /** Include options for selected ids missing from `options` (e.g. stale list) so cards/chips resolve labels. */
  const optionsForPicker = useMemo(() => {
    const byValue = new Map(options.map((o) => [o.value, o] as const))
    for (const v of value) {
      if (v && !byValue.has(v)) {
        byValue.set(v, { value: v, label: v })
      }
    }
    return [...byValue.values()]
  }, [options, value])

  const availableOptions = useMemo(
    () => optionsForPicker.filter((o) => !selectedSet.has(o.value)),
    [optionsForPicker, selectedSet],
  )

  const filtered = useMemo(
    () => availableOptions.filter((o) => matchesFilter(o, filter)),
    [availableOptions, filter],
  )

  const cannotAddMore = useMemo(() => {
    if (maxItems === undefined) return false
    if (value.length < maxItems) return false
    if (maxItems === 1 && value.length === 1) return false
    return true
  }, [maxItems, value.length])

  const handleSelect = useCallback(
    (opt: PickerOption) => {
      if (opt.disabled) return
      if (selectedSet.has(opt.value)) return

      if (maxItems === 1 && value.length === 1) {
        onChange([opt.value])
        setFilter('')
        return
      }

      if (cannotAddMore) return

      onChange([...value, opt.value])
      setFilter('')
    },
    [cannotAddMore, maxItems, onChange, selectedSet, value],
  )

  const handleRemove = (v: string) => {
    onChange(value.filter((x) => x !== v))
  }

  const resolveOption = (v: string) => optionsForPicker.find((o) => o.value === v)

  const renderSelectedLabel = (v: string) => resolveOption(v)?.label ?? v

  const renderSelectedDescription = (v: string) => resolveOption(v)?.description

  return (
    <FormControl
      fullWidth
      disabled={disabled}
      className={className}
      error={Boolean(error)}
    >
      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <Box>
          <TextField
            id={inputId}
            label={label}
            fullWidth
            size="small"
            placeholder={placeholder}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onFocus={() => !disabled && setOpen(true)}
            onBlur={onBlur}
            error={Boolean(error)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false)
                setFilter('')
              }
            }}
            disabled={disabled}
            autoComplete="off"
            slotProps={{
              htmlInput: {
                'aria-expanded': open,
                'aria-controls': open ? `${inputId}-listbox` : undefined,
                role: 'combobox',
              },
            }}
          />

          {open && (
            <Paper
              id={`${inputId}-listbox`}
              role="listbox"
              variant="outlined"
              sx={{
                maxHeight: 240,
                overflow: 'auto',
                mt: 1,
              }}
            >
              {options.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ p: 2 }}
                >
                  {emptyMessage}
                </Typography>
              ) : filtered.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ p: 2 }}
                >
                  {noResultsMessage}
                </Typography>
              ) : (
                <List dense disablePadding>
                  {filtered.map((opt) => (
                    <ListItemButton
                      key={opt.value}
                      role="option"
                      disabled={opt.disabled || cannotAddMore}
                      onClick={() => handleSelect(opt)}
                    >
                      <ListItemText
                        primary={opt.label}
                        secondary={opt.description}
                      />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </Paper>
          )}

          {helperText ? (
            <FormHelperText error={Boolean(error)} sx={{ mx: 0 }}>
              {helperText}
            </FormHelperText>
          ) : null}

          <Stack
            direction={renderSelectedAs === 'card' ? 'column' : 'row'}
            flexWrap={renderSelectedAs === 'chip' ? 'wrap' : undefined}
            gap={1}
            sx={{ mt: 1.5 }}
          >
            {value.map((v) =>
              renderSelectedAs === 'chip' ? (
                <Chip
                  key={v}
                  label={renderSelectedLabel(v)}
                  onDelete={() => handleRemove(v)}
                  disabled={disabled}
                />
              ) : (
                <Card
                  key={v}
                  variant="outlined"
                  sx={{ width: '100%', minWidth: 0 }}
                >
                  <CardContent
                    sx={{
                      py: 1,
                      px: 1.5,
                      '&:last-child': { pb: 1 },
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="flex-start"
                      justifyContent="space-between"
                      gap={1}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {renderSelectedLabel(v)}
                        </Typography>
                        {renderSelectedDescription(v) ? (
                          <Typography variant="caption" color="text.secondary">
                            {renderSelectedDescription(v)}
                          </Typography>
                        ) : null}
                      </Box>
                      <IconButton
                        size="small"
                        aria-label={`Remove ${renderSelectedLabel(v)}`}
                        onClick={() => handleRemove(v)}
                        disabled={disabled}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              ),
            )}
          </Stack>
        </Box>
      </ClickAwayListener>
    </FormControl>
  )
}
