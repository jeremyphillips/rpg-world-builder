import { useState, useEffect } from 'react'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import SaveIcon from '@mui/icons-material/Save'
import EditableField from './EditableField'

export type SelectOption = { id: string; label: string; disabled?: boolean }

export type EditableSelectProps = {
  label: string
  value: string
  onSave: (newValue: string) => Promise<void> | void
  options: SelectOption[]
  disabled?: boolean
  className?: string
  /** Placeholder for empty value in display and optional empty option in select. Omit to hide the empty option. */
  emptyLabel?: string
}

export default function EditableSelect({
  label,
  value,
  onSave,
  options,
  disabled = false,
  className,
  emptyLabel,
}: EditableSelectProps) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  const displayLabel = value
    ? options.find((o) => o.id === value)?.label ?? value
    : (emptyLabel ?? '—')

  return (
    <EditableField<string>
      label={label}
      value={value}
      onSave={onSave}
      renderDisplay={() => displayLabel}
      renderEdit={({ onSave: save, onClose, saving }) => (
        <>
          <TextField
            select
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            size="small"
            sx={{ minWidth: 140, flex: 1 }}
          >
            {emptyLabel != null && <MenuItem value="">{emptyLabel}</MenuItem>}
            {options.map((opt) => (
              <MenuItem key={opt.id} value={opt.id} disabled={opt.disabled}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          <Button size="small" variant="contained" startIcon={<SaveIcon />} onClick={() => save(local)} disabled={saving}>
            {saving ? '…' : 'Save'}
          </Button>
          <Button size="small" onClick={onClose}>
            Cancel
          </Button>
        </>
      )}
      disabled={disabled}
      className={className}
    />
  )
}
